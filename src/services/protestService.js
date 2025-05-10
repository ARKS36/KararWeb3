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
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { auth } from '../firebase/config';
import { getAuth } from 'firebase/auth';

// Get all protests with filters (both approved and unapproved)
export const getProtests = async (lastVisible = null, pageSize = 10, filters = {}) => {
  try {
    const protestsRef = collection(db, 'protests');
    let protestQuery = query(protestsRef, orderBy('createdAt', 'desc'), limit(pageSize));
    
    // Filtering
    if (filters.category) {
      protestQuery = query(protestQuery, where('category', '==', filters.category));
    }

    if (filters.status) {
      protestQuery = query(protestQuery, where('status', '==', filters.status));
    }
    
    // Filter by approval status if provided
    if (filters.approvalStatus === 'approved') {
      protestQuery = query(protestQuery, where('isApproved', '==', true));
    } else if (filters.approvalStatus === 'pending') {
      protestQuery = query(protestQuery, where('isApproved', '==', false));
    }
    
    // Pagination
    if (lastVisible) {
      protestQuery = query(protestQuery, startAfter(lastVisible));
    }
    
    const protestSnapshot = await getDocs(protestQuery);
    const lastVisibleDoc = protestSnapshot.docs[protestSnapshot.docs.length - 1];
    
    let protests = protestSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Apply location filter if provided (client-side filtering)
    if (filters.location) {
      protests = protests.filter(protest => 
        protest.location && protest.location.includes(filters.location)
      );
    }
    
    return {
      protests,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    throw error;
  }
};

// Get a specific protest
export const getProtest = async (protestId) => {
  try {
    const docRef = doc(db, 'protests', protestId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, protest: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Protest not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add new protest
export const addProtest = async (protestData, userId) => {
  try {
    const docRef = await addDoc(collection(db, 'protests'), {
      ...protestData,
      creatorUserId: userId,
      createdAt: serverTimestamp(),
      isApproved: false,
      supportCount: 0,
      oppositionCount: 0
    });
    
    return { success: true, protestId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user's own protests
export const getUserProtests = async (userId) => {
  try {
    const q = query(
      collection(db, 'protests'),
      where('creatorUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const protests = [];
    
    querySnapshot.forEach((doc) => {
      protests.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, protests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Vote on a protest (support or oppose)
export const voteOnProtest = async (protestId, userId, voteType) => {
  try {
    console.log(`Attempting to vote: protestId=${protestId}, userId=${userId}, voteType=${voteType}`);
    
    // Ensure the user is authenticated
    if (!userId) {
      console.log('No userId provided');
      return { success: false, error: 'Oy vermek için giriş yapmalısınız.' };
    }
    
    // Get current auth state and refresh token if needed
    const auth = getAuth();
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
    
    // Normalize vote type - handle the transition from 'oppose' to 'opposition'
    let normalizedVoteType = voteType;
    if (voteType === 'oppose') {
      console.log('Normalizing vote type from "oppose" to "opposition"');
      normalizedVoteType = 'opposition';
    }
    
    // Create a consistent document ID to prevent duplicate votes
    const voteId = `${protestId}_${userId}`;
    console.log(`Using vote ID: ${voteId}`);
    
    // Get protest document to verify it exists
    const protestRef = doc(db, 'protests', protestId);
    const protestDoc = await getDoc(protestRef);
    
    if (!protestDoc.exists()) {
      console.log('Protest document does not exist');
      return { success: false, error: 'Protesto bulunamadı.' };
    }
    
    // Get vote document if it exists
    const voteRef = doc(db, 'votes', voteId);
    let voteDoc;
    
    try {
      voteDoc = await getDoc(voteRef);
    } catch (error) {
      console.error('Error getting vote document:', error);
      return { success: false, error: `Oy bilgisi alınırken hata oluştu: ${error.message}` };
    }
    
    // Start a batch operation for atomic updates
    const batch = writeBatch(db);
    
    // If user already voted
    if (voteDoc.exists()) {
      const existingVote = voteDoc.data();
      console.log('Existing vote found:', existingVote);
      
      // Normalize existing vote type
      let normalizedExistingVoteType = existingVote.vote;
      if (existingVote.vote === 'oppose') {
        console.log('Normalizing existing vote type from "oppose" to "opposition"');
        normalizedExistingVoteType = 'opposition';
      }
      
      // If same vote, remove it (toggle off)
      if (normalizedExistingVoteType === normalizedVoteType) {
        console.log('Removing vote (same type)');
        try {
          // Update protest counters first
          batch.update(protestRef, {
            [`${normalizedVoteType}Count`]: increment(-1)
          });
          
          // Then delete vote document
          batch.delete(voteRef);
          
          // Commit the batch
          await batch.commit();
          
          return { success: true, action: 'removed', voteType: normalizedVoteType };
        } catch (error) {
          console.error('Error removing vote:', error);
          return { success: false, error: `Oy kaldırılırken hata oluştu: ${error.message}` };
        }
      }
      // If different vote, change it
      else {
        console.log('Changing vote type from', existingVote.vote, 'to', normalizedVoteType);
        try {
          // Update protest counters first
          // Special handling for 'oppose' to 'opposition' transition
          const updates = {
            [`${normalizedVoteType}Count`]: increment(1)
          };
          
          if (existingVote.vote === 'oppose') {
            // If existing vote was 'oppose', decrement 'opposeCount'
            updates.opposeCount = increment(-1);
          } else if (existingVote.vote === 'opposition' && normalizedVoteType !== 'opposition') {
            // If changing from 'opposition' to something else
            updates.oppositionCount = increment(-1);
          } else {
            // Normal case: decrement the old vote type count
            updates[`${existingVote.vote}Count`] = increment(-1);
          }
          
          batch.update(protestRef, updates);
          
          // Then update vote document
          batch.update(voteRef, {
            vote: normalizedVoteType,
            timestamp: serverTimestamp(),
            lastModified: serverTimestamp()
          });
          
          // Commit the batch
          await batch.commit();
          
          return { success: true, action: 'changed', voteType: normalizedVoteType };
        } catch (error) {
          console.error('Error changing vote:', error);
          return { success: false, error: `Oy güncellenirken hata oluştu: ${error.message}` };
        }
      }
    }
    // Create new vote
    else {
      console.log('First time voting');
      try {
        // Create vote document first
        batch.set(voteRef, {
          userId,
          protestId,
          vote: normalizedVoteType,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        
        // Then update protest counter
        batch.update(protestRef, {
          [`${normalizedVoteType}Count`]: increment(1)
        });
        
        // Commit the batch
        await batch.commit();
        
        return { success: true, action: 'added', voteType: normalizedVoteType };
      } catch (error) {
        console.error('Error adding new vote:', error);
        return { success: false, error: `Oy eklenirken hata oluştu: ${error.message}` };
      }
    }
  } catch (error) {
    console.error("Error voting on protest:", error);
    return { success: false, error: error.message };
  }
};

// Get user's vote for a specific protest
export const getUserVoteOnProtest = async (protestId, userId) => {
  try {
    console.log(`Checking user vote on protest: protestId=${protestId}, userId=${userId}`);
    
    if (!userId) {
      console.log('No userId provided, returning null vote');
      return { success: true, vote: null };
    }
    
    const voteId = `${protestId}_${userId}`;
    console.log(`Looking up vote with ID: ${voteId}`);
    
    const voteRef = doc(db, 'votes', voteId);
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
      console.log('No vote found for this user on this protest');
      return { success: true, vote: null };
    }
  } catch (error) {
    console.error("Error getting user protest vote:", error);
    return { success: false, error: error.message };
  }
};

// Approve a protest (admin function)
export const approveProtest = async (protestId) => {
  try {
    const protestRef = doc(db, 'protests', protestId);
    await updateDoc(protestRef, {
      isApproved: true
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error approving protest:", error);
    return { success: false, error: error.message };
  }
};

// Get all pending protests (admin function)
export const getPendingProtests = async () => {
  try {
    const protestsRef = collection(db, 'protests');
    const q = query(protestsRef, 
      where('isApproved', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const protests = [];
    
    querySnapshot.forEach((doc) => {
      protests.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, protests };
  } catch (error) {
    console.error("Error getting pending protests:", error);
    return { success: false, error: error.message };
  }
};

// Get all approved protests
export const getApprovedProtests = async () => {
  try {
    const protestsRef = collection(db, 'protests');
    const q = query(protestsRef, 
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const protests = [];
    
    querySnapshot.forEach((doc) => {
      protests.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, protests };
  } catch (error) {
    console.error("Error getting approved protests:", error);
    return { success: false, error: error.message };
  }
};

// Create a new protest
export const createProtest = async (protestData) => {
  try {
    // Add default fields if not provided
    const fullProtestData = {
      ...protestData,
      supportCount: 0,
      oppositionCount: 0,
      isApproved: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'protests'), fullProtestData);
    return { success: true, protestId: docRef.id };
  } catch (error) {
    console.error("Error creating protest:", error);
    return { success: false, error: error.message };
  }
};

// Support a protest
export const supportProtest = async (protestId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('You must be logged in to perform this action');
    }
    
    const protestRef = doc(db, 'protests', protestId);
    const userRef = doc(db, 'users', user.uid);
    
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Protests supported by the user
    const supportedProtests = userData.supportedProtests || [];
    
    // Protests opposed by the user
    const opposedProtests = userData.opposedProtests || [];
    
    // If user already supports the protest, remove support
    if (supportedProtests.includes(protestId)) {
      await updateDoc(protestRef, {
        supportCount: increment(-1)
      });
      
      await updateDoc(userRef, {
        supportedProtests: supportedProtests.filter(id => id !== protestId)
      });
      
      return { action: 'removed', type: 'support' };
    }
    
    // If user opposes the protest, remove opposition
    if (opposedProtests.includes(protestId)) {
      await updateDoc(protestRef, {
        oppositionCount: increment(-1)
      });
      
      // Remove opposition from the list
      const newOpposedProtests = opposedProtests.filter(id => id !== protestId);
      
      await updateDoc(userRef, {
        opposedProtests: newOpposedProtests
      });
    }
    
    // Support the protest
    await updateDoc(protestRef, {
      supportCount: increment(1)
    });
    
    // Add to user's supported protests
    await updateDoc(userRef, {
      supportedProtests: [...supportedProtests, protestId]
    });
    
    return { action: 'added', type: 'support' };
  } catch (error) {
    throw error;
  }
};

// Oppose a protest
export const opposeProtest = async (protestId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('You must be logged in to perform this action');
    }
    
    const protestRef = doc(db, 'protests', protestId);
    const userRef = doc(db, 'users', user.uid);
    
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Protests supported by the user
    const supportedProtests = userData.supportedProtests || [];
    
    // Protests opposed by the user
    const opposedProtests = userData.opposedProtests || [];
    
    // If user already opposes the protest, remove opposition
    if (opposedProtests.includes(protestId)) {
      await updateDoc(protestRef, {
        oppositionCount: increment(-1)
      });
      
      await updateDoc(userRef, {
        opposedProtests: opposedProtests.filter(id => id !== protestId)
      });
      
      return { action: 'removed', type: 'oppose' };
    }
    
    // If user supports the protest, remove support
    if (supportedProtests.includes(protestId)) {
      await updateDoc(protestRef, {
        supportCount: increment(-1)
      });
      
      // Remove support from the list
      const newSupportedProtests = supportedProtests.filter(id => id !== protestId);
      
      await updateDoc(userRef, {
        supportedProtests: newSupportedProtests
      });
    }
    
    // Oppose the protest
    await updateDoc(protestRef, {
      oppositionCount: increment(1)
    });
    
    // Add to user's opposed protests
    await updateDoc(userRef, {
      opposedProtests: [...opposedProtests, protestId]
    });
    
    return { action: 'added', type: 'oppose' };
  } catch (error) {
    throw error;
  }
};

// Delete a protest
export const deleteProtest = async (protestId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: 'You must be logged in to perform this action' };
    }
    
    // Get current protest data
    const protestRef = doc(db, 'protests', protestId);
    const protestDoc = await getDoc(protestRef);
    
    if (!protestDoc.exists()) {
      return { success: false, error: 'Protest not found' };
    }
    
    const protestInfo = protestDoc.data();
    
    // Check user permissions
    if (protestInfo.creatorUserId !== user.uid) {
      const isAdmin = await checkIsAdmin();
      if (!isAdmin) {
        return { success: false, error: 'You do not have permission to delete this protest' };
      }
    }
    
    // Delete protest image (if exists)
    if (protestInfo.imageUrl) {
      try {
        const imageRef = ref(storage, protestInfo.imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.log('Error deleting image:', error);
      }
    }
    
    // Delete protest
    await deleteDoc(protestRef);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting protest:", error);
    return { success: false, error: error.message };
  }
};

// Get all protests for admin (including unapproved)
export const getAllProtests = async (filters = {}) => {
  try {
    const protestsRef = collection(db, 'protests');
    let protestQuery = query(
      protestsRef,
      orderBy('createdAt', 'desc')
    );
    
    // Apply filters if provided
    if (filters.approvalStatus === 'approved') {
      protestQuery = query(protestQuery, where('isApproved', '==', true));
    } else if (filters.approvalStatus === 'pending') {
      protestQuery = query(protestQuery, where('isApproved', '==', false));
    }
    
    const snapshot = await getDocs(protestQuery);
    const protests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, protests };
  } catch (error) {
    console.error('Error fetching all protests:', error);
    return { success: false, error: error.message };
  }
};

// Update protest approval status (for admin)
export const updateProtestApproval = async (protestId, approved) => {
  try {
    const protestRef = doc(db, 'protests', protestId);
    await updateDoc(protestRef, {
      isApproved: approved
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating protest approval status:', error);
    return { success: false, error: error.message };
  }
};

// Check if a user supports a protest
export const checkUserSupport = async (protestId, userId) => {
  try {
    const supportQuery = query(
      collection(db, 'votes'),
      where('protestId', '==', protestId),
      where('userId', '==', userId),
      where('tip', '==', 'support')
    );
    
    const snapshot = await getDocs(supportQuery);
    
    return { success: true, supported: !snapshot.empty };
  } catch (error) {
    console.error('Error checking user support:', error);
    return { success: false, error: error.message };
  }
};

// Check if a user opposes a protest
export const checkUserOpposition = async (protestId, userId) => {
  try {
    const opposeQuery = query(
      collection(db, 'votes'),
      where('protestId', '==', protestId),
      where('userId', '==', userId),
      where('tip', '==', 'oppose')
    );
    
    const snapshot = await getDocs(opposeQuery);
    
    return { success: true, opposed: !snapshot.empty };
  } catch (error) {
    console.error('Error checking user opposition:', error);
    return { success: false, error: error.message };
  }
};

// Get protests supported by the user
export const getUserSupportedProtests = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('User not found');
    }
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const supportedProtests = userData.supportedProtests || [];
    
    if (supportedProtests.length === 0) {
      return [];
    }
    
    const protests = [];
    
    // Get details for each supported protest
    for (const protestId of supportedProtests) {
      try {
        const protestDoc = await getDoc(doc(db, 'protests', protestId));
        
        if (protestDoc.exists()) {
          protests.push({
            id: protestDoc.id,
            ...protestDoc.data()
          });
        }
      } catch (error) {
        console.error(`Could not fetch protest (ID: ${protestId}):`, error);
      }
    }
    
    return protests;
  } catch (error) {
    throw error;
  }
};

// Get protests opposed by the user
export const getUserOpposedProtests = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('User not found');
    }
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const opposedProtests = userData.opposedProtests || [];
    
    if (opposedProtests.length === 0) {
      return [];
    }
    
    const protests = [];
    
    // Get details for each opposed protest
    for (const protestId of opposedProtests) {
      try {
        const protestDoc = await getDoc(doc(db, 'protests', protestId));
        
        if (protestDoc.exists()) {
          protests.push({
            id: protestDoc.id,
            ...protestDoc.data()
          });
        }
      } catch (error) {
        console.error(`Could not fetch protest (ID: ${protestId}):`, error);
      }
    }
    
    return protests;
  } catch (error) {
    throw error;
  }
};

// Get protests created by the user
export const getUserCreatedProtests = async (userId = null) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('User not found');
    }
    
    const protestsRef = collection(db, 'protests');
    const protestQuery = query(protestsRef, where('creatorUserId', '==', uid), orderBy('createdAt', 'desc'));
    
    const protestSnapshot = await getDocs(protestQuery);
    
    const protests = protestSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return protests;
  } catch (error) {
    throw error;
  }
};

// Admin function: Update protest status (active/pending/blocked)
export const updateProtestStatus = async (protestId, status) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('You must be logged in to perform this action');
    }
    
    // Admin check
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      throw new Error('You must be an administrator to perform this action');
    }
    
    const protestRef = doc(db, 'protests', protestId);
    
    await updateDoc(protestRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Admin check
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
    console.error('Error during admin check:', error);
    return false;
  }
};

// Update a protest (admin function)
export const updateProtest = async (protestId, protestData) => {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Bu işlemi gerçekleştirmek için admin yetkiniz olmalıdır.' };
    }

    // If an image file is provided, upload it first
    if (protestData.imageFile) {
      // Create a reference to the storage location
      const imageFileName = `protests/${Date.now()}_${protestData.imageFile.name}`;
      const storageRef = ref(storage, imageFileName);
      
      // Upload the image
      await uploadBytes(storageRef, protestData.imageFile);
      
      // Get the URL of the uploaded image
      const imageUrl = await getDownloadURL(storageRef);
      
      // Add the image URL to the protest data and remove the file
      protestData.imageUrl = imageUrl;
      delete protestData.imageFile;
    }

    const protestRef = doc(db, 'protests', protestId);
    await updateDoc(protestRef, {
      ...protestData,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating protest:", error);
    return { success: false, error: error.message };
  }
};

// Update protest vote counts (admin function)
export const updateProtestVotes = async (protestId, supportCount, oppositionCount) => {
  try {
    // Kullanıcının giriş yapmış olup olmadığını kontrol et
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.' };
    }
    
    // Kullanıcının admin olup olmadığını kontrol et
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return { success: false, error: 'Bu işlemi gerçekleştirme yetkiniz bulunmamaktadır.' };
    }
    
    // Protesto belgesini güncelleyin
    await updateDoc(doc(db, "protests", protestId), {
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

// Set a protest as featured (admin function)
export const setProtestFeatured = async (protestId, isFeatured) => {
  try {
    // Kullanıcının giriş yapmış olup olmadığını kontrol et
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.' };
    }
    
    // Kullanıcının admin olup olmadığını kontrol et
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return { success: false, error: 'Bu işlemi gerçekleştirme yetkiniz bulunmamaktadır.' };
    }
    
    // Protesto belgesini güncelleyin
    await updateDoc(doc(db, "protests", protestId), {
      isFeatured: isFeatured,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Öne çıkarma durumu güncellenirken hata oluştu:", error);
    return { success: false, error: error.message };
  }
};

// Update protest featured status (admin function)
export const updateFeaturedStatus = async (protestId, isFeatured) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.' };
    }
    
    // Admin yetkisi kontrolü
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return { success: false, error: 'Bu işlemi gerçekleştirme yetkiniz bulunmamaktadır.' };
    }
    
    // Protesto belgesini güncelle
    await updateDoc(doc(db, "protests", protestId), {
      isFeatured: isFeatured,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Öne çıkarma durumu güncellenirken hata oluştu:", error);
    return { success: false, error: error.message };
  }
};

// Get featured protests
export const getFeaturedProtests = async () => {
  try {
    const protestsRef = collection(db, 'protests');
    const q = query(protestsRef, 
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const protests = [];
    
    querySnapshot.forEach((doc) => {
      protests.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, protests };
  } catch (error) {
    console.error("Error getting featured protests:", error);
    return { success: false, error: error.message };
  }
};

// Search protests with filters
export const searchProtests = async ({
  searchTerm = '',
  category = '',
  location = '',
  startDate = null,
  endDate = null,
  isApproved = null,
  limitCount = 10
}) => {
  try {
    let protestQuery = collection(db, 'protests');
    let conditions = [];
    
    // Only filter by approval status if explicitly specified
    if (isApproved !== null) {
      protestQuery = query(protestQuery, where('isApproved', '==', isApproved));
    }
    
    // Add category filter if provided
    if (category) {
      protestQuery = query(protestQuery, where('category', '==', category));
    }
    
    // Add date filters if provided
    if (startDate) {
      protestQuery = query(protestQuery, where('createdAt', '>=', startDate));
    }
    
    if (endDate) {
      protestQuery = query(protestQuery, where('createdAt', '<=', endDate));
    }
    
    // Order by creation date
    protestQuery = query(protestQuery, orderBy('createdAt', 'desc'));
    
    // Apply limit
    protestQuery = query(protestQuery, limit(limitCount));
    
    // Get protests that match the above criteria
    const querySnapshot = await getDocs(protestQuery);
    let protests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply text search filter if provided (client-side)
    if (searchTerm) {
      protests = protests.filter(protest => {
        // Check if protest has searchKeywords field
        if (protest.searchKeywords && Array.isArray(protest.searchKeywords)) {
          // Check if any keyword includes the search term
          return protest.searchKeywords.some(keyword => 
            keyword.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          // Fallback to title and description if searchKeywords not available
          return (
            protest.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protest.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
    }
    
    // Apply location filter if provided (client-side)
    if (location) {
      protests = protests.filter(protest => 
        protest.location && protest.location.includes(location)
      );
    }
    
    return { success: true, protests };
  } catch (error) {
    console.error('Error searching protests:', error);
    return { success: false, error: error.message };
  }
}; 