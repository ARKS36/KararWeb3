import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getAllProtests, 
  updateProtestStatus, 
  deleteProtest, 
  getPendingProtests, 
  getApprovedProtests,
  approveProtest,
  updateFeaturedStatus as updateProtestFeatured
} from '../services/protestService';
import { 
  getAllBoycotts,
  getPendingBoycotts,
  approveBoycott,
  deleteBoycott,
  updateBoycottStatus,
  updateBoycottFeatured,
  updateBoycott
} from '../services/boycottService';
import { getUsers, updateUserRole } from '../services/userService';
import { getAllReports, updateReportStatus, deleteReport } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AdminTools from '../components/AdminTools';
import { toast } from 'react-toastify';
import { migrateOpposeVotes } from '../services/migration';

function AdminPanel() {
  const [pendingProtests, setPendingProtests] = useState([]);
  const [approvedProtests, setApprovedProtests] = useState([]);
  const [pendingBoycotts, setPendingBoycotts] = useState([]);
  const [approvedBoycotts, setApprovedBoycotts] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  const { userDetails, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Tüm protestoları, boykotları, kullanıcıları ve raporları yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Onay bekleyen protestoları yükle
        const pendingResult = await getPendingProtests();
        if (pendingResult.success) {
          setPendingProtests(pendingResult.protests);
        } else {
          setError('Onay bekleyen protestolar yüklenirken bir hata oluştu: ' + pendingResult.error);
        }
        
        // Onaylanmış protestoları yükle
        const approvedResult = await getApprovedProtests();
        if (approvedResult.success) {
          setApprovedProtests(approvedResult.protests);
        } else {
          setError('Onaylanmış protestolar yüklenirken bir hata oluştu: ' + approvedResult.error);
        }
        
        // Onay bekleyen boykotları yükle
        const pendingBoycottsResult = await getPendingBoycotts();
        if (pendingBoycottsResult.success) {
          setPendingBoycotts(pendingBoycottsResult.boycotts);
          console.log("Onay bekleyen boykotlar yüklendi:", pendingBoycottsResult.boycotts);
        } else {
          setError('Onay bekleyen boykotlar yüklenirken bir hata oluştu: ' + pendingBoycottsResult.error);
          console.error("Onay bekleyen boykotlar yüklenemedi:", pendingBoycottsResult.error);
        }
        
        // Onaylanmış boykotları yükle
        const allBoycottsResult = await getAllBoycotts();
        if (allBoycottsResult.success) {
          const approvedList = allBoycottsResult.boycotts.filter(b => b.isApproved);
          setApprovedBoycotts(approvedList);
        } else {
          setError('Onaylanmış boykotlar yüklenirken bir hata oluştu: ' + allBoycottsResult.error);
        }
        
        // Kullanıcıları yükle
        const usersResult = await getUsers();
        if (usersResult.users) {
          setUsers(usersResult.users);
        }
        
        // Raporları yükle
        const reportsResult = await getAllReports();
        if (reportsResult.success) {
          setReports(reportsResult.reports);
        } else {
          setError('Raporlar yüklenirken bir hata oluştu: ' + reportsResult.error);
        }
      } catch (error) {
        setError('Veriler yüklenirken bir hata oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Protesto onaylama
  const handleApproveProtest = async (protestId) => {
    try {
      const result = await approveProtest(protestId);
      
      if (result.success) {
        // UI'ı güncelle
        const protestToApprove = pendingProtests.find(p => p.id === protestId);
        if (protestToApprove) {
          const updatedProtest = { ...protestToApprove, isApproved: true };
          
          setPendingProtests(pendingProtests.filter(p => p.id !== protestId));
          setApprovedProtests([updatedProtest, ...approvedProtests]);
        }
      } else {
        setError('Protesto onaylanırken bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Protesto onaylanırken bir hata oluştu: ' + error.message);
    }
  };

  // Boykot onaylama
  const handleApproveBoycott = async (boycottId) => {
    try {
      const result = await approveBoycott(boycottId);
      
      if (result.success) {
        // UI'ı güncelle
        const boycottToApprove = pendingBoycotts.find(b => b.id === boycottId);
        if (boycottToApprove) {
          const updatedBoycott = { ...boycottToApprove, isApproved: true };
          
          setPendingBoycotts(pendingBoycotts.filter(b => b.id !== boycottId));
          setApprovedBoycotts([updatedBoycott, ...approvedBoycotts]);
        }
      } else {
        setError('Boykot onaylanırken bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Boykot onaylanırken bir hata oluştu: ' + error.message);
    }
  };

  // Protesto silme
  const handleDeleteProtest = async (protestId, isApproved) => {
    if (window.confirm('Bu protestoyu silmek istediğinizden emin misiniz?')) {
      try {
        const result = await deleteProtest(protestId);
        
        if (result.success) {
          // UI'ı güncelle
          if (isApproved) {
            setApprovedProtests(approvedProtests.filter(p => p.id !== protestId));
          } else {
            setPendingProtests(pendingProtests.filter(p => p.id !== protestId));
          }
        } else {
          setError('Protesto silinirken bir hata oluştu: ' + result.error);
        }
      } catch (error) {
        setError('Protesto silinirken bir hata oluştu: ' + error.message);
      }
    }
  };

  // Boykot silme
  const handleDeleteBoycott = async (boycottId, isApproved) => {
    if (window.confirm('Bu boykotu silmek istediğinizden emin misiniz?')) {
      try {
        const result = await deleteBoycott(boycottId);
        
        if (result.success) {
          // UI'ı güncelle
          if (isApproved) {
            setApprovedBoycotts(approvedBoycotts.filter(b => b.id !== boycottId));
          } else {
            setPendingBoycotts(pendingBoycotts.filter(b => b.id !== boycottId));
          }
        } else {
          setError('Boykot silinirken bir hata oluştu: ' + result.error);
        }
      } catch (error) {
        setError('Boykot silinirken bir hata oluştu: ' + error.message);
      }
    }
  };

  // Boykot durumunu güncelleme
  const handleUpdateBoycottStatus = async (boycottId, status) => {
    try {
      const result = await updateBoycottStatus(boycottId, status);
      
      if (result.success) {
        // UI'ı güncelle
        if (status === 'blocked') {
          // Engellenen boykotu onaylı listesinden kaldır
          setApprovedBoycotts(approvedBoycotts.map(boycott => 
            boycott.id === boycottId 
              ? { ...boycott, status } 
              : boycott
          ));
        } else {
          // Diğer durum güncellemeleri
          setApprovedBoycotts(approvedBoycotts.map(boycott => 
            boycott.id === boycottId 
              ? { ...boycott, status } 
              : boycott
          ));
        }
        
        // Bekleyen boykotları da güncelle
        setPendingBoycotts(pendingBoycotts.map(boycott => 
          boycott.id === boycottId 
            ? { ...boycott, status } 
            : boycott
        ));
      } else {
        setError('Boykot durumu güncellenirken bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Boykot durumu güncellenirken bir hata oluştu: ' + error.message);
    }
  };

  // Boykotu öne çıkarma
  const handleToggleBoycottFeatured = async (boycottId, currentFeaturedStatus) => {
    try {
      const result = await updateBoycottFeatured(boycottId, !currentFeaturedStatus);
      
      if (result.success) {
        // UI'ı güncelle
        setApprovedBoycotts(approvedBoycotts.map(boycott => 
          boycott.id === boycottId 
            ? { ...boycott, isFeatured: !currentFeaturedStatus } 
            : boycott
        ));
      } else {
        setError('Boykot öne çıkarma durumu güncellenirken bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Boykot öne çıkarma durumu güncellenirken bir hata oluştu: ' + error.message);
    }
  };

  // Kullanıcı rolünü değiştirme
  const toggleUserAdmin = async (userId, currentRole) => {
    try {
      // Eğer admin ise kullanıcıya, değilse admine çevir
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateUserRole(userId, newRole);
      
      // UI'ı güncelle
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, role: newRole };
        }
        return user;
      }));
    } catch (error) {
      setError('Kullanıcı rolü değiştirilirken bir hata oluştu: ' + error.message);
    }
  };

  // Kullanıcı engelleme/engeli kaldırma
  const toggleUserBan = async (userId, currentBanStatus) => {
    try {
      // FireStore'da kullanıcı banned durumunu güncelle
      // Bu fonksiyon henüz serviste yok, mevcut olmadığı için eklenmesi gerekiyor
      
      // UI'ı güncelle
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, banned: !currentBanStatus };
        }
        return user;
      }));
    } catch (error) {
      setError('Kullanıcı engelleme durumu değiştirilirken bir hata oluştu: ' + error.message);
    }
  };

  // Rapor durumunu güncelleme
  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const result = await updateReportStatus(reportId, newStatus);
      
      if (result.success) {
        // UI'ı güncelle
        setReports(reports.map(report => {
          if (report.id === reportId) {
            return { ...report, status: newStatus };
          }
          return report;
        }));
      } else {
        setError('Rapor durumu güncellenirken bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Rapor durumu güncellenirken bir hata oluştu: ' + error.message);
    }
  };

  // Rapor silme
  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      try {
        const result = await deleteReport(reportId);
        
        if (result.success) {
          // UI'ı güncelle
          setReports(reports.filter(r => r.id !== reportId));
        } else {
          setError('Rapor silinirken bir hata oluştu: ' + result.error);
        }
      } catch (error) {
        setError('Rapor silinirken bir hata oluştu: ' + error.message);
      }
    }
  };

  // Tarih formatla
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
  };

  // Protesto öne çıkarma (anasayfada gösterme)
  const handleToggleProtestFeatured = async (protestId, currentFeaturedStatus) => {
    try {
      const result = await updateProtestFeatured(protestId, !currentFeaturedStatus);
      
      if (result.success) {
        // UI'ı güncelle
        setApprovedProtests(approvedProtests.map(protest => 
          protest.id === protestId 
            ? { ...protest, isFeatured: !currentFeaturedStatus } 
            : protest
        ));
        
        const message = !currentFeaturedStatus 
          ? 'Protesto anasayfada gösterilecek' 
          : 'Protesto anasayfadan kaldırıldı';
        setError(null);
        toast.success(message);
      } else {
        setError('Protesto öne çıkarma durumu güncellenirken bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Protesto öne çıkarma durumu güncellenirken bir hata oluştu: ' + error.message);
    }
  };

  // Admin değilse, erişim reddedildi sayfasını göster
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Erişim Reddedildi</h2>
          <p className="mt-2 text-gray-600">Bu sayfaya erişmek için admin yetkiniz bulunmamaktadır.</p>
          <Link to="/" className="mt-6 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Debug Bilgisi - Yetkili kullanıcılara gösterilecek */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Admin Kullanıcı Bilgileri:</strong><br />
                    UID: {userDetails?.uid || currentUser?.uid || 'Bilinmiyor'}<br />
                    İsim: {userDetails?.displayName || currentUser?.displayName || 'Bilinmiyor'}<br />
                    Role: {userDetails?.role || 'Belirtilmemiş'}<br />
                    Admin: {userDetails?.admin ? 'true' : 'false'}<br />
                    isAdmin Değişkeni: {isAdmin ? 'true' : 'false'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Admin Araçları */}
            <AdminTools />
            
            {/* Admin İşlemleri */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Admin İşlemleri</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Yönetimsel işlemler için kullanabileceğiniz fonksiyonlar.</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <Link
                    to="/admin/manage"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Protesto Yönetimi
                  </Link>
                  <Link
                    to="/admin/manage-boycotts"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                  >
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Boykot Yönetimi
                  </Link>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`${
                    activeTab === 'pending'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Onay Bekleyen Protestolar
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    {pendingProtests.length}
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`${
                    activeTab === 'approved'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Onaylanmış Protestolar
                </button>
                
                <button
                  onClick={() => setActiveTab('pendingBoycotts')}
                  className={`${
                    activeTab === 'pendingBoycotts'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Onay Bekleyen Boykotlar
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    {pendingBoycotts.length}
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('approvedBoycotts')}
                  className={`${
                    activeTab === 'approvedBoycotts'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Onaylanmış Boykotlar
                </button>

                <button
                  onClick={() => setActiveTab('homepage')}
                  className={`${
                    activeTab === 'homepage'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Anasayfa Yönetimi
                </button>
                
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Kullanıcı Yönetimi
                </button>
                
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`${
                    activeTab === 'reports'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Raporlar
                  {reports.length > 0 && (
                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-800">
                      {reports.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Pending Protests Tab */}
            {activeTab === 'pending' && (
              <div className="overflow-x-auto">
                <div className="align-middle inline-block min-w-full">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    {pendingProtests.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        Onay bekleyen protesto bulunmamaktadır.
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Başlık
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Oluşturan
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingProtests.map((protest) => (
                            <tr key={protest.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {protest.imageUrl && (
                                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                                      <img className="h-10 w-10 rounded-md object-cover" src={protest.imageUrl} alt="" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {protest.title}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                      {protest.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{protest.creatorUserId || 'Bilinmiyor'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(protest.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleApproveProtest(protest.id)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Onayla
                                </button>
                                <button
                                  onClick={() => handleDeleteProtest(protest.id, false)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Sil
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Approved Protests Tab */}
            {activeTab === 'approved' && (
              <div className="overflow-x-auto">
                <div className="align-middle inline-block min-w-full">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    {approvedProtests.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        Onaylanmış protesto bulunmamaktadır.
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Başlık
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Oluşturan
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Destekler
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {approvedProtests.map((protest) => (
                            <tr key={protest.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {protest.imageUrl && (
                                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                                      <img className="h-10 w-10 rounded-md object-cover" src={protest.imageUrl} alt="" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {protest.title}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                      {protest.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{protest.creatorUserId || 'Bilinmiyor'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(protest.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <span className="text-green-600">{protest.supportCount || 0}</span> / <span className="text-red-600">{protest.oppositionCount || 0}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link to={`/protest/${protest.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                  Görüntüle
                                </Link>
                                <button
                                  onClick={() => handleDeleteProtest(protest.id, true)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Sil
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pending Boycotts Tab */}
            {activeTab === 'pendingBoycotts' && (
              <div className="overflow-x-auto">
                <div className="align-middle inline-block min-w-full">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    {pendingBoycotts.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        Onay bekleyen boykot bulunmamaktadır.
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Başlık
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kategori
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Oluşturan
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingBoycotts.map((boycott) => (
                            <tr key={boycott.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {boycott.imageURL && (
                                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                                      <img className="h-10 w-10 rounded-md object-cover" src={boycott.imageURL} alt="" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {boycott.title}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                      {boycott.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{boycott.mainCategory}</div>
                                <div className="text-xs text-gray-500">{boycott.subCategory}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{boycott.creatorUserId || 'Bilinmiyor'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(boycott.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleApproveBoycott(boycott.id)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Onayla
                                </button>
                                <button
                                  onClick={() => handleDeleteBoycott(boycott.id, false)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Sil
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Approved Boycotts Tab */}
            {activeTab === 'approvedBoycotts' && (
              <div className="overflow-x-auto">
                <div className="align-middle inline-block min-w-full">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    {approvedBoycotts.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        Onaylanmış boykot bulunmamaktadır.
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Başlık
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kategori
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Destekler
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Öne Çıkan
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {approvedBoycotts.map((boycott) => (
                            <tr key={boycott.id} className={boycott.isFeatured ? "bg-yellow-50" : ""}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {boycott.isFeatured && (
                                    <svg className="w-5 h-5 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                  {boycott.imageURL && (
                                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                                      <img className="h-10 w-10 rounded-md object-cover" src={boycott.imageURL} alt="" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {boycott.title}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                      {boycott.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{boycott.mainCategory}</div>
                                <div className="text-xs text-gray-500">{boycott.subCategory}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(boycott.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  <span className="text-green-600">{boycott.supportCount || 0}</span> / 
                                  <span className="text-red-600 ml-1">{boycott.oppositionCount || 0}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  boycott.isFeatured 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {boycott.isFeatured ? 'Evet' : 'Hayır'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleToggleBoycottFeatured(boycott.id, boycott.isFeatured)}
                                  className={`${boycott.isFeatured ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-600 hover:text-gray-900'} mr-2`}
                                  title={boycott.isFeatured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                                >
                                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleUpdateBoycottStatus(boycott.id, boycott.status === 'blocked' ? 'active' : 'blocked')}
                                  className={`${boycott.status === 'blocked' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} mr-2`}
                                  title={boycott.status === 'blocked' ? 'Engeli kaldır' : 'Engelle'}
                                >
                                  {boycott.status === 'blocked' ? (
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteBoycott(boycott.id, true)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Sil"
                                >
                                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Homepage Management Tab Content */}
            {activeTab === 'homepage' && (
              <div className="mt-6">
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-indigo-500 text-white">
                      <h3 className="text-lg leading-6 font-medium">
                        Anasayfada Gösterilecek Protestolar
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-indigo-100">
                        Anasayfada gösterilecek protestoları seçebilirsiniz.
                      </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                      <div className="px-4 py-3 sm:px-6 bg-gray-50 flex items-center justify-between">
                        <div className="font-bold text-gray-700">
                          Toplam: {approvedProtests.filter(p => p.isFeatured).length} protesto öne çıkarılmış
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        {approvedProtests.length === 0 ? (
                          <li className="px-4 py-3 sm:px-6">
                            <div className="text-center text-gray-500 py-4">
                              Henüz onaylanmış protesto bulunmamaktadır.
                            </div>
                          </li>
                        ) : (
                          approvedProtests.map((protest) => (
                            <li 
                              key={protest.id} 
                              className={`px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 ${
                                protest.isFeatured ? 'bg-indigo-50' : ''
                              }`}
                            >
                              <div className="flex items-center mb-2 sm:mb-0">
                                <div className="min-w-0 flex-1 flex items-center">
                                  {protest.imageUrl ? (
                                    <div className="flex-shrink-0 h-12 w-12 rounded overflow-hidden mr-4">
                                      <img 
                                        src={protest.imageUrl} 
                                        alt={protest.title} 
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded mr-4 flex items-center justify-center">
                                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">{protest.title}</h4>
                                    <div className="flex mt-1">
                                      <span className="text-xs text-gray-500">{formatDate(protest.createdAt)}</span>
                                      {protest.category && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          {protest.category}
                                        </span>
                                      )}
                                      {protest.location && (
                                        <span className="ml-2 inline-flex items-center text-xs text-gray-500">
                                          <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                          {protest.location}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2 sm:ml-4">
                                <button
                                  onClick={() => handleToggleProtestFeatured(protest.id, protest.isFeatured)}
                                  className={`inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md ${
                                    protest.isFeatured
                                      ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                                      : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                                  }`}
                                >
                                  {protest.isFeatured ? (
                                    <>
                                      <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      Anasayfadan Kaldır
                                    </>
                                  ) : (
                                    <>
                                      <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                      </svg>
                                      Anasayfada Göster
                                    </>
                                  )}
                                </button>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-red-500 text-white">
                      <h3 className="text-lg leading-6 font-medium">
                        Anasayfada Gösterilecek Boykotlar
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-red-100">
                        Anasayfada gösterilecek boykotları seçebilirsiniz.
                      </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                      <div className="px-4 py-3 sm:px-6 bg-gray-50 flex items-center justify-between">
                        <div className="font-bold text-gray-700">
                          Toplam: {approvedBoycotts.filter(b => b.isFeatured).length} boykot öne çıkarılmış
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        {approvedBoycotts.length === 0 ? (
                          <li className="px-4 py-3 sm:px-6">
                            <div className="text-center text-gray-500 py-4">
                              Henüz onaylanmış boykot bulunmamaktadır.
                            </div>
                          </li>
                        ) : (
                          approvedBoycotts.map((boycott) => (
                            <li 
                              key={boycott.id} 
                              className={`px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 ${
                                boycott.isFeatured ? 'bg-red-50' : ''
                              }`}
                            >
                              <div className="flex items-center mb-2 sm:mb-0">
                                <div className="min-w-0 flex-1 flex items-center">
                                  {boycott.imageURL ? (
                                    <div className="flex-shrink-0 h-12 w-12 rounded overflow-hidden mr-4">
                                      <img 
                                        src={boycott.imageURL} 
                                        alt={boycott.title} 
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded mr-4 flex items-center justify-center">
                                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">{boycott.title}</h4>
                                    <div className="flex mt-1">
                                      <span className="text-xs text-gray-500">{formatDate(boycott.createdAt)}</span>
                                      {boycott.mainCategory && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          {boycott.mainCategory} {boycott.subCategory ? `> ${boycott.subCategory}` : ''}
                                        </span>
                                      )}
                                      {boycott.location && (
                                        <span className="ml-2 inline-flex items-center text-xs text-gray-500">
                                          <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                          {boycott.location}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2 sm:ml-4">
                                <button
                                  onClick={() => handleToggleBoycottFeatured(boycott.id, boycott.isFeatured)}
                                  className={`inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md ${
                                    boycott.isFeatured
                                      ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                                      : 'text-red-700 bg-red-100 hover:bg-red-200'
                                  }`}
                                >
                                  {boycott.isFeatured ? (
                                    <>
                                      <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      Anasayfadan Kaldır
                                    </>
                                  ) : (
                                    <>
                                      <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                      </svg>
                                      Anasayfada Göster
                                    </>
                                  )}
                                </button>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">Kullanıcı Yönetimi</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Platformdaki kullanıcıların yönetimi.</p>
                </div>
                <div className="border-t border-gray-200">
                  {users.length === 0 ? (
                    <div className="px-4 py-5 sm:p-6 text-center">
                      <p className="text-sm text-gray-500">Kayıtlı kullanıcı bulunmamaktadır.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kullanıcı
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kayıt Tarihi
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Eylemler</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={user.photoURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMjMxaDE2My4zNGExNi43OSwxNi43OSwwLDAsMCwxNi43OC0xNi43OGMwLTUxLjc0LTQzLjg5LTkzLjktOTguNDUtOTMuOVMxNywxNjIuNDgsMTcsMjE0LjIyQTE2Ljc5LDE2Ljc5LDAsMCwwLDMzLjgzLDIzMVoiIGZpbGw9IiNlZWUiLz48Y2lyY2xlIGN4PSIxMTUuNSIgY3k9IjcyLjUiIHI9IjU1LjUiIGZpbGw9IiNlZWUiLz48L3N2Zz4='} alt="" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {user.banned ? 'Engelli' : 'Aktif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => toggleUserAdmin(user.id, user.role)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                {user.role === 'admin' ? 'Admin Yetkisini Kaldır' : 'Admin Yap'}
                              </button>
                              <button
                                onClick={() => toggleUserBan(user.id, user.banned)}
                                className="text-red-600 hover:text-red-900"
                              >
                                {user.banned ? 'Engeli Kaldır' : 'Engelle'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Kullanıcı Raporları</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Kullanıcıların bildirdiği uygunsuz içerik raporlarını görüntüleyin ve yönetin.
                </p>
                
                {reports.length === 0 ? (
                  <div className="mt-6 text-center py-10 bg-white rounded-lg shadow">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Rapor Yok</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Henüz bildirilmiş bir rapor bulunmamaktadır.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Rapor Tarihi
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Protesto
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Sebep
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Durum
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Bildirim Yapan
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                  <span className="sr-only">İşlemler</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reports.map((report) => {
                                // Find the corresponding protest and user
                                const protest = [...pendingProtests, ...approvedProtests].find(p => p.id === report.protestId);
                                const user = users.find(u => u.id === report.userId);
                                
                                return (
                                  <tr key={report.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(report.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {protest ? (
                                          <Link to={`/protest/${protest.id}`} className="text-indigo-600 hover:text-indigo-900 truncate block max-w-xs">
                                            {protest.title}
                                          </Link>
                                        ) : (
                                          <span className="text-gray-500 italic">Silinmiş içerik</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {report.reportReason === 'spam' && 'Spam / Reklam'}
                                        {report.reportReason === 'inappropriate' && 'Uygunsuz İçerik'}
                                        {report.reportReason === 'misinformation' && 'Yanlış Bilgi'}
                                        {report.reportReason === 'duplicate' && 'Mükerrer İçerik'}
                                        {report.reportReason === 'other' && 'Diğer'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        report.status === 'pending' 
                                          ? 'bg-yellow-100 text-yellow-800' 
                                          : report.status === 'reviewed' 
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                      }`}>
                                        {report.status === 'pending' && 'Beklemede'}
                                        {report.status === 'reviewed' && 'İncelendi'}
                                        {report.status === 'dismissed' && 'Reddedildi'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {user ? user.displayName || user.email : 'Bilinmeyen Kullanıcı'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      {report.status === 'pending' && (
                                        <>
                                          <button 
                                            onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                                            className="text-green-600 hover:text-green-900 mr-3"
                                          >
                                            İncelendi Olarak İşaretle
                                          </button>
                                          <button 
                                            onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                            className="text-red-600 hover:text-red-900 mr-3"
                                          >
                                            Reddet
                                          </button>
                                        </>
                                      )}
                                      <button 
                                        onClick={() => handleDeleteReport(report.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Sil
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel; 