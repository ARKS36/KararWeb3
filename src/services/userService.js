import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  startAfter,
  serverTimestamp,
  deleteDoc,
  addDoc,
  arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase/config';

// Kullanıcı profil bilgilerini getir
export const getUserProfile = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Kullanıcı profili bulunamadı');
    }
    
    const userData = userDoc.data();
    
    return {
      id: uid,
      ...userData,
      createdAt: userData.createdAt?.toDate() || null,
      updatedAt: userData.updatedAt?.toDate() || null
    };
  } catch (error) {
    throw error;
  }
};

// Kullanıcı profilini oluştur veya güncelle
export const updateUserProfile = async (profileData, photoFile = null) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Bu işlemi gerçekleştirmek için giriş yapmalısınız');
    }
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    // Profil fotoğrafı yükleme işlemi
    let photoURL = profileData.photoURL || null;
    
    if (photoFile) {
      // Eski fotoğrafı sil (varsa ve storage referansıysa)
      if (userDoc.exists() && userDoc.data().photoURL && userDoc.data().photoURL.includes('firebase')) {
        try {
          const oldPhotoRef = ref(storage, `profile_photos/${user.uid}`);
          await deleteObject(oldPhotoRef);
        } catch (error) {
          console.error('Eski profil fotoğrafı silinirken hata:', error);
        }
      }
      
      // Yeni fotoğrafı yükle
      const photoRef = ref(storage, `profile_photos/${user.uid}`);
      await uploadBytes(photoRef, photoFile);
      photoURL = await getDownloadURL(photoRef);
    }
    
    // Kullanıcı verisini oluştur
    const userData = {
      displayName: profileData.displayName || '',
      bio: profileData.bio || '',
      location: profileData.location || '',
      interests: profileData.interests || [],
      photoURL: photoURL,
      updatedAt: serverTimestamp()
    };
    
    // Eğer kullanıcı dokümanı yoksa, oluştur
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        ...userData,
        email: user.email,
        role: 'user',
        createdAt: serverTimestamp(),
        protestCount: 0,
        commentCount: 0
      });
    } else {
      // Varsa güncelle
      await updateDoc(userRef, userData);
    }
    
    return {
      id: user.uid,
      ...userData,
      email: user.email
    };
  } catch (error) {
    throw error;
  }
};

// Kullanıcı rolünü güncelle (admin işlevi)
export const updateUserRole = async (userId, newRole) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Bu işlemi gerçekleştirmek için giriş yapmalısınız');
    }
    
    // Admin kontrolü
    const isAdmin = await checkIsAdmin();
    
    if (!isAdmin) {
      throw new Error('Bu işlemi gerçekleştirmek için admin yetkisine sahip olmalısınız');
    }
    
    // Geçerli roller: 'user', 'moderator', 'admin'
    const validRoles = ['user', 'moderator', 'admin'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error('Geçersiz rol. Geçerli roller: user, moderator, admin');
    }
    
    // Kullanıcının var olup olmadığını kontrol et
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    // Rolü güncelle
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    
    return {
      id: userId,
      role: newRole
    };
  } catch (error) {
    throw error;
  }
};

// Kullanıcı listesini getir (admin/moderatör işlevi)
export const getUsers = async (lastVisible = null, pageSize = 10) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Bu işlemi gerçekleştirmek için giriş yapmalısınız');
    }
    
    // Admin veya moderatör kontrolü
    const isAdminOrModerator = await checkIsAdminOrModerator();
    
    if (!isAdminOrModerator) {
      throw new Error('Bu işlemi gerçekleştirmek için admin veya moderatör yetkisine sahip olmalısınız');
    }
    
    const usersRef = collection(db, 'users');
    let usersQuery = query(
      usersRef,
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    // Sayfalama
    if (lastVisible) {
      usersQuery = query(usersQuery, startAfter(lastVisible));
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    const lastVisibleDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
    
    // Kullanıcıları al
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || null,
      updatedAt: doc.data().updatedAt?.toDate() || null
    }));
    
    return {
      users,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    throw error;
  }
};

// Kullanıcı ara
export const searchUsers = async (searchQuery) => {
  try {
    if (!searchQuery || searchQuery.trim().length < 2) {
      throw new Error('Arama sorgusu en az 2 karakter olmalıdır');
    }
    
    const searchLower = searchQuery.toLowerCase();
    const usersRef = collection(db, 'users');
    
    // FireStore'da tam metin araması mevcut olmadığı için
    // displayName'e göre basit bir sorgu yapıyoruz
    // Gerçek uygulamada Algolia gibi harici bir arama servisi kullanılabilir
    const usersSnapshot = await getDocs(usersRef);
    
    // Kullanıcı listesini manuel olarak filtrele
    const users = usersSnapshot.docs
      .filter(doc => {
        const userData = doc.data();
        const displayName = (userData.displayName || '').toLowerCase();
        return displayName.includes(searchLower);
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null
      }))
      .slice(0, 10); // Sonuç sayısını sınırla
    
    return users;
  } catch (error) {
    throw error;
  }
};

// Kullanıcıyı takip et/takibi bırak
export const followUser = async (targetUserId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Bu işlemi gerçekleştirmek için giriş yapmalısınız');
    }
    
    if (user.uid === targetUserId) {
      throw new Error('Kendinizi takip edemezsiniz');
    }
    
    // Hedef kullanıcının var olup olmadığını kontrol et
    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);
    
    if (!targetUserDoc.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    // Takip durumunu kontrol et
    const followRef = collection(db, 'follows');
    const followQuery = query(
      followRef,
      where('followerId', '==', user.uid),
      where('followingId', '==', targetUserId)
    );
    
    const followSnapshot = await getDocs(followQuery);
    
    // Kullanıcı zaten takip ediyorsa, takibi kaldır
    if (!followSnapshot.empty) {
      const followDoc = followSnapshot.docs[0];
      await updateDoc(doc(db, 'users', user.uid), {
        followingCount: (await getDoc(doc(db, 'users', user.uid))).data().followingCount - 1 || 0
      });
      
      await updateDoc(doc(db, 'users', targetUserId), {
        followerCount: (await getDoc(doc(db, 'users', targetUserId))).data().followerCount - 1 || 0
      });
      
      await deleteDoc(doc(db, 'follows', followDoc.id));
      
      return { action: 'unfollowed' };
    }
    
    // Kullanıcı takip etmiyorsa, takip et
    await addDoc(collection(db, 'follows'), {
      followerId: user.uid,
      followingId: targetUserId,
      createdAt: serverTimestamp()
    });
    
    // İlgili kullanıcıların takipçi/takip edilen sayılarını güncelle
    const currentUser = await getDoc(doc(db, 'users', user.uid));
    const targetUser = await getDoc(doc(db, 'users', targetUserId));
    
    await updateDoc(doc(db, 'users', user.uid), {
      followingCount: (currentUser.data().followingCount || 0) + 1
    });
    
    await updateDoc(doc(db, 'users', targetUserId), {
      followerCount: (targetUser.data().followerCount || 0) + 1
    });
    
    return { action: 'followed' };
  } catch (error) {
    throw error;
  }
};

// Kullanıcının takipçilerini getir
export const getUserFollowers = async (userId, lastVisible = null, pageSize = 10) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    const followsRef = collection(db, 'follows');
    let followsQuery = query(
      followsRef,
      where('followingId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    // Sayfalama
    if (lastVisible) {
      followsQuery = query(followsQuery, startAfter(lastVisible));
    }
    
    const followsSnapshot = await getDocs(followsQuery);
    const lastVisibleDoc = followsSnapshot.docs[followsSnapshot.docs.length - 1];
    
    // Takipçileri al
    const followers = [];
    
    for (const followDoc of followsSnapshot.docs) {
      const followData = followDoc.data();
      
      // Takipçi kullanıcı bilgilerini al
      try {
        const userDoc = await getDoc(doc(db, 'users', followData.followerId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          followers.push({
            id: userDoc.id,
            displayName: userData.displayName || 'Anonim',
            photoURL: userData.photoURL || null,
            bio: userData.bio || '',
            followedAt: followData.createdAt?.toDate() || null
          });
        }
      } catch (error) {
        console.error('Takipçi bilgileri alınırken hata:', error);
      }
    }
    
    return {
      followers,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    throw error;
  }
};

// Kullanıcının takip ettiklerini getir
export const getUserFollowing = async (userId, lastVisible = null, pageSize = 10) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    const followsRef = collection(db, 'follows');
    let followsQuery = query(
      followsRef,
      where('followerId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    // Sayfalama
    if (lastVisible) {
      followsQuery = query(followsQuery, startAfter(lastVisible));
    }
    
    const followsSnapshot = await getDocs(followsQuery);
    const lastVisibleDoc = followsSnapshot.docs[followsSnapshot.docs.length - 1];
    
    // Takip edilenleri al
    const following = [];
    
    for (const followDoc of followsSnapshot.docs) {
      const followData = followDoc.data();
      
      // Takip edilen kullanıcı bilgilerini al
      try {
        const userDoc = await getDoc(doc(db, 'users', followData.followingId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          following.push({
            id: userDoc.id,
            displayName: userData.displayName || 'Anonim',
            photoURL: userData.photoURL || null,
            bio: userData.bio || '',
            followedAt: followData.createdAt?.toDate() || null
          });
        }
      } catch (error) {
        console.error('Takip edilen bilgileri alınırken hata:', error);
      }
    }
    
    return {
      following,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    throw error;
  }
};

// Kullanıcının bir kullanıcıyı takip edip etmediğini kontrol et
export const checkIfUserFollows = async (targetUserId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    const followsRef = collection(db, 'follows');
    const followQuery = query(
      followsRef,
      where('followerId', '==', user.uid),
      where('followingId', '==', targetUserId)
    );
    
    const followSnapshot = await getDocs(followQuery);
    
    return !followSnapshot.empty;
  } catch (error) {
    console.error('Takip kontrolü sırasında hata:', error);
    return false;
  }
};

// Admin kontrolü
const checkIsAdmin = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Admin kontrolü sırasında hata:', error);
    return false;
  }
};

// Admin veya moderatör kontrolü
const checkIsAdminOrModerator = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists() && (userDoc.data().role === 'admin' || userDoc.data().role === 'moderator')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Yetki kontrolü sırasında hata:', error);
    return false;
  }
};

// Add activity to user's recent activity
export const addUserActivity = async (userId, activityData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Create activity object with timestamp
    const activity = {
      ...activityData,
      date: serverTimestamp()
    };
    
    // Add to user's activities array, limit to 20 most recent
    await updateDoc(userRef, {
      recentActivity: arrayUnion(activity)
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error adding user activity:", error);
    return { success: false, error: error.message };
  }
};

// Get user activity data
export const getUserActivity = async (userId) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('Kullanıcı kimliği belirtilmedi');
    }
    
    // Get user document to check if it exists
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    const activities = [];
    
    // 1. Get protests created by the user
    const protestsRef = collection(db, 'protests');
    const protestsQuery = query(
      protestsRef,
      where('creatorUserId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    const protestsSnapshot = await getDocs(protestsQuery);
    
    protestsSnapshot.forEach(doc => {
      const protest = doc.data();
      activities.push({
        type: 'protest_create',
        text: `"${protest.title}" protestosunu oluşturdunuz`,
        date: protest.createdAt.toDate(),
        id: doc.id,
        entityType: 'protest'
      });
    });
    
    // 2. Get boycotts created by the user
    const boycottsRef = collection(db, 'boycotts');
    const boycottsQuery = query(
      boycottsRef,
      where('creatorUserId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    const boycottsSnapshot = await getDocs(boycottsQuery);
    
    boycottsSnapshot.forEach(doc => {
      const boycott = doc.data();
      activities.push({
        type: 'boycott_create',
        text: `"${boycott.title}" boykotunu oluşturdunuz`,
        date: boycott.createdAt.toDate(),
        id: doc.id,
        entityType: 'boycott'
      });
    });
    
    // 3. Get user's protest votes
    const protestVotesRef = collection(db, 'protestVotes');
    const protestVotesQuery = query(
      protestVotesRef,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    const protestVotesSnapshot = await getDocs(protestVotesQuery);
    
    for (const voteDoc of protestVotesSnapshot.docs) {
      const vote = voteDoc.data();
      
      // Get protest details
      try {
        const protestDoc = await getDoc(doc(db, 'protests', vote.protestId));
        if (protestDoc.exists()) {
          const protest = protestDoc.data();
          activities.push({
            type: vote.vote === 'support' ? 'protest_support' : 'protest_oppose',
            text: `"${protest.title}" protestosunu ${vote.vote === 'support' ? 'desteklediniz' : 'karşı çıktınız'}`,
            date: vote.createdAt.toDate(),
            id: vote.protestId,
            entityType: 'protest'
          });
        }
      } catch (error) {
        console.error(`Protest data fetch error for ${vote.protestId}:`, error);
      }
    }
    
    // 4. Get user's boycott votes
    const boycottVotesRef = collection(db, 'boycottVotes');
    const boycottVotesQuery = query(
      boycottVotesRef,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    const boycottVotesSnapshot = await getDocs(boycottVotesQuery);
    
    for (const voteDoc of boycottVotesSnapshot.docs) {
      const vote = voteDoc.data();
      
      // Get boycott details
      try {
        const boycottDoc = await getDoc(doc(db, 'boycotts', vote.boycottId));
        if (boycottDoc.exists()) {
          const boycott = boycottDoc.data();
          activities.push({
            type: vote.vote === 'support' ? 'boycott_support' : 'boycott_oppose',
            text: `"${boycott.title}" boykotunu ${vote.vote === 'support' ? 'desteklediniz' : 'karşı çıktınız'}`,
            date: vote.createdAt.toDate(),
            id: vote.boycottId,
            entityType: 'boycott'
          });
        }
      } catch (error) {
        console.error(`Boycott data fetch error for ${vote.boycottId}:`, error);
      }
    }
    
    // 5. Get user's comments
    const commentsRef = collection(db, 'comments');
    const commentsQuery = query(
      commentsRef,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    
    const commentsSnapshot = await getDocs(commentsQuery);
    
    for (const commentDoc of commentsSnapshot.docs) {
      const comment = commentDoc.data();
      
      if (comment.entityType === 'protest') {
        // Get protest details
        try {
          const protestDoc = await getDoc(doc(db, 'protests', comment.entityId));
          if (protestDoc.exists()) {
            const protest = protestDoc.data();
            activities.push({
              type: 'protest_comment',
              text: `"${protest.title}" protestosuna yorum yaptınız`,
              date: comment.createdAt.toDate(),
              id: comment.entityId,
              entityType: 'protest'
            });
          }
        } catch (error) {
          console.error(`Protest data fetch error for comment on ${comment.entityId}:`, error);
        }
      } else if (comment.entityType === 'boycott') {
        // Get boycott details
        try {
          const boycottDoc = await getDoc(doc(db, 'boycotts', comment.entityId));
          if (boycottDoc.exists()) {
            const boycott = boycottDoc.data();
            activities.push({
              type: 'boycott_comment',
              text: `"${boycott.title}" boykotuna yorum yaptınız`,
              date: comment.createdAt.toDate(),
              id: comment.entityId,
              entityType: 'boycott'
            });
          }
        } catch (error) {
          console.error(`Boycott data fetch error for comment on ${comment.entityId}:`, error);
        }
      }
    }
    
    // Sort all activities by date (newest first)
    activities.sort((a, b) => b.date - a.date);
    
    return { success: true, activities };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return { success: false, error: error.message };
  }
};

// Get user statistics (created, supported protests/boycotts)
export const getUserStats = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { 
        success: false, 
        error: "User not found" 
      };
    }
    
    const userData = userDoc.data();
    
    // Query protests created by user
    const protestsQuery = query(
      collection(db, 'protests'),
      where('creatorUserId', '==', userId)
    );
    const protestsSnapshot = await getDocs(protestsQuery);
    
    // Query boycotts created by user
    const boycottsQuery = query(
      collection(db, 'boycotts'),
      where('creatorUserId', '==', userId)
    );
    const boycottsSnapshot = await getDocs(boycottsQuery);
    
    // Get supported and opposed counts
    const supportedProtests = userData.supportedProtests?.length || 0;
    const opposedProtests = userData.opposedProtests?.length || 0;
    const supportedBoycotts = userData.supportedBoycotts?.length || 0;
    const opposedBoycotts = userData.opposedBoycotts?.length || 0;
    
    return {
      success: true,
      stats: {
        createdProtests: protestsSnapshot.size,
        createdBoycotts: boycottsSnapshot.size,
        supportedProtests,
        opposedProtests,
        supportedBoycotts,
        opposedBoycotts
      }
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { success: false, error: error.message };
  }
}; 