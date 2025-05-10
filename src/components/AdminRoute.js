import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { currentUser, userDetails, loading, isAdmin } = useAuth();
  
  // Auth durumu yükleniyorsa, bekleme göster
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa veya admin değilse, ana sayfaya yönlendir
  if (!currentUser || !isAdmin) {
    return <Navigate to="/" />;
  }

  // Kullanıcı giriş yapmış ve admin ise, çocuk bileşeni göster
  return children;
};

export default AdminRoute; 