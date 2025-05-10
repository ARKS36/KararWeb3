import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, login as loginUser, register as registerUser, logout as logoutUser, loginWithGoogle as loginWithGoogleUser } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Auth context oluştur
const AuthContext = createContext();

// Context provider bileşeni
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Firebase auth değişikliklerini dinle
    const unsubscribe = onAuthChange(async (user) => {
      setLoading(true);
      
      if (user) {
        setCurrentUser(user);
        
        // Firestore'dan kullanıcı detaylarını al
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserDetails(docSnap.data());
          }
        } catch (err) {
          console.error('Kullanıcı detayları alınamadı:', err);
        }
      } else {
        setCurrentUser(null);
        setUserDetails(null);
      }
      
      setLoading(false);
    });
    
    // Component unmount olduğunda aboneliği iptal et
    return () => unsubscribe();
  }, []);

  // Giriş fonksiyonu
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      const user = await loginUser(email, password);
      return { success: true, user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Google ile giriş fonksiyonu
  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const user = await loginWithGoogleUser();
      return { success: true, user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Kaydolma fonksiyonu
  const register = async (email, password, name) => {
    setError(null);
    setLoading(true);
    
    try {
      const user = await registerUser(email, password, name);
      return { success: true, user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış fonksiyonu
  const logout = async () => {
    setError(null);
    
    try {
      await logoutUser();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const value = {
    currentUser,
    userDetails,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    isAdmin: userDetails?.role === 'admin' || userDetails?.admin === true || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Context kullanım hook'u
export const useAuth = () => {
  return useContext(AuthContext);
}; 