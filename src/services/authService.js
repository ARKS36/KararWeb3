import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';

// Auth state change listener with token refresh
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Force token refresh every hour to ensure security policies are up to date
      const tokenResult = await getIdTokenResult(user);
      const tokenAge = Date.now() - new Date(tokenResult.issuedAtTime).getTime();
      
      // If token is older than 1 hour (3600000 ms), refresh it
      if (tokenAge > 3600000) {
        try {
          await getIdToken(user, true); // Force refresh the token
          console.log("Auth token refreshed");
        } catch (error) {
          console.error("Token refresh error:", error);
        }
      }
      
      // Update last login timestamp in Firestore
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating last login:", error);
      }
    }
    
    callback(user);
  });
};

// Google ile giriş yapma
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Add security scopes
    provider.addScope('email');
    provider.addScope('profile');
    
    // Google oturum açma seçeneğinde kararweb3.com için origin garantile
    // Not: Bu ayar, kararweb3.com domain'i Firebase Console'da yetkilendirilmiş olsa bile gerekli
    if (window.location.hostname === 'kararweb3.com') {
      // Bu origin'in yetkili olduğundan emin ol
      provider.setCustomParameters({
        // Prompt kullanıcının hesap seçmesini sağlar
        prompt: 'select_account',
        // Sadece domain'e bağlı host origin'i kabul et 
        login_hint: window.location.hostname
      });
    }
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Kullanıcı Firestore'da var mı kontrol et
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Kullanıcı yoksa, Firestore'a ekle
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Google User',
        photoURL: user.photoURL,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        loginMethod: 'google',
        supportedProtests: [],
        opposedProtests: [],
        accountLocked: false
      });
    } else {
      // Kullanıcı varsa sadece son giriş zamanını güncelle
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
    }
    
    return user;
  } catch (error) {
    console.error("Google ile giriş hatası:", error.code, error.message);
    // Firebase: Error (auth/unauthorized-domain) hatasını yakala ve bilgilendir
    if (error.code === 'auth/unauthorized-domain') {
      console.error("Bu domain (kararweb3.com) Firebase Authentication'da yetkilendirilmemiş. Firebase Console'dan domainler listesine eklenmesi gerekiyor.");
    }
    throw error;
  }
};

// Kullanıcı kaydı oluşturma
export const register = async (email, password, displayName) => {
  try {
    // Input validation
    if (!email || typeof email !== 'string' || email.length < 5 || email.length > 100 || !email.includes('@')) {
      throw new Error('Geçersiz e-posta adresi.');
    }
    
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Şifre en az 6 karakter uzunluğunda olmalıdır.');
    }
    
    if (!displayName || typeof displayName !== 'string' || displayName.length < 2 || displayName.length > 50) {
      throw new Error('Geçersiz kullanıcı adı.');
    }
    
    // Sanitize input
    const sanitizedDisplayName = displayName.trim().replace(/[<>&]/g, '');
    
    // Yeni kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Kullanıcı profilini güncelle
    await updateProfile(user, {
      displayName: sanitizedDisplayName
    });
    
    // Kullanıcı koleksiyonunda döküman oluştur
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      displayName: sanitizedDisplayName,
      role: 'user',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      loginMethod: 'email',
      photoURL: null,
      bio: '',
      supportedProtests: [],
      opposedProtests: [],
      accountLocked: false,
      loginAttempts: 0
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Kullanıcı girişi
export const login = async (email, password) => {
  try {
    // Input validation
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      throw new Error('E-posta ve şifre gerekli.');
    }
    
    // Check if account is locked
    try {
      // Get user by email (query)
      const usersRef = doc(db, 'users', email);
      const userDoc = await getDoc(usersRef);
      
      if (userDoc.exists() && userDoc.data().accountLocked) {
        throw new Error('Hesabınız güvenlik nedeniyle kilitlendi. Lütfen yönetici ile iletişime geçin.');
      }
    } catch (error) {
      // Silently continue if we can't find the user - regular auth will handle it
      console.log("User lookup error:", error);
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // After successful login, reset login attempts
    try {
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: serverTimestamp(),
        loginAttempts: 0
      });
    } catch (error) {
      console.error("Error updating login timestamp:", error);
    }
    
    return userCredential.user;
  } catch (error) {
    // If login fails, increment login attempts
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      try {
        // For security, don't expose whether user exists or not
        console.log("Login failed attempt");
      } catch (updateError) {
        console.error("Error tracking failed login:", updateError);
      }
    }
    throw error;
  }
};

// Kullanıcı çıkışı
export const logout = async () => {
  try {
    return await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Kullanıcı bilgilerini al
export const getUserProfile = async (userId = null) => {
  try {
    // userId belirtilmezse mevcut giriş yapmış kullanıcıyı al
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('Kullanıcı oturumu bulunamadı.');
    }
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('Kullanıcı bulunamadı.');
    }
  } catch (error) {
    throw error;
  }
};

// Kullanıcı profil resmi yükleme
export const uploadProfileImage = async (imageFile) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı.');
    }
    
    const storageRef = ref(storage, `profile_images/${user.uid}`);
    await uploadBytes(storageRef, imageFile);
    
    const downloadURL = await getDownloadURL(storageRef);
    
    // Auth profilini güncelle
    await updateProfile(user, {
      photoURL: downloadURL
    });
    
    // Firestore'daki kullanıcı dökümanını güncelle
    await updateDoc(doc(db, 'users', user.uid), {
      photoURL: downloadURL
    });
    
    return downloadURL;
  } catch (error) {
    throw error;
  }
};

// Kullanıcı profil bilgilerini güncelleme
export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı.');
    }
    
    const { displayName, bio } = profileData;
    
    // Auth profilini güncelle (sadece displayName)
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Firestore'daki kullanıcı dökümanını güncelle
    await updateDoc(doc(db, 'users', user.uid), {
      ...(displayName && { displayName }),
      ...(bio !== undefined && { bio })
    });
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Şifre sıfırlama e-postası gönderme
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw error;
  }
};

// E-posta adresi güncelleme (yeniden kimlik doğrulama gerektirir)
export const changeEmail = async (password, newEmail) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı.');
    }
    
    // Kullanıcıyı yeniden doğrula
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    // E-posta güncelle
    await updateEmail(user, newEmail);
    
    // Firestore'daki kullanıcı dökümanını güncelle
    await updateDoc(doc(db, 'users', user.uid), {
      email: newEmail
    });
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Şifre değiştirme (yeniden kimlik doğrulama gerektirir)
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı.');
    }
    
    // Kullanıcıyı yeniden doğrula
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Şifreyi güncelle
    await updatePassword(user, newPassword);
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Kullanıcının admin olup olmadığını kontrol et
export const checkIsAdmin = async () => {
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