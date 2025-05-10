import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);

// Firebase tarafından yetkilendirilmiş domainleri ayarla (kararweb3.com dahil)
// Bu adım otomatik olarak Firebase Console'da yapılır, sadece referans için burada tutulur
// Bu domainlerin Firebase Console'dan da eklenmesi gerekir
const authorizedDomains = (process.env.REACT_APP_AUTHORIZED_DOMAINS || '').split(',');
console.log('Yetkilendirilmiş domainler:', authorizedDomains);

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

export default app; 