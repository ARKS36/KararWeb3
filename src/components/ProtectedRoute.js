import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Auth durumu yükleniyorsa, bekleme göster
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Kullanıcı giriş yapmışsa, çocuk bileşeni göster
  return children;
};

export default ProtectedRoute; 