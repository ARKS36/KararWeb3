import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { getBoycott, voteOnBoycott, getUserVoteOnBoycott, deleteBoycott } from '../services/boycottService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function BoycottDetailPage() {
  const { boycottId } = useParams();
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  
  const [boycott, setBoycott] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [supportCount, setSupportCount] = useState(0);
  const [oppositionCount, setOppositionCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  // Calculate vote percentages
  const calculatePercentages = () => {
    const support = supportCount || 0;
    const opposition = oppositionCount || 0;
    const total = support + opposition;
    
    if (total === 0) return { supportPercentage: 50, oppositionPercentage: 50, total: 0 };
    
    const supportPercentage = Math.round((support / total) * 100);
    const oppositionPercentage = 100 - supportPercentage;
    
    return { supportPercentage, oppositionPercentage, total };
  };

  const { supportPercentage, oppositionPercentage, total } = calculatePercentages();
  
  // Fetch boycott details and user vote
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get boycott details
        const result = await getBoycott(boycottId);
        
        if (result.success) {
          setBoycott(result.boycott);
          setSupportCount(result.boycott.supportCount || 0);
          setOppositionCount(result.boycott.oppositionCount || 0);
          
          // Get user vote if logged in
          if (currentUser) {
            const voteResult = await getUserVoteOnBoycott(boycottId, currentUser.uid);
            if (voteResult.success) {
              setUserVote(voteResult.vote);
            }
          }
        } else {
          setError(language === 'tr' ? 'Boykot bilgileri yüklenirken hata oluştu' : 'An error occurred while loading boycott information');
        }
      } catch (error) {
        console.error(
          language === 'tr' 
            ? 'Boykot detayları yüklenirken hata oluştu:' 
            : 'An error occurred while loading boycott details:', 
          error
        );
        setError(
          language === 'tr' 
            ? 'Boykot bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
            : 'An error occurred while loading boycott information. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [boycottId, currentUser, language]);
  
  // Handle voting
  const handleVote = async (voteType) => {
    if (!currentUser) {
      toast.error(language === 'tr' ? 'Oy vermek için giriş yapmalısınız.' : 'You must be logged in to vote.');
      return;
    }
    
    try {
      setIsVoting(true);
      const result = await voteOnBoycott(boycottId, currentUser.uid, voteType);
      
      if (result.success) {
        if (result.action === 'added') {
          setUserVote(voteType);
          if (voteType === 'support') {
            setSupportCount(prev => prev + 1);
          } else {
            setOppositionCount(prev => prev + 1);
          }
          toast.success(language === 'tr' ? 'Oyunuz başarıyla kaydedildi.' : 'Your vote was successfully recorded.');
        } else if (result.action === 'removed') {
          setUserVote(null);
          if (voteType === 'support') {
            setSupportCount(prev => prev - 1);
          } else {
            setOppositionCount(prev => prev - 1);
          }
          toast.success(language === 'tr' ? 'Oyunuz başarıyla kaldırıldı.' : 'Your vote was successfully removed.');
        } else if (result.action === 'changed') {
          setUserVote(voteType);
          if (voteType === 'support') {
            setSupportCount(prev => prev + 1);
            setOppositionCount(prev => prev - 1);
          } else {
            setSupportCount(prev => prev - 1);
            setOppositionCount(prev => prev + 1);
          }
          toast.success(language === 'tr' ? 'Oyunuz başarıyla güncellendi.' : 'Your vote was successfully updated.');
        }
      } else {
        toast.error(result.error || (language === 'tr' ? 'Oy verme işlemi sırasında bir hata oluştu.' : 'An error occurred during voting.'));
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(language === 'tr' ? 'Oy verme işlemi sırasında bir hata oluştu.' : 'An error occurred during voting.');
    } finally {
      setIsVoting(false);
    }
  };
  
  // Handle boycott deletion
  const handleDelete = async () => {
    if (!window.confirm(
      language === 'tr' 
        ? 'Bu boykotu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
        : 'Are you sure you want to delete this boycott? This action cannot be undone.'
    )) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const result = await deleteBoycott(boycottId);
      
      if (result.success) {
        toast.success(language === 'tr' ? 'Boykot başarıyla silindi.' : 'Boycott was successfully deleted.');
        navigate('/boykotlar');
      } else {
        toast.error(
          language === 'tr' 
            ? `Boykot silinirken hata oluştu: ${result.error}` 
            : `An error occurred while deleting the boycott: ${result.error}`
        );
      }
    } catch (error) {
      console.error(language === 'tr' ? 'Boykot silinirken hata oluştu:' : 'Error deleting boycott:', error);
      toast.error(language === 'tr' ? 'Boykot silinirken bir hata oluştu.' : 'An error occurred while deleting the boycott.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return language === 'tr' ? 'Bilinmeyen tarih' : 'Unknown date';
    
    try {
      const date = timestamp.toDate();
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: language === 'tr' ? tr : enUS 
      });
    } catch (error) {
      return language === 'tr' ? 'Geçersiz tarih' : 'Invalid date';
    }
  };
  
  // Get category icon based on main category
  const getCategoryIcon = () => {
    if (!boycott) return null;
    
    switch (boycott.mainCategory) {
      case 'Markalar':
      case 'Brands':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'Ünlüler':
      case 'Celebrities':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !boycott) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-xl font-medium text-gray-900">
                {language === 'tr' ? 'Boykot Bulunamadı' : 'Boycott Not Found'}
              </h3>
              <p className="mt-1 text-gray-500">
                {error || (language === 'tr' 
                  ? 'Aradığınız boykot bulunamadı veya silinmiş olabilir.' 
                  : 'The boycott you are looking for could not be found or may have been deleted.')}
              </p>
              <div className="mt-6">
                <Link
                  to="/boykotlar"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  {language === 'tr' ? 'Boykotlar Sayfasına Dön' : 'Return to Boycotts Page'}
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
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumbs */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  {language === 'tr' ? 'Ana Sayfa' : 'Home'}
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link to="/boykotlar" className="ml-2 text-gray-500 hover:text-gray-700">
                  {language === 'tr' ? 'Boykotlar' : 'Boycotts'}
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-gray-700 font-medium truncate max-w-xs">
                  {boycott.title}
                </span>
              </li>
            </ol>
          </nav>
          
          {/* Boycott detail card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {boycott.imageURL && (
              <div className="relative h-64 sm:h-96 bg-gray-200">
                <img 
                  src={boycott.imageURL} 
                  alt={boycott.title} 
                  className="w-full h-full object-cover"
                />
                {boycott.isFeatured && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 text-sm font-bold rounded-full">
                    {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
                  </div>
                )}
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span className="flex items-center mr-4">
                  {getCategoryIcon()}
                  <span className="ml-1">{boycott.mainCategory}</span>
                </span>
                <span className="flex items-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>{boycott.subCategory}</span>
                </span>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(boycott.createdAt)}</span>
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{boycott.title}</h1>
              
              <div className="text-lg text-gray-700 mb-8 whitespace-pre-line">
                {boycott.description}
              </div>
              
              {/* Voting section */}
              <div className="border-t border-gray-200 pt-6">
                {/* Vote percentage visualization */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-600 font-medium">
                      {language === 'tr' ? 'Destekleyenler: %' : 'Supporters: %'}{supportPercentage}
                    </span>
                    <span className="text-red-600 font-medium">
                      {language === 'tr' ? 'Karşı Çıkanlar: %' : 'Opposition: %'}{oppositionPercentage}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-in-out" 
                      style={{ width: `${supportPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {language === 'tr' 
                      ? `Toplam ${total} oy` 
                      : `Total ${total} votes`}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex space-x-4 mb-4 sm:mb-0">
                    <button 
                      className={`flex items-center text-base px-4 py-2 rounded-full border ${
                        userVote === 'support' 
                          ? 'bg-green-100 text-green-600 border-green-300' 
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-green-50'
                      }`}
                      onClick={() => handleVote('support')}
                      disabled={isVoting}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        {language === 'tr' 
                          ? `Destekliyorum (${supportCount})` 
                          : `Support (${supportCount})`}
                      </span>
                    </button>
                    
                    <button 
                      className={`flex items-center text-base px-4 py-2 rounded-full border ${
                        userVote === 'opposition' 
                          ? 'bg-red-100 text-red-600 border-red-300' 
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-red-50'
                      }`}
                      onClick={() => handleVote('opposition')}
                      disabled={isVoting}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>
                        {language === 'tr' 
                          ? `Desteklemiyorum (${oppositionCount})` 
                          : `Oppose (${oppositionCount})`}
                      </span>
                    </button>
                  </div>
                  
                  {/* Admin or creator actions */}
                  {(isAdmin || (currentUser && boycott.creatorUserId === currentUser.uid)) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md bg-white text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {isDeleting ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        {isDeleting 
                          ? (language === 'tr' ? 'Siliniyor...' : 'Deleting...') 
                          : (language === 'tr' ? 'Sil' : 'Delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Back button */}
          <div className="mt-6">
            <Link
              to="/boykotlar"
              className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {language === 'tr' ? 'Boykotlar Sayfasına Dön' : 'Return to Boycotts Page'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoycottDetailPage; 