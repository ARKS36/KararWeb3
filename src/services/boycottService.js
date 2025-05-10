import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  increment,
  setDoc,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { auth } from '../firebase/config';
import { getAuth } from 'firebase/auth';
import { generateSearchKeywords, prepareTextForSearch } from '../utils/searchUtils';

// Get all boycotts (regardless of approval status)
export const getBoycotts = async (lastVisible = null, pageSize = 10, filters = {}) => {
  try {
    const boycottsRef = collection(db, 'boycotts');
    let boycottQuery = query(boycottsRef, orderBy('createdAt', 'desc'), limit(pageSize));
    
    // Filtering
    if (filters.mainCategory) {
      boycottQuery = query(boycottQuery, where('mainCategory', '==', filters.mainCategory));
    }

    if (filters.subCategory) {
      boycottQuery = query(boycottQuery, where('subCategory', '==', filters.subCategory));
    }

    // Pagination
    if (lastVisible) {
      boycottQuery = query(boycottQuery, startAfter(lastVisible));
    }
    
    const boycottSnapshot = await getDocs(boycottQuery);
    const lastVisibleDoc = boycottSnapshot.docs[boycottSnapshot.docs.length - 1];
    
    const boycotts = boycottSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return {
      boycotts,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    throw error;
  }
};

// Get a specific boycott
export const getBoycott = async (boycottId) => {
  try {
    const docRef = doc(db, 'boycotts', boycottId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, boycott: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Boykot bulunamadı' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add new boycott - onay bekleyen olarak ekle
export const addBoycott = async (boycottData, userId) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.' };
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';
    
    // Sanitize user input to prevent XSS
    const sanitizedBoycottData = {
      ...boycottData,
      title: boycottData.title ? sanitizeInput(boycottData.title) : '',
      description: boycottData.description ? sanitizeInput(boycottData.description) : '',
      location: boycottData.location ? sanitizeInput(boycottData.location) : '',
      mainCategory: boycottData.mainCategory ? sanitizeInput(boycottData.mainCategory) : '',
      subCategory: boycottData.subCategory ? sanitizeInput(boycottData.subCategory) : '',
    };
    
    const boycottRef = doc(collection(db, 'boycotts'));
    const searchKeywords = generateSearchKeywords(sanitizedBoycottData);

    // Handle image upload for admin users
    let imageUrl = null;
    if (isAdmin && boycottData.imageFile) {
      try {
        // Validate file type and size
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        
        if (!validImageTypes.includes(boycottData.imageFile.type)) {
          return { success: false, error: 'Geçersiz dosya formatı. Lütfen JPEG, PNG, GIF veya WEBP formatında bir resim yükleyin.' };
        }
        
        if (boycottData.imageFile.size > maxSizeInBytes) {
          return { success: false, error: 'Dosya boyutu çok büyük. Maksimum 5MB yükleyebilirsiniz.' };
        }
        
        // Create a reference to the storage location
        const imageFileName = `boycotts/${Date.now()}_${sanitizeFilename(boycottData.imageFile.name)}`;
        const storageRef = ref(storage, imageFileName);
        
        // Upload the image
        await uploadBytes(storageRef, boycottData.imageFile);
        
        // Get the URL of the uploaded image
        imageUrl = await getDownloadURL(storageRef);
      } catch (error) {
        console.error("Error uploading image:", error);
        return { success: false, error: 'Resim yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' };
      }
    }

    const boycottWithMetadata = {
      ...sanitizedBoycottData,
      id: boycottRef.id,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      supportCount: 0,
      oppositionCount: 0,
      isApproved: false,
      status: 'pending',
      searchKeywords,
      requiresImageReview: !isAdmin && boycottData.imageFile ? true : false,
    };

    // Add image URL if we have one (admin user)
    if (imageUrl) {
      boycottWithMetadata.imageUrl = imageUrl;
    }
    
    // Remove the image file property as we don't store the actual file in Firestore
    if (boycottWithMetadata.imageFile) {
      delete boycottWithMetadata.imageFile;
    }

    await setDoc(boycottRef, boycottWithMetadata);
    return { success: true, boycottId: boycottRef.id };
  } catch (error) {
    console.error('Boykot eklenirken hata oluştu:', error);
    return { success: false, error: 'Boykot eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' };
  }
};

// Helper function to sanitize user input
function sanitizeInput(input) {
  if (!input) return '';
  
  // Convert to string if not already
  const str = String(input);
  
  // Basic XSS protection
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Helper function to sanitize filenames
function sanitizeFilename(filename) {
  if (!filename) return '';
  
  // Remove path traversal attempts and non-standard characters
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\.\./g, '-');
}

// Get user's own boycotts
export const getUserBoycotts = async (userId) => {
  try {
    const q = query(
      collection(db, 'boycotts'),
      where('creatorUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const boycotts = [];
    
    querySnapshot.forEach((doc) => {
      boycotts.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, boycotts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Handle vote on a boycott - add, remove, or change vote
export const voteOnBoycott = async (boycottId, userId, voteType) => {
  try {
    console.log(`Attempting to vote on boycott: boycottId=${boycottId}, userId=${userId}, voteType=${voteType}`);
    
    // Ensure the user is authenticated
    if (!userId) {
      console.log('No userId provided');
      return { success: false, error: 'Oy vermek için giriş yapmalısınız.' };
    }
    
    // Get current auth state and refresh token if needed
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.' };
    }

    try {
      // Refresh the token before proceeding
      await currentUser.getIdToken(true);
    } catch (tokenError) {
      console.error('Token yenileme hatası:', tokenError);
      return { success: false, error: 'Oturum süreniz dolmuş olabilir. Lütfen sayfayı yenileyip tekrar deneyin.' };
    }
    
    // Normalize vote type
    const normalizedVoteType = voteType === 'oppose' ? 'opposition' : voteType;
    
    // Create a consistent document ID to prevent duplicate votes
    const voteId = `${boycottId}_${userId}`;
    
    // Get boycott document to verify it exists
    const boycottRef = doc(db, 'boycotts', boycottId);
    const boycottDoc = await getDoc(boycottRef);
    
    if (!boycottDoc.exists()) {
      console.log('Boycott document does not exist');
      return { success: false, error: 'Boykot bulunamadı.' };
    }
    
    // Get vote document if it exists
    const voteRef = doc(db, 'boycottVotes', voteId);
    const voteDoc = await getDoc(voteRef);
    
    // Start a batch write for atomic operations
    const batch = writeBatch(db);
    
    if (voteDoc.exists()) {
      const existingVote = voteDoc.data();
      const existingVoteType = existingVote.vote;
      
      // If same vote, remove it (toggle off)
      if (existingVoteType === normalizedVoteType) {
        // Update boycott counters
        batch.update(boycottRef, {
          [`${normalizedVoteType}Count`]: increment(-1)
        });
        
        // Delete vote document
        batch.delete(voteRef);
        
        // Commit the batch
        await batch.commit();
        
        return { success: true, action: 'removed', voteType: normalizedVoteType };
      }
      // If different vote, change it
      else {
        // Update boycott counters
        batch.update(boycottRef, {
          [`${existingVoteType}Count`]: increment(-1),
          [`${normalizedVoteType}Count`]: increment(1)
        });
        
        // Update vote document
        batch.update(voteRef, {
          vote: normalizedVoteType,
          timestamp: serverTimestamp()
        });
        
        // Commit the batch
        await batch.commit();
        
        return { success: true, action: 'changed', voteType: normalizedVoteType };
      }
    }
    // Create new vote
    else {
      // Create vote document
      batch.set(voteRef, {
        userId,
        boycottId,
        vote: normalizedVoteType,
        timestamp: serverTimestamp()
      });
      
      // Update boycott counter
      batch.update(boycottRef, {
        [`${normalizedVoteType}Count`]: increment(1)
      });
      
      // Commit the batch
      await batch.commit();
      
      return { success: true, action: 'added', voteType: normalizedVoteType };
    }
  } catch (error) {
    console.error("Error voting on boycott:", error);
    return { success: false, error: error.message };
  }
};

// Get user vote on a specific boycott
export const getUserVoteOnBoycott = async (boycottId, userId) => {
  try {
    console.log(`Checking user vote on boycott: boycottId=${boycottId}, userId=${userId}`);
    
    if (!userId) {
      console.log('No userId provided, returning null vote');
      return { success: true, vote: null };
    }
    
    const voteId = `${boycottId}_${userId}`;
    console.log(`Looking up vote with ID: ${voteId}`);
    
    const voteRef = doc(db, 'boycottVotes', voteId);
    const voteDoc = await getDoc(voteRef);
    
    if (voteDoc.exists()) {
      const voteData = voteDoc.data();
      console.log('Vote found:', voteData);
      
      // Normalize 'oppose' to 'opposition' for consistency
      let normalizedVoteType = voteData.vote;
      if (voteData.vote === 'oppose') {
        console.log('Normalizing found vote from "oppose" to "opposition"');
        normalizedVoteType = 'opposition';
        
        // Optionally update the document to use the normalized vote type
        // This helps gradually migrate votes without requiring a full migration
        // Note: This could fail if the user doesn't have write permissions
        try {
          await updateDoc(voteRef, {
            vote: 'opposition',
            lastModified: serverTimestamp()
          });
          console.log('Successfully updated vote document to use "opposition"');
        } catch (error) {
          console.warn('Could not update vote document to normalized type:', error.message);
          // Continue with the normalized type even if the update fails
        }
      }
      
      return { success: true, vote: normalizedVoteType };
    } else {
      console.log('No vote found for this user on this boycott');
      return { success: true, vote: null };
    }
  } catch (error) {
    console.error("Error getting user boycott vote:", error);
    return { success: false, error: error.message };
  }
};

// Approve boycott
export const approveBoycott = async (boycottId) => {
  try {
    const boycottRef = doc(db, 'boycotts', boycottId);
    await updateDoc(boycottRef, {
      isApproved: true,
      approvedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get pending boycotts for admin
export const getPendingBoycotts = async () => {
  try {
    const q = query(
      collection(db, 'boycotts'),
      where('isApproved', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const boycotts = [];
    
    querySnapshot.forEach((doc) => {
      boycotts.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, boycotts };
  } catch (error) {
    console.error("Error getting pending boycotts:", error);
    return { success: false, error: error.message };
  }
};

// Get boycotts by main category
export const getBoycottsByMainCategory = async (mainCategory) => {
  try {
    const q = query(
      collection(db, 'boycotts'),
      where('mainCategory', '==', mainCategory),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const boycotts = [];
    
    querySnapshot.forEach((doc) => {
      boycotts.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, boycotts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get boycotts by sub category
export const getBoycottsBySubCategory = async (mainCategory, subCategory) => {
  try {
    const q = query(
      collection(db, 'boycotts'),
      where('mainCategory', '==', mainCategory),
      where('subCategory', '==', subCategory),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const boycotts = [];
    
    querySnapshot.forEach((doc) => {
      boycotts.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, boycotts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete a boycott
export const deleteBoycott = async (boycottId) => {
  try {
    const boycottRef = doc(db, 'boycotts', boycottId);
    
    // Get all votes for this boycott to delete them
    const votesQuery = query(
      collection(db, 'boycottVotes'),
      where('boycottId', '==', boycottId)
    );
    
    const votesSnapshot = await getDocs(votesQuery);
    
    // Delete all votes
    const deleteVotePromises = votesSnapshot.docs.map(voteDoc => 
      deleteDoc(doc(db, 'boycottVotes', voteDoc.id))
    );
    
    await Promise.all(deleteVotePromises);
    
    // Delete the boycott document
    await deleteDoc(boycottRef);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all boycotts for admin
export const getAllBoycotts = async () => {
  try {
    const q = query(
      collection(db, 'boycotts'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const boycotts = [];
    
    querySnapshot.forEach((doc) => {
      boycotts.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, boycotts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update boycott approval status
export const updateBoycottApproval = async (boycottId, approved) => {
  try {
    const boycottRef = doc(db, 'boycotts', boycottId);
    await updateDoc(boycottRef, {
      isApproved: approved,
      approvedAt: approved ? serverTimestamp() : null
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get featured boycotts
export const getFeaturedBoycotts = async () => {
  try {
    const q = query(
      collection(db, 'boycotts'),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const boycotts = [];
    
    querySnapshot.forEach((doc) => {
      boycotts.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("getFeaturedBoycotts service: Found", boycotts.length, "featured boycotts");
    return { success: true, boycotts };
  } catch (error) {
    console.error("getFeaturedBoycotts error:", error);
    return { success: false, error: error.message };
  }
};

// Update boycott featured status
export const updateBoycottFeatured = async (boycottId, isFeatured) => {
  try {
    const boycottRef = doc(db, 'boycotts', boycottId);
    await updateDoc(boycottRef, {
      isFeatured: isFeatured
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Admin function: Update boycott status (active/pending/blocked)
export const updateBoycottStatus = async (boycottId, status) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
    }
    
    // Admin check
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      throw new Error('Bu işlemi gerçekleştirme yetkiniz bulunmamaktadır.');
    }
    
    const boycottRef = doc(db, 'boycotts', boycottId);
    
    await updateDoc(boycottRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating boycott status:", error);
    return { success: false, error: error.message };
  }
};

// Update boycott (admin function)
export const updateBoycott = async (boycottId, boycottData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.' };
    }
    
    // Admin check
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return { success: false, error: 'Bu işlemi gerçekleştirme yetkiniz bulunmamaktadır.' };
    }
    
    // Validate boycott ID
    if (!boycottId || typeof boycottId !== 'string') {
      return { success: false, error: 'Geçersiz boykot ID\'si.' };
    }

    // Check if boycott exists
    const boycottRef = doc(db, 'boycotts', boycottId);
    const boycottDoc = await getDoc(boycottRef);
    
    if (!boycottDoc.exists()) {
      return { success: false, error: 'Boykot bulunamadı.' };
    }
    
    // Sanitize user input
    const sanitizedBoycottData = {
      ...boycottData,
      title: boycottData.title ? sanitizeInput(boycottData.title) : boycottDoc.data().title,
      description: boycottData.description ? sanitizeInput(boycottData.description) : boycottDoc.data().description,
      location: boycottData.location ? sanitizeInput(boycottData.location) : boycottDoc.data().location,
      mainCategory: boycottData.mainCategory ? sanitizeInput(boycottData.mainCategory) : boycottDoc.data().mainCategory,
      subCategory: boycottData.subCategory ? sanitizeInput(boycottData.subCategory) : boycottDoc.data().subCategory,
    };
    
    // If an image file is provided, upload it first
    if (boycottData.imageFile) {
      try {
        // Validate file type and size
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        
        if (!validImageTypes.includes(boycottData.imageFile.type)) {
          return { success: false, error: 'Geçersiz dosya formatı. Lütfen JPEG, PNG, GIF veya WEBP formatında bir resim yükleyin.' };
        }
        
        if (boycottData.imageFile.size > maxSizeInBytes) {
          return { success: false, error: 'Dosya boyutu çok büyük. Maksimum 5MB yükleyebilirsiniz.' };
        }
        
        // Delete old image if it exists
        if (boycottDoc.data().imageUrl) {
          try {
            const oldImagePath = decodeURIComponent(boycottDoc.data().imageUrl.split('boycotts%2F')[1].split('?')[0]);
            const oldImageRef = ref(storage, `boycotts/${oldImagePath}`);
            await deleteObject(oldImageRef).catch(error => {
              console.log('Old image not found or already deleted:', error);
            });
          } catch (error) {
            console.error("Error deleting old image:", error);
            // Continue with upload even if deleting old image fails
          }
        }
      
        // Create a reference to the storage location
        const imageFileName = `boycotts/${Date.now()}_${sanitizeFilename(boycottData.imageFile.name)}`;
        const storageRef = ref(storage, imageFileName);
        
        // Upload the image
        await uploadBytes(storageRef, boycottData.imageFile);
        
        // Get the URL of the uploaded image
        const imageUrl = await getDownloadURL(storageRef);
        
        // Add the image URL to the boycott data and remove the file
        sanitizedBoycottData.imageUrl = imageUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        return { success: false, error: 'Resim yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' };
      }
    }
    
    // Remove the image file property as we don't store the actual file in Firestore
    if (sanitizedBoycottData.imageFile) {
      delete sanitizedBoycottData.imageFile;
    }
    
    // Update search keywords if title or description changed
    if (sanitizedBoycottData.title !== boycottDoc.data().title || 
        sanitizedBoycottData.description !== boycottDoc.data().description) {
      sanitizedBoycottData.searchKeywords = generateSearchKeywords(sanitizedBoycottData);
    }
    
    await updateDoc(boycottRef, {
      ...sanitizedBoycottData,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating boycott:", error);
    return { success: false, error: 'Boykot güncellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' };
  }
};

// Update boycott vote counts (admin function)
export const updateBoycottVotes = async (boycottId, supportCount, oppositionCount) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.' };
    }
    
    // Admin check
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return { success: false, error: 'Bu işlemi gerçekleştirme yetkiniz bulunmamaktadır.' };
    }
    
    const boycottRef = doc(db, 'boycotts', boycottId);
    await updateDoc(boycottRef, {
      supportCount: parseInt(supportCount, 10),
      oppositionCount: parseInt(oppositionCount, 10),
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Oy sayıları güncellenirken hata oluştu:", error);
    return { success: false, error: error.message };
  }
};

// Search boycotts
export const searchBoycotts = async ({
  searchTerm = '',
  mainCategory = '',
  subCategory = '',
  location = '',
  startDate = null,
  endDate = null,
  isApproved = null,
  limitCount = 10
}) => {
  try {
    let boycottQuery = collection(db, 'boycotts');
    let conditions = [];
    
    // Only filter by approval status if explicitly specified
    if (isApproved !== null) {
      boycottQuery = query(boycottQuery, where('isApproved', '==', isApproved));
    }
    
    // Add category filters if provided
    if (mainCategory) {
      boycottQuery = query(boycottQuery, where('mainCategory', '==', mainCategory));
    }
    
    if (subCategory) {
      boycottQuery = query(boycottQuery, where('subCategory', '==', subCategory));
    }
    
    // Add date filters if provided
    if (startDate) {
      boycottQuery = query(boycottQuery, where('createdAt', '>=', startDate));
    }
    
    if (endDate) {
      boycottQuery = query(boycottQuery, where('createdAt', '<=', endDate));
    }
    
    // Order by creation date
    boycottQuery = query(boycottQuery, orderBy('createdAt', 'desc'));
    
    // Apply limit
    boycottQuery = query(boycottQuery, limit(limitCount));
    
    // Get boycotts that match the above criteria
    const querySnapshot = await getDocs(boycottQuery);
    let boycotts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply text search filter if provided (client-side)
    if (searchTerm) {
      boycotts = boycotts.filter(boycott => {
        // Check if boycott has searchKeywords field
        if (boycott.searchKeywords && Array.isArray(boycott.searchKeywords)) {
          // Check if any keyword includes the search term
          return boycott.searchKeywords.some(keyword => 
            keyword.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          // Fallback to title and description if searchKeywords not available
          return (
            boycott.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            boycott.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
    }
    
    // Apply location filter if provided (client-side)
    if (location) {
      boycotts = boycotts.filter(boycott => 
        boycott.location && boycott.location.includes(location)
      );
    }
    
    return { success: true, boycotts };
  } catch (error) {
    console.error('Error searching boycotts:', error);
    return { success: false, error: error.message };
  }
}; 