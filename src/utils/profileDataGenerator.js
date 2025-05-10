import { db, auth } from '../firebase/config';
import { doc, updateDoc, serverTimestamp, getDoc, arrayUnion } from 'firebase/firestore';

// Sample activities
const sampleActivities = [
  { 
    type: 'protest_create',
    text: 'Yeni bir protesto oluşturdunuz: "Öğrenci Burslarının Arttırılması"',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  { 
    type: 'boycott_support',
    text: 'Bir boykotu desteklediniz: "Aşırı Pahalı Gıda Ürünleri Boykotu"',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  { 
    type: 'protest_comment',
    text: '"Trafik Düzenlemesi" protestosuna yorum yaptınız',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  },
  { 
    type: 'profile_update',
    text: 'Profil bilgilerinizi güncellediniz',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
  },
  { 
    type: 'boycott_create',
    text: 'Yeni bir boykot oluşturdunuz: "Sürdürülebilir Olmayan Ambalajlar"',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
  }
];

// Generate random profile stats
const generateRandomStats = () => {
  return {
    supportedProtests: Array.from({ length: Math.floor(Math.random() * 8) + 1 }, (_, i) => `protest_${i}`),
    opposedProtests: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => `protest_${i + 10}`),
    supportedBoycotts: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => `boycott_${i}`),
    opposedBoycotts: Array.from({ length: Math.floor(Math.random() * 2) + 1 }, (_, i) => `boycott_${i + 8}`),
  };
};

// Populate user profile with sample data
export const populateUserProfile = async () => {
  try {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in");
      return { success: false, error: "User not logged in" };
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User document does not exist");
      return { success: false, error: "User document not found" };
    }
    
    // Add sample activities to user profile
    await updateDoc(userRef, {
      recentActivity: sampleActivities,
      ...generateRandomStats(),
      lastUpdated: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error populating user profile:", error);
    return { success: false, error: error.message };
  }
};

// Add a new activity to user's profile
export const addUserActivity = async (activityData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not logged in" };
    }
    
    const userRef = doc(db, 'users', user.uid);
    
    // Create activity object
    const activity = {
      ...activityData,
      date: new Date()
    };
    
    // Add to user's activities
    await updateDoc(userRef, {
      recentActivity: arrayUnion(activity),
      lastUpdated: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error adding activity:", error);
    return { success: false, error: error.message };
  }
};

// Initialize profile data if it doesn't exist yet
export const initializeProfileDataIfNeeded = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not logged in" };
    }
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: "User document not found" };
    }
    
    const userData = userDoc.data();
    
    // Only initialize activity data if it doesn't exist
    if (!userData.recentActivity || userData.recentActivity.length === 0) {
      // Don't populate with sample data anymore, just create an empty array
      await updateDoc(userRef, {
        recentActivity: [],
        lastUpdated: serverTimestamp()
      });
    }
    
    return { success: true, message: "Profile data structure initialized" };
  } catch (error) {
    console.error("Error initializing profile data:", error);
    return { success: false, error: error.message };
  }
}; 