import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc, doc, increment, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { getCountryFlag } from '../utils/countryFlags';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

// Component for protest cards on the homepage and similar views
function ProtestCard({ protest }) {
  const { currentUser, logout } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const [isExpanded, setIsExpanded] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteType, setVoteType] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', options);
  };

  // Calculate vote percentages
  const calculatePercentages = () => {
    const support = protest.supportCount || 0;
    const opposition = protest.oppositionCount || 0;
    const total = support + opposition;
    
    if (total === 0) return { supportPercentage: 50, oppositionPercentage: 50, total: 0 };
    
    const supportPercentage = Math.round((support / total) * 100);
    const oppositionPercentage = 100 - supportPercentage;
    
    return { supportPercentage, oppositionPercentage, total };
  };

  const { supportPercentage, oppositionPercentage, total } = calculatePercentages();

  // Toggle expanded description
  const toggleDescription = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    // Check if the user has already voted on this protest
    const checkUserVote = async () => {
      if (!currentUser) return;
      
      try {
        const votesRef = collection(db, 'votes');
        const q = query(
          votesRef,
          where('protestId', '==', protest.id),
          where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setVoted(true);
          setVoteType(querySnapshot.docs[0].data().voteType);
        }
      } catch (error) {
        console.error("Error checking vote status:", error);
        
        // Don't show error to user, just log it and continue
        // We can still let them try to vote, and the server-side rules will prevent duplicates
        if (error.message?.includes('Missing or insufficient permissions')) {
          console.log('Permission issue when checking vote status. Will allow vote attempt.');
        }
      }
    };
    
    checkUserVote();
  }, [currentUser, protest.id]);
  
  const handleReport = async () => {
    if (!currentUser) {
      toast.error('Şikayet göndermek için giriş yapmalısınız.');
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Lütfen bir şikayet nedeni belirtin.');
      return;
    }

    try {
      await addDoc(collection(db, 'reports'), {
        protestId: protest.id,
        userId: currentUser.uid,
        reportReason,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        protestTitle: protest.title,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      toast.success('Şikayetiniz alındı. İnceleme sonrası size dönüş yapılacaktır.');
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      console.error('Şikayet gönderilirken hata oluştu:', error);
      toast.error('Şikayet gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleVote = async (type) => {
    if (!currentUser) {
      toast.error('Oy vermek için giriş yapmalısınız.');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      // Create a unique vote ID using user ID and protest ID
      const voteId = `${currentUser.uid}_${protest.id}`;
      
      // Get existing vote if any
      const voteRef = doc(db, 'votes', voteId);
      const voteDoc = await getDoc(voteRef);
      
      // Start a batch write for atomic operations
      const batch = writeBatch(db);
      
      if (voteDoc.exists()) {
        const existingVote = voteDoc.data();
        
        if (existingVote.voteType === type) {
          // Same vote type - remove vote
          batch.delete(voteRef);
          batch.update(doc(db, 'protests', protest.id), {
            [type === 'support' ? 'supportCount' : 'oppositionCount']: increment(-1)
          });
          
          setVoted(false);
          setVoteType(null);
          toast.success('Oyunuz başarıyla kaldırıldı.');
        } else {
          // Different vote type - change vote
          batch.update(voteRef, {
            voteType: type,
            timestamp: serverTimestamp()
          });
          
          batch.update(doc(db, 'protests', protest.id), {
            [existingVote.voteType === 'support' ? 'supportCount' : 'oppositionCount']: increment(-1),
            [type === 'support' ? 'supportCount' : 'oppositionCount']: increment(1)
          });
          
          setVoted(true);
          setVoteType(type);
          toast.success('Oyunuz başarıyla güncellendi.');
        }
      } else {
        // First time voting
        batch.set(voteRef, {
          protestId: protest.id,
          userId: currentUser.uid,
          voteType: type,
          timestamp: serverTimestamp()
        });
        
        batch.update(doc(db, 'protests', protest.id), {
          [type === 'support' ? 'supportCount' : 'oppositionCount']: increment(1)
        });
        
        setVoted(true);
        setVoteType(type);
        toast.success('Oyunuz başarıyla kaydedildi.');
      }
      
      // Commit all changes atomically
      await batch.commit();
      
    } catch (error) {
      console.error('Oy verme hatası:', error);
      
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        if (error.message?.includes('already exists')) {
          toast.error('Bu protestoya daha önce oy vermişsiniz.');
          setVoted(true);
        } else {
          console.log('Session expired, will retry after refresh');
          toast.error('Oturum süreniz dolmuş olabilir. Lütfen sayfayı yenileyip tekrar deneyin.');
        }
      } else if (error.code === 'unavailable') {
        toast.error('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
      } else {
        toast.error('Oy verilirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className="relative">
        {/* Featured flag */}
        {protest.isFeatured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
            </span>
          </div>
        )}
        
        {/* Image container */}
        <div className="h-56 overflow-hidden">
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img 
            src={protest.imageUrl || 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999999" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E' + (language === 'tr' ? 'Görsel Yok' : 'No Image') + '%3C/text%3E%3C/svg%3E'} 
            alt={protest.title} 
            className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-110"
            onLoad={() => setIsImageLoaded(true)}
            onError={(e) => {
              e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext fill='%23999999' font-family='Arial' font-size='16' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E" + (language === 'tr' ? 'Görsel Yüklenemedi' : 'Image Failed to Load') + "%3C/text%3E%3C/svg%3E";
              setIsImageLoaded(true);
            }}
          />
        </div>
        
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            protest.isApproved 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
              : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
          } shadow-sm`}>
            {protest.isApproved 
              ? (language === 'tr' ? 'Onaylandı' : 'Approved') 
              : (language === 'tr' ? 'Onay Bekliyor' : 'Pending Approval')}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <Link to={`/protest/${protest.id}`}>
          <h3 className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition duration-300 mb-2 line-clamp-2">
            {protest.title}
          </h3>
        </Link>
        
        <div className="flex flex-wrap items-center space-x-2 mb-3">
          <span className="text-sm text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(protest.createdAt)}
          </span>
          
          {protest.location && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {protest.location}
              </span>
            </>
          )}
          
          {protest.country && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500 flex items-center">
                <span className="mr-1">{getCountryFlag(protest.country)}</span>
                {protest.country}
              </span>
            </>
          )}
          
          {protest.protestType && (
            <>
              <span className="text-gray-300">•</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                protest.protestType === 'virtual' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {protest.protestType === 'virtual' 
                  ? (language === 'tr' ? 'Sanal' : 'Virtual') 
                  : (language === 'tr' ? 'Fiziksel' : 'Physical')}
              </span>
            </>
          )}
        </div>
        
        <div className="mb-4">
          <p className={`text-gray-600 text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
            {protest.description}
          </p>
          {protest.description && protest.description.length > 150 && (
            <button 
              onClick={toggleDescription}
              className="text-indigo-600 hover:text-indigo-800 text-xs mt-1 font-medium"
            >
              {isExpanded 
                ? (language === 'tr' ? 'Daha Az Göster' : 'Show Less') 
                : (language === 'tr' ? 'Devamını Oku' : 'Read More')}
            </button>
          )}
        </div>
        
        {/* Vote section */}
        <div className="border-t border-b border-gray-100 py-3 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-gray-500 ml-1.5 text-sm font-medium">
                {total} {total === 1 
                  ? (language === 'tr' ? t.participants : t.participants) 
                  : (language === 'tr' ? t.participantsPlural : t.participantsPlural)}
              </span>
            </div>
          </div>
          
          <div className="flex h-2 mb-2 rounded-full bg-gray-200 overflow-hidden">
            <div 
              className="bg-green-500" 
              style={{ width: `${supportPercentage}%` }}
            />
            <div 
              className="bg-red-500" 
              style={{ width: `${oppositionPercentage}%` }}
            />
          </div>
          
          <div className="flex text-xs text-gray-500 justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
              <span>{language === 'tr' ? 'Destekliyorum' : 'Support'} ({supportPercentage}%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
              <span>{language === 'tr' ? 'Karşıyım' : 'Oppose'} ({oppositionPercentage}%)</span>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to={`/protest/${protest.id}`} className="flex-1">
            <button className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium py-2 px-4 rounded-lg transition-colors duration-300 text-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {language === 'tr' ? t.details : t.details}
            </button>
          </Link>
          <button 
            onClick={() => handleVote('support')}
            disabled={isVoting}
            className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-300 text-sm flex items-center justify-center
              ${voted && voteType === 'support' 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800'}
              ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${voted && voteType === 'support' ? 'text-white' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {voted && voteType === 'support' 
              ? (language === 'tr' ? t.joined : t.joined) 
              : (language === 'tr' ? t.join : t.join)}
          </button>
          <button 
            onClick={() => handleVote('opposition')}
            disabled={isVoting}
            className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-300 text-sm flex items-center justify-center
              ${voted && voteType === 'opposition' 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800'}
              ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${voted && voteType === 'opposition' ? 'text-white' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            {language === 'tr' ? 'Karşıyım' : 'Oppose'}
          </button>
        </div>
      </div>
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'tr' ? 'Protesteyi Şikayet Et' : 'Report Protest'}
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                {language === 'tr' ? 'Şikayet Nedeni' : 'Reason for Report'}
              </label>
              <textarea
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows="4"
                placeholder={language === 'tr' ? 'Lütfen şikayet nedeninizi detaylı bir şekilde açıklayın...' : 'Please explain your reason for reporting in detail...'}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-300"
              >
                {language === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button
                onClick={handleReport}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                {language === 'tr' ? 'Şikayet Et' : 'Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProtestCard; 