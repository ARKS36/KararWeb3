import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, query, where, getDocs, doc, updateDoc, 
  deleteDoc, orderBy, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getApprovedProtests, getPendingProtests, approveProtest, deleteProtest, updateFeaturedStatus } from '../services/protestService';
import { deleteBoycott, updateBoycottFeatured } from '../services/boycottService';
import { Container, Typography, Card, CardContent, Table, TableHead, TableBody, TableRow, TableCell, Button } from '@mui/material';
import { Box, CircularProgress } from '@mui/material';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('protests');
  const [protests, setProtests] = useState([]);
  const [boycotts, setBoycotts] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [boycottsLoading, setBoycottsLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchProtests();
      fetchBoycotts();
      fetchReports();
      fetchUsers();
    } else {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const fetchProtests = async () => {
    try {
      const protestsData = await getApprovedProtests();
      setProtests(protestsData);
    } catch (error) {
      console.error('Error fetching protests:', error);
      toast.error('Protestolar yüklenirken bir hata oluştu.');
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const reportsRef = collection(db, 'reports');
      const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'));
      const reportsSnapshot = await getDocs(reportsQuery);
      
      const reportsData = [];
      for (const reportDoc of reportsSnapshot.docs) {
        const report = { id: reportDoc.id, ...reportDoc.data() };
        
        // Fetch protest details
        if (report.protestId) {
          try {
            const protestDoc = await getDoc(doc(db, 'protests', report.protestId));
            if (protestDoc.exists()) {
              report.protestDetails = protestDoc.data();
            }
          } catch (err) {
            console.error('Error fetching protest details for report:', err);
          }
        }
        
        reportsData.push(report);
      }
      
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Raporlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoycotts = async () => {
    try {
      setBoycottsLoading(true);
      const boycottsRef = collection(db, 'boycotts');
      const boycottsQuery = query(boycottsRef, orderBy('createdAt', 'desc'));
      const boycottsSnap = await getDocs(boycottsQuery);
      
      const boycottsData = boycottsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setBoycotts(boycottsData);
      setBoycottsLoading(false);
    } catch (error) {
      console.error('Error fetching boycotts:', error);
      toast.error('Boykotlar yüklenirken bir hata oluştu.');
      setBoycottsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
      setUsersLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Kullanıcılar yüklenirken bir hata oluştu.');
      setUsersLoading(false);
    }
  };

  // Function to handle deletion
  const handleDelete = async (protestId) => {
    if (window.confirm('Bu boykotu silmek istediğinize emin misiniz?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'protests', protestId));
        setProtests(protests.filter(protest => protest.id !== protestId));
        toast.success('Boykot başarıyla silindi!');
      } catch (error) {
        console.error('Boykot silinirken hata oluştu:', error);
        toast.error('Boykot silinirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to handle featuring a protest
  const handleFeatureToggle = async (protestId, currentStatus) => {
    const newStatus = !currentStatus;
    const actionText = newStatus ? 'öne çıkarmak' : 'öne çıkarma durumunu kaldırmak';
    
    if (window.confirm(`Bu boykotu ${actionText} istediğinize emin misiniz?`)) {
      setLoading(true);
      try {
        await updateDoc(doc(db, 'protests', protestId), {
          isFeatured: newStatus,
          updatedAt: serverTimestamp()
        });
        
        // Update local state to reflect the change
        setProtests(protests.map(protest => 
          protest.id === protestId ? {...protest, isFeatured: newStatus} : protest
        ));
        
        toast.success(`Boykot başarıyla ${newStatus ? 'öne çıkarıldı!' : 'öne çıkarma durumu kaldırıldı!'}`);
      } catch (error) {
        console.error('İşlem sırasında hata oluştu:', error);
        toast.error('İşlem sırasında bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to handle report status updates
  const handleReportStatus = async (reportId, newStatus) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'reports', reportId), {
        status: newStatus,
        resolvedBy: currentUser.uid,
        resolvedAt: serverTimestamp()
      });
      
      // Update local state
      setReports(reports.map(report => 
        report.id === reportId ? {...report, status: newStatus} : report
      ));
      
      toast.success(`Rapor durumu '${newStatus}' olarak güncellendi.`);
    } catch (error) {
      console.error('Rapor durumu güncellenirken hata oluştu:', error);
      toast.error('Rapor durumu güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a report
  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Bu raporu silmek istediğinize emin misiniz?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'reports', reportId));
        setReports(reports.filter(report => report.id !== reportId));
        toast.success('Rapor başarıyla silindi!');
      } catch (error) {
        console.error('Rapor silinirken hata oluştu:', error);
        toast.error('Rapor silinirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteProtest = async (id) => {
    // ... existing code ...
  };

  const handleDeleteBoycott = async (id) => {
    if (window.confirm("Bu boykotu silmek istediğinizden emin misiniz?")) {
      try {
        await deleteDoc(doc(db, "boycotts", id));
        setBoycotts(boycotts.filter(boycott => boycott.id !== id));
        toast.success("Boykot başarıyla silindi");
      } catch (error) {
        console.error("Error deleting boycott: ", error);
        toast.error("Boykot silinirken bir hata oluştu");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Belirtilmemiş';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'resolved':
        return 'Çözüldü';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const handleUserRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'yönetici yapmak' : 'yönetici yetkilerini kaldırmak';
    
    if (window.confirm(`Bu kullanıcıyı ${actionText} istediğinize emin misiniz?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          role: newRole,
          updatedAt: serverTimestamp()
        });
        
        // Update local state to reflect the change
        setUsers(users.map(user => 
          user.id === userId ? {...user, role: newRole} : user
        ));
        
        toast.success(`Kullanıcı yetkisi başarıyla güncellendi!`);
      } catch (error) {
        console.error('İşlem sırasında hata oluştu:', error);
        toast.error('İşlem sırasında bir hata oluştu.');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        // Gelecekte: Kullanıcının protestolarının ve boykotlarının da silinmesi işlemleri eklenebilir
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter(user => user.id !== userId));
        toast.success('Kullanıcı başarıyla silindi!');
      } catch (error) {
        console.error('Kullanıcı silinirken hata oluştu:', error);
        toast.error('Kullanıcı silinirken bir hata oluştu.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Paneli</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('protests')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'protests'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Protestolar
            </button>
            <button
              onClick={() => setActiveTab('boycotts')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'boycotts'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Boykotlar
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kullanıcılar
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Raporlar
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : activeTab === 'protests' ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Protestolar</h2>
              {protests.length === 0 ? (
                <p className="text-gray-500">Henüz hiç protesto bulunmuyor.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Başlık
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Oylar
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {protests.map((protest) => (
                        <tr key={protest.id} className={protest.isFeatured ? "bg-yellow-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {protest.isFeatured && (
                                <svg className="w-5 h-5 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              )}
                              <div className="text-sm font-medium text-gray-900">
                                <Link to={`/protest/${protest.id}`} className="hover:text-indigo-600">
                                  {protest.title}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {protest.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(protest.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <span className="text-green-600 font-medium">{protest.supportCount || 0}</span>
                              {' / '}
                              <span className="text-red-600 font-medium">{protest.oppositionCount || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleFeatureToggle(protest.id, protest.isFeatured || false)}
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                                  protest.isFeatured
                                    ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
                              >
                                {protest.isFeatured ? 'Öne Çıkarma' : 'Öne Çıkar'}
                              </button>
                              <button
                                onClick={() => handleDelete(protest.id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'boycotts' ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Boykotlar</h2>
              {boycotts.length === 0 ? (
                <p className="text-gray-500">Henüz hiç boykot bulunmuyor.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Başlık
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategoriler
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Konum
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
                      {boycotts.map((boycott) => (
                        <tr key={boycott.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              <Link to={`/boycott/${boycott.id}`} className="hover:text-indigo-600">
                                {boycott.title}
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {boycott.description}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {boycott.categories?.map((category, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {category}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {boycott.location || "Belirtilmemiş"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(boycott.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteBoycott(boycott.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'users' ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Kullanıcılar</h2>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : users.length === 0 ? (
                <p className="text-gray-500">Henüz hiç kullanıcı bulunmuyor.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kullanıcı
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          E-posta
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kayıt Tarihi
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className={user.role === 'admin' ? "bg-blue-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {user.photoURL ? (
                                  <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.displayName || "İsimsiz Kullanıcı"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {user.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUserRoleToggle(user.id, user.role)}
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                                  user.role === 'admin'
                                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                              >
                                {user.role === 'admin' ? 'Yetkiyi Kaldır' : 'Admin Yap'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Kullanıcı Raporları</h2>
              {reports.length === 0 ? (
                <p className="text-gray-500">Henüz hiç rapor bulunmuyor.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Protesto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Şikayet
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kullanıcı
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.map((report) => (
                        <tr key={report.id} className={report.status === 'pending' ? "bg-yellow-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {report.protestDetails ? (
                                <Link to={`/protest/${report.protestId}`} className="hover:text-indigo-600">
                                  {report.protestDetails.title}
                                </Link>
                              ) : (
                                <span className="text-gray-500">
                                  {report.protestTitle || "Bilinmeyen protesto"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              {report.reportReason}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {report.userName || report.userEmail || "Bilinmeyen kullanıcı"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(report.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(report.status)}`}>
                              {getStatusText(report.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {report.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleReportStatus(report.id, 'resolved')}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  >
                                    Çözüldü
                                  </button>
                                  <button
                                    onClick={() => handleReportStatus(report.id, 'rejected')}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    Reddet
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel; 