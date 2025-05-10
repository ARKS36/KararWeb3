import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProtest, voteOnProtest, getUserVoteOnProtest } from '../services/protestService';
import { submitReport } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function ProtestDetailPage() {
  const [protest, setProtest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  const { protestId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Load protest data
  useEffect(() => {
    const fetchProtest = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getProtest(protestId);
        
        if (result.success) {
          setProtest(result.protest);
          
          // Check if the user has voted on this protest
          if (currentUser) {
            const voteResult = await getUserVoteOnProtest(protestId, currentUser.uid);
            if (voteResult.success) {
              setUserVote(voteResult.vote);
            }
          }
        } else {
          setError('Boykot yüklenirken bir hata oluştu: ' + result.error);
        }
      } catch (error) {
        setError('Boykot yüklenirken bir hata oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (protestId) {
      fetchProtest();
    }
  }, [protestId, currentUser]);

  // Voting process
  const handleVote = async (voteType) => {
    if (!currentUser) {
      alert('Oy vermek için giriş yapmalısınız!');
      navigate('/login');
      return;
    }

    try {
      setVotingInProgress(true);
      
      const result = await voteOnProtest(protestId, currentUser.uid, voteType);
      
      if (result.success) {
        // Update user's vote and vote count
        if (result.action === 'added') {
          // New vote added
          setUserVote(voteType);
          
          // Update protest data
          setProtest(prev => {
            const updatedProtest = {...prev};
            
            if (voteType === 'support') {
              updatedProtest.supportCount = (updatedProtest.supportCount || 0) + 1;
            } else {
              updatedProtest.oppositionCount = (updatedProtest.oppositionCount || 0) + 1;
            }
            
            return updatedProtest;
          });
        } else if (result.action === 'removed') {
          // Vote removed
          setUserVote(null);
          
          // Update protest data
          setProtest(prev => {
            const updatedProtest = {...prev};
            
            if (voteType === 'support') {
              updatedProtest.supportCount = Math.max((updatedProtest.supportCount || 0) - 1, 0);
            } else {
              updatedProtest.oppositionCount = Math.max((updatedProtest.oppositionCount || 0) - 1, 0);
            }
            
            return updatedProtest;
          });
        } else if (result.action === 'changed') {
          // Vote changed
          setUserVote(voteType);
          
          // Update protest data
          setProtest(prev => {
            const updatedProtest = {...prev};
            
            if (voteType === 'support') {
              updatedProtest.supportCount = (updatedProtest.supportCount || 0) + 1;
              updatedProtest.oppositionCount = Math.max((updatedProtest.oppositionCount || 0) - 1, 0);
            } else {
              updatedProtest.oppositionCount = (updatedProtest.oppositionCount || 0) + 1;
              updatedProtest.supportCount = Math.max((updatedProtest.supportCount || 0) - 1, 0);
            }
            
            return updatedProtest;
          });
        }
      } else {
        setError('Oylama işlemi sırasında bir hata oluştu: ' + result.error);
      }
    } catch (error) {
      setError('Oylama işlemi sırasında bir hata oluştu: ' + error.message);
    } finally {
      setVotingInProgress(false);
    }
  };

  // Calculate vote percentages
  const calculatePercentages = () => {
    if (!protest) return { supportPercentage: 50, oppositionPercentage: 50, total: 0 };
    
    const support = protest.supportCount || 0;
    const opposition = protest.oppositionCount || 0;
    const total = support + opposition;
    
    if (total === 0) return { supportPercentage: 50, oppositionPercentage: 50, total: 0 };
    
    const supportPercentage = Math.round((support / total) * 100);
    const oppositionPercentage = 100 - supportPercentage;
    
    return { supportPercentage, oppositionPercentage, total };
  };

  const { supportPercentage, oppositionPercentage, total } = calculatePercentages();

  // Handle reporting a protest
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Rapor göndermek için giriş yapmalısınız!');
      navigate('/login');
      return;
    }
    
    if (!reportReason.trim()) {
      alert('Lütfen bir sebep belirtin');
      return;
    }
    
    try {
      setReportSubmitting(true);
      
      // Add report to Firestore
      const reportData = {
        protestId,
        userId: currentUser.uid,
        reportReason,
        createdAt: new Date(),
        status: 'pending' // pending, reviewed, dismissed
      };
      
      // Submit the report using our service
      const result = await submitReport(reportData);
      
      if (result.success) {
        setReportSuccess(true);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportReason('');
        }, 2000);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      alert('Rapor gönderilirken bir hata oluştu: ' + error.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
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
            <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!protest) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-10">
              <h3 className="mt-2 text-sm font-medium text-gray-900">Boykot Bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aradığınız boykot mevcut değil veya kaldırılmış olabilir.
              </p>
              <div className="mt-6">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Ana Sayfaya Dön
                </Link>
              </div>
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
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="h-64 md:h-96 w-full overflow-hidden relative">
                {protest.isFeatured && (
                  <div className="absolute top-0 right-0 z-10 mt-3 mr-3">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <svg className="-ml-1 mr-1.5 h-4 w-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Öne Çıkan
                    </span>
                  </div>
                )}
                <img 
                  src={protest.imageUrl || 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"%3E%3Crect fill="%23cccccc" width="800" height="400"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="30" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EGörsel Yok%3C/text%3E%3C/svg%3E'} 
                  alt={protest.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"%3E%3Crect fill="%23cccccc" width="800" height="400"/%3E%3Ctext fill="%23666666" font-family="Arial" font-size="30" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EGörsel Yüklenemedi%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                  {protest.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {formatDate(protest.createdAt)}
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:px-6">
                  <p className="text-base text-gray-700 whitespace-pre-line">
                    {protest.description}
                  </p>
                </div>
              </div>
              
              {/* Voting Area - Replace the original voting area with this updated version */}
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <h4 className="text-lg font-medium text-gray-900">Boykotu Oyla</h4>
                <p className="text-sm text-gray-500 mb-4">Bu boykotu destekliyor musunuz?</p>
                
                {/* Vote percentage visualization */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-600 font-medium">Destekleyenler: %{supportPercentage}</span>
                    <span className="text-red-600 font-medium">Karşı Çıkanlar: %{oppositionPercentage}</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-in-out" 
                      style={{ width: `${supportPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Toplam {total} oy
                  </p>
                </div>
                
                {currentUser ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleVote('support')}
                        disabled={votingInProgress}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                          userVote === 'support'
                            ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
                        }`}
                      >
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span className="hidden xs:inline">Destekliyorum</span>
                        <span className="inline xs:hidden">Destek</span>
                        <span className="ml-1">({protest.supportCount || 0})</span>
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleVote('oppose')}
                        disabled={votingInProgress}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                          userVote === 'oppose'
                            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500'
                        }`}
                      >
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 transform rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2a1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span className="hidden xs:inline">Desteklemiyorum</span>
                        <span className="inline xs:hidden">Karşı</span>
                        <span className="ml-1">({protest.oppositionCount || 0})</span>
                      </button>
                    </div>
                    
                    {userVote && (
                      <div className="w-full mt-2 sm:w-auto sm:mt-0 text-sm text-indigo-600 bg-indigo-50 py-1 px-3 rounded-full shadow-sm">
                        Teşekkürler, oyunuz kaydedildi.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-md shadow-sm">
                    <p className="text-sm text-yellow-700">
                      Oy verebilmek için <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500">giriş yapmalısınız</Link>.
                    </p>
                  </div>
                )}
                
                {votingInProgress && (
                  <div className="mt-4 flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
                    <span className="text-sm text-gray-500">İşleniyor...</span>
                  </div>
                )}
                
                {/* Report button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="mr-1.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21a2 2 0 012 2v7.5a2 2 0 01-2 2h-5.5l-1-1H5a2 2 0 00-2 2zm12-12v9.5M8.5 3v1" />
                    </svg>
                    Rapor Et
                  </button>
                </div>
              </div>
              
              {protest.isApproved === false && (
                <div className="bg-yellow-50 px-4 py-3 sm:px-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Bu boykot şu anda onay aşamasındadır. Yönetici onayından sonra ana sayfada görünecektir.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200 px-4 py-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Ana Sayfaya Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-w-[95%] inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all">
              {reportSuccess ? (
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Teşekkürler!
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Raporunuz başarıyla gönderildi. Yöneticilerimiz en kısa sürede inceleyecektir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Boykotu Rapor Et
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-4">
                            Bu içeriği neden uygunsuz bulduğunuzu belirtin. Yöneticilerimiz raporunuzu inceleyecektir.
                          </p>
                          
                          <form onSubmit={handleReportSubmit}>
                            <div className="mb-4">
                              <label htmlFor="reportReason" className="block text-sm font-medium text-gray-700 mb-1">
                                Sebep
                              </label>
                              <select
                                id="reportReason"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                              >
                                <option value="">Seçiniz</option>
                                <option value="spam">Spam / Reklam</option>
                                <option value="inappropriate">Uygunsuz İçerik</option>
                                <option value="misinformation">Yanlış Bilgi</option>
                                <option value="duplicate">Mükerrer İçerik</option>
                                <option value="other">Diğer</option>
                              </select>
                            </div>
                            
                            {reportReason === 'other' && (
                              <div className="mb-4">
                                <label htmlFor="otherReason" className="block text-sm font-medium text-gray-700 mb-1">
                                  Açıklama
                                </label>
                                <textarea
                                  id="otherReason"
                                  rows={3}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  placeholder="Lütfen detayları belirtin..."
                                  required
                                />
                              </div>
                            )}
                            
                            <div className="flex justify-end mt-4">
                              <button
                                type="button"
                                onClick={() => setShowReportModal(false)}
                                className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                İptal
                              </button>
                              <button
                                type="submit"
                                disabled={reportSubmitting || !reportReason}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                {reportSubmitting ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Gönderiliyor...
                                  </>
                                ) : (
                                  'Rapor Et'
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProtestDetailPage; 