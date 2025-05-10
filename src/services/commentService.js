import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';

// Bir protestoya ait yorumları getir (sayfalama ile)
export const getComments = async (protestId, lastVisible = null, pageSize = 10) => {
  try {
    const commentsRef = collection(db, 'comments');
    let commentsQuery = query(
      commentsRef, 
      where('protestId', '==', protestId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    // Sayfalama
    if (lastVisible) {
      commentsQuery = query(commentsQuery, startAfter(lastVisible));
    }
    
    const commentsSnapshot = await getDocs(commentsQuery);
    const lastVisibleDoc = commentsSnapshot.docs[commentsSnapshot.docs.length - 1];
    
    // Yorumları al
    const comments = [];
    
    for (const commentDoc of commentsSnapshot.docs) {
      const commentData = commentDoc.data();
      
      // Yorum sahibinin bilgilerini al
      let userData = { displayName: 'Anonim' };
      
      try {
        const userDoc = await getDoc(doc(db, 'users', commentData.userId));
        if (userDoc.exists()) {
          userData = {
            displayName: userDoc.data().displayName || 'Anonim',
            photoURL: userDoc.data().photoURL || null
          };
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri alınırken hata:', error);
      }
      
      comments.push({
        id: commentDoc.id,
        ...commentData,
        user: userData
      });
    }
    
    return {
      comments,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    throw error;
  }
};

// Yeni yorum ekle
export const addComment = async (protestId, commentText) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Yorum yapabilmek için giriş yapmalısınız');
    }
    
    // Önce protestonun var olup olmadığını kontrol et
    const protestDoc = await getDoc(doc(db, 'protests', protestId));
    
    if (!protestDoc.exists()) {
      throw new Error('Protesto bulunamadı');
    }
    
    // Yorum nesnesini oluştur
    const comment = {
      protestId,
      userId: user.uid,
      text: commentText,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: 0
    };
    
    // Yorumu Firestore'a ekle
    const commentRef = await addDoc(collection(db, 'comments'), comment);
    
    // Protestonun yorum sayısını güncelle
    await updateDoc(doc(db, 'protests', protestId), {
      commentCount: increment(1)
    });
    
    // Kullanıcı bilgilerini al
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let userData = { displayName: 'Anonim' };
    
    if (userDoc.exists()) {
      userData = {
        displayName: userDoc.data().displayName || 'Anonim',
        photoURL: userDoc.data().photoURL || null
      };
    }
    
    return {
      id: commentRef.id,
      ...comment,
      user: userData
    };
  } catch (error) {
    throw error;
  }
};

// Yorum güncelle
export const updateComment = async (commentId, commentText) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Bu işlemi gerçekleştirmek için giriş yapmalısınız');
    }
    
    // Yorum bilgilerini al
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Yorum bulunamadı');
    }
    
    const commentData = commentDoc.data();
    
    // Kullanıcının yetki kontrolü
    if (commentData.userId !== user.uid) {
      const isAdmin = await checkIsAdmin();
      if (!isAdmin) {
        throw new Error('Bu yorumu düzenleme yetkiniz yok');
      }
    }
    
    // Yorumu güncelle
    await updateDoc(commentRef, {
      text: commentText,
      updatedAt: serverTimestamp()
    });
    
    return {
      id: commentId,
      ...commentData,
      text: commentText,
      updatedAt: new Date()
    };
  } catch (error) {
    throw error;
  }
};

// Yorum sil
export const deleteComment = async (commentId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Bu işlemi gerçekleştirmek için giriş yapmalısınız');
    }
    
    // Yorum bilgilerini al
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Yorum bulunamadı');
    }
    
    const commentData = commentDoc.data();
    
    // Kullanıcının yetki kontrolü
    if (commentData.userId !== user.uid) {
      const isAdmin = await checkIsAdmin();
      if (!isAdmin) {
        throw new Error('Bu yorumu silme yetkiniz yok');
      }
    }
    
    // Yorumu sil
    await deleteDoc(commentRef);
    
    // Protestonun yorum sayısını güncelle
    const protestRef = doc(db, 'protests', commentData.protestId);
    const protestDoc = await getDoc(protestRef);
    
    if (protestDoc.exists()) {
      await updateDoc(protestRef, {
        commentCount: increment(-1)
      });
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Yorumu beğen/beğenmekten vazgeç
export const likeComment = async (commentId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Bu işlemi gerçekleştirmek için giriş yapmalısınız');
    }
    
    // Yorumun var olup olmadığını kontrol et
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Yorum bulunamadı');
    }
    
    // Kullanıcının beğeni durumunu kontrol et
    const likeRef = collection(db, 'comment_likes');
    const likeQuery = query(
      likeRef,
      where('commentId', '==', commentId),
      where('userId', '==', user.uid)
    );
    
    const likeSnapshot = await getDocs(likeQuery);
    
    // Kullanıcı yorumu zaten beğenmişse, beğeniyi kaldır
    if (!likeSnapshot.empty) {
      const likeDoc = likeSnapshot.docs[0];
      await deleteDoc(doc(db, 'comment_likes', likeDoc.id));
      
      // Yorum beğeni sayısını azalt
      await updateDoc(commentRef, {
        likeCount: increment(-1)
      });
      
      return { action: 'removed' };
    }
    
    // Kullanıcı yorumu beğenmemişse, beğeni ekle
    await addDoc(collection(db, 'comment_likes'), {
      commentId,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
    
    // Yorum beğeni sayısını arttır
    await updateDoc(commentRef, {
      likeCount: increment(1)
    });
    
    return { action: 'added' };
  } catch (error) {
    throw error;
  }
};

// Kullanıcının bir yorumu beğenip beğenmediğini kontrol et
export const checkIfUserLikedComment = async (commentId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    const likeRef = collection(db, 'comment_likes');
    const likeQuery = query(
      likeRef,
      where('commentId', '==', commentId),
      where('userId', '==', user.uid)
    );
    
    const likeSnapshot = await getDocs(likeQuery);
    
    return !likeSnapshot.empty;
  } catch (error) {
    console.error('Beğeni kontrolü sırasında hata:', error);
    return false;
  }
};

// Kullanıcının yorumlarını getir
export const getUserComments = async (userId = null, lastVisible = null, pageSize = 10) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    const commentsRef = collection(db, 'comments');
    let commentsQuery = query(
      commentsRef,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    // Sayfalama
    if (lastVisible) {
      commentsQuery = query(commentsQuery, startAfter(lastVisible));
    }
    
    const commentsSnapshot = await getDocs(commentsQuery);
    const lastVisibleDoc = commentsSnapshot.docs[commentsSnapshot.docs.length - 1];
    
    // Yorumları al
    const comments = [];
    
    for (const commentDoc of commentsSnapshot.docs) {
      const commentData = commentDoc.data();
      
      // Protestonun bilgilerini al
      let protestData = { title: 'Bilinmeyen Protesto' };
      
      try {
        const protestDoc = await getDoc(doc(db, 'protests', commentData.protestId));
        if (protestDoc.exists()) {
          protestData = {
            id: protestDoc.id,
            title: protestDoc.data().title || 'Bilinmeyen Protesto',
            imageUrl: protestDoc.data().imageUrl || null
          };
        }
      } catch (error) {
        console.error('Protesto bilgileri alınırken hata:', error);
      }
      
      comments.push({
        id: commentDoc.id,
        ...commentData,
        protest: protestData
      });
    }
    
    return {
      comments,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    throw error;
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