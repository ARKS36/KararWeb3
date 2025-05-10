import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getAllProtests, 
  approveProtest, 
  deleteProtest, 
  updateProtest,
  updateProtestVotes,
  setProtestFeatured
} from '../services/protestService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function AdminManagement() {
  const [protests, setProtests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProtest, setEditingProtest] = useState(null);
  const [selectedProtests, setSelectedProtests] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    supportCount: 0,
    oppositionCount: 0,
    isFeatured: false,
    imageFile: null
  });
  const [imagePreview, setImagePreview] = useState('');
  
  const { currentUser, userDetails, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Tüm protestoları yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getAllProtests();
        
        if (result.success) {
          setProtests(result.protests);
        } else {
          setError('Protestolar yüklenirken bir hata oluştu: ' + result.error);
        }
      } catch (error) {
        setError('Protestolar yüklenirken bir hata oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Başarı mesajı göster ve sonra temizle
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Protesto onaylama
  const handleApproveProtest = async (protestId) => {
    try {
      setLoading(true);
      const result = await approveProtest(protestId);
      
      if (result.success) {
        // UI'ı güncelle
        setProtests(protests.map(protest => 
          protest.id === protestId 
            ? { ...protest, isApproved: true } 
            : protest
        ));
        setSuccessMessage("Protesto başarıyla onaylandı!");
      } else {
        setError('Protesto onaylanırken bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Protesto onaylanırken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toplu onaylama
  const handleBulkApprove = async () => {
    if (selectedProtests.length === 0) {
      setError('Lütfen onaylamak için en az bir protesto seçin.');
      return;
    }
    
    try {
      setLoading(true);
      let successCount = 0;
      
      for (const protestId of selectedProtests) {
        const result = await approveProtest(protestId);
        if (result.success) {
          successCount++;
        }
      }
      
      // UI'ı güncelle
      setProtests(protests.map(protest => 
        selectedProtests.includes(protest.id)
          ? { ...protest, isApproved: true } 
          : protest
      ));
      
      setSuccessMessage(`${successCount} protesto başarıyla onaylandı!`);
      setSelectedProtests([]); // Seçimleri temizle
    } catch (error) {
      setError('Toplu onaylama sırasında bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Protesto silme
  const handleDeleteProtest = async (protestId) => {
    if (window.confirm('Bu protestoyu silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        const result = await deleteProtest(protestId);
        
        if (result.success) {
          setProtests(protests.filter(protest => protest.id !== protestId));
          setSuccessMessage("Protesto başarıyla silindi!");
        } else {
          setError('Protesto silinirken bir hata oluştu: ' + result.error);
        }
      } catch (error) {
        setError('Protesto silinirken bir hata oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Protesto düzenleme modunu açma
  const handleEditOpen = (protest) => {
    setEditingProtest(protest);
    setEditFormData({
      title: protest.title,
      description: protest.description,
      supportCount: protest.supportCount || 0,
      oppositionCount: protest.oppositionCount || 0,
      isFeatured: protest.isFeatured || false,
      imageFile: null
    });
    setImagePreview(protest.imageUrl || '');
  };

  // Düzenleme modunu kapatma
  const handleEditClose = () => {
    setEditingProtest(null);
    setEditFormData({
      title: '',
      description: '',
      supportCount: 0,
      oppositionCount: 0,
      isFeatured: false,
      imageFile: null
    });
    setImagePreview('');
  };

  // Form değişikliklerini izleme
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      if (files && files[0]) {
        const selectedFile = files[0];
        
        // Check file size (max 2MB)
        if (selectedFile.size > 2 * 1024 * 1024) {
          setError('Görsel boyutu 2MB\'dan küçük olmalıdır');
          return;
        }
        
        setEditFormData({
          ...editFormData,
          imageFile: selectedFile
        });
        
        // Create image preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      }
    } else {
      setEditFormData({
        ...editFormData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  // Checkbox seçimi
  const handleCheckboxChange = (protestId) => {
    setSelectedProtests(prev => {
      if (prev.includes(protestId)) {
        return prev.filter(id => id !== protestId);
      } else {
        return [...prev, protestId];
      }
    });
  };

  // Tümünü seç/kaldır
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProtests(protests.map(protest => protest.id));
    } else {
      setSelectedProtests([]);
    }
  };

  // Protesto güncelleme
  const handleUpdateProtest = async (e) => {
    e.preventDefault();
    if (!editingProtest) return;

    try {
      setLoading(true);
      
      // Oy sayılarını güncelle
      const votesResult = await updateProtestVotes(
        editingProtest.id, 
        editFormData.supportCount, 
        editFormData.oppositionCount
      );
      
      if (!votesResult.success) {
        throw new Error(votesResult.error);
      }
      
      // Öne çıkarma durumunu güncelle
      const featuredResult = await setProtestFeatured(
        editingProtest.id,
        editFormData.isFeatured
      );
      
      if (!featuredResult.success) {
        throw new Error(featuredResult.error);
      }
      
      // İçerik güncellemesi
      const updateData = {
        title: editFormData.title,
        description: editFormData.description
      };
      
      // If a new image was selected, include it
      if (editFormData.imageFile) {
        updateData.imageFile = editFormData.imageFile;
      }
      
      const updateResult = await updateProtest(editingProtest.id, updateData);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }
      
      // UI'ı güncelle
      setProtests(protests.map(protest => 
        protest.id === editingProtest.id 
          ? { 
              ...protest, 
              title: editFormData.title,
              description: editFormData.description,
              supportCount: parseInt(editFormData.supportCount, 10),
              oppositionCount: parseInt(editFormData.oppositionCount, 10),
              isFeatured: editFormData.isFeatured,
              imageUrl: imagePreview.startsWith('data:') ? imagePreview : protest.imageUrl
            } 
          : protest
      ));
      
      // Başarı mesajı
      setSuccessMessage("Protesto başarıyla güncellendi!");
      
      // Düzenleme modunu kapat
      handleEditClose();
      
    } catch (error) {
      setError('Protesto güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Tarih formatla
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Protesto Yönetimi</h1>
              <div className="flex space-x-2">
                <Link to="/admin" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Admin Paneli
                </Link>
                <Link to="/" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Ana Sayfa
                </Link>
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
            
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Düzenleme Modal */}
            {editingProtest && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Protesto Düzenle</h2>
                    <button onClick={handleEditClose} className="text-gray-400 hover:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateProtest}>
                    {/* Image Preview and Upload */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Görsel</label>
                      <div className="flex items-start space-x-4">
                        <div className="w-32 h-32 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {imagePreview ? (
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/300x200?text=Resim+Yüklenemedi";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            name="imageFile"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                            id="protest-image-upload"
                          />
                          <label 
                            htmlFor="protest-image-upload"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Görsel Yükle
                          </label>
                          <p className="mt-2 text-sm text-gray-500">
                            PNG, JPG, GIF - Max 2MB
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                      <input
                        type="text"
                        name="title"
                        value={editFormData.title}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={handleInputChange}
                        rows="4"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destek Sayısı</label>
                        <input
                          type="number"
                          name="supportCount"
                          value={editFormData.supportCount}
                          onChange={handleInputChange}
                          min="0"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Karşıt Sayısı</label>
                        <input
                          type="number"
                          name="oppositionCount"
                          value={editFormData.oppositionCount}
                          onChange={handleInputChange}
                          min="0"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          checked={editFormData.isFeatured}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Öne Çıkar</span>
                      </label>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleEditClose}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Kaydet
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Toplu İşlem Butonları */}
            {selectedProtests.length > 0 && (
              <div className="bg-white shadow rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{selectedProtests.length}</span> protesto seçildi
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkApprove}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      Toplu Onayla
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                    >
                      Toplu Sil
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Protestolar Tablosu */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedProtests.length === protests.length && protests.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturma Tarihi</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oylama</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öne Çıkarılmış</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {protests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        Henüz hiç protesto bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    protests.map((protest) => (
                      <tr key={protest.id} className={selectedProtests.includes(protest.id) ? 'bg-indigo-50' : ''}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={selectedProtests.includes(protest.id)}
                            onChange={() => handleCheckboxChange(protest.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {protest.imageUrl && (
                              <div className="flex-shrink-0 h-10 w-10 mr-3">
                                <img className="h-10 w-10 rounded-md object-cover" src={protest.imageUrl} alt="" />
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{protest.title}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            protest.isApproved 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {protest.isApproved ? 'Onaylanmış' : 'Onay Bekliyor'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(protest.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="text-green-600">{protest.supportCount || 0}</span> / <span className="text-red-600">{protest.oppositionCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            protest.isFeatured 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {protest.isFeatured ? 'Evet' : 'Hayır'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {!protest.isApproved && (
                              <button
                                onClick={() => handleApproveProtest(protest.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Onayla
                              </button>
                            )}
                            <button
                              onClick={() => handleEditOpen(protest)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Düzenle
                            </button>
                            <Link
                              to={`/protest/${protest.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Görüntüle
                            </Link>
                            <button
                              onClick={() => handleDeleteProtest(protest.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminManagement; 