import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllProtests, getFeaturedProtests } from '../services/protestService';
import { getAllBoycotts, getFeaturedBoycotts } from '../services/boycottService';
import Footer from '../components/Footer';
import HomeHeader from '../components/HomeHeader';
import AtaturkSpeech from '../components/AtaturkSpeech';
import HowItWorks from '../components/HowItWorks';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function HomePage() {
  const [featuredProtests, setFeaturedProtests] = useState([]);
  const [featuredBoycotts, setFeaturedBoycotts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const fetchFeaturedData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch featured protests
        const featuredProtestsResult = await getFeaturedProtests();
        if (featuredProtestsResult.success) {
          setFeaturedProtests(featuredProtestsResult.protests);
          console.log(language === 'tr' ? 'Öne çıkan protestolar:' : 'Featured protests:', featuredProtestsResult.protests);
        } else {
          console.error(
            language === 'tr' 
              ? 'Öne çıkan protestolar yüklenirken bir hata oluştu:' 
              : 'An error occurred while loading featured protests:', 
            featuredProtestsResult.error
          );
        }
        
        // Fetch featured boycotts
        const featuredBoycottsResult = await getFeaturedBoycotts();
        if (featuredBoycottsResult.success) {
          setFeaturedBoycotts(featuredBoycottsResult.boycotts);
          console.log(language === 'tr' ? 'Öne çıkan boykotlar:' : 'Featured boycotts:', featuredBoycottsResult.boycotts);
        } else {
          console.error(
            language === 'tr' 
              ? 'Öne çıkan boykotlar yüklenirken bir hata oluştu:' 
              : 'An error occurred while loading featured boycotts:', 
            featuredBoycottsResult.error
          );
        }
      } catch (error) {
        setError(language === 'tr' ? 'Veriler yüklenirken bir hata oluştu: ' : 'An error occurred while loading data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedData();
  }, [language]);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', options);
  };

  // Protest card component
  const ProtestCard = ({ protest }) => {
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
    
    return (
    <div className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300 min-w-[300px] w-[320px] flex-shrink-0">
      <div className="h-48 w-full overflow-hidden">
        <img 
          src={protest.imageUrl || `https://via.placeholder.com/300x200?text=${language === 'tr' ? 'Görsel+Yok' : 'No+Image'}`} 
          alt={protest.title} 
          className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/300x200?text=${language === 'tr' ? 'Görsel+Yüklenemedi' : 'Image+Failed'}`;
          }}
        />
      </div>
      <div className="px-4 py-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {protest.title}
          </h3>
          <div className="flex items-center ml-2">
            {protest.isFeatured && (
              <span className="px-2 py-1 mr-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
              </span>
            )}
            <span className={`px-2 py-1 text-xs rounded-full ${protest.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {protest.isApproved 
                ? (language === 'tr' ? 'Onaylandı' : 'Approved') 
                : (language === 'tr' ? 'Onay Bekliyor' : 'Pending Approval')}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {formatDate(protest.createdAt)}
        </p>
        {protest.category && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
            {protest.category}
          </span>
        )}
        
        {/* Location information */}
        {protest.location && (
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{protest.location}</span>
          </div>
        )}
        
        <p className="mt-2 text-sm text-gray-500 line-clamp-3">
          {protest.description?.length > 150
            ? `${protest.description.substring(0, 150)}...`
            : protest.description}
          {!protest.description && (language === 'tr' ? 'Bu protesto için açıklama bulunmamaktadır.' : 'No description available for this protest.')}
        </p>
        
        {/* Vote percentage visualization */}
        <div className="mt-4 mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-green-600">
              {language === 'tr' ? 'Destekleyenler: %' : 'Supporters: %'}{supportPercentage}
            </span>
            <span className="font-medium text-red-600">
              {language === 'tr' ? 'Karşı Çıkanlar: %' : 'Opposition: %'}{oppositionPercentage}
            </span>
          </div>
          
          <div className="h-2.5 flex w-full rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
              style={{ width: `${supportPercentage}%` }}
            ></div>
            <div 
              className="bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500 ease-out"
              style={{ width: `${oppositionPercentage}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-gray-500 mt-1 text-center">
            {language === 'tr' ? `Toplam ${total} oy` : `Total ${total} votes`}
          </p>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {protest.supportCount || 0}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1 h-5 w-5 text-red-500 transform rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {protest.oppositionCount || 0}
            </div>
          </div>
          <Link
            to={`/protest/${protest.id}`}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
          >
            {t.details}
          </Link>
        </div>
      </div>
    </div>
  )};
  
  // Boycott card component
  const BoycottCard = ({ boycott }) => {
    // Calculate vote percentages
    const calculatePercentages = () => {
      const support = boycott.supportCount || 0;
      const opposition = boycott.oppositionCount || 0;
      const total = support + opposition;
      
      if (total === 0) return { supportPercentage: 50, oppositionPercentage: 50, total: 0 };
      
      const supportPercentage = Math.round((support / total) * 100);
      const oppositionPercentage = 100 - supportPercentage;
      
      return { supportPercentage, oppositionPercentage, total };
    };
    
    const { supportPercentage, oppositionPercentage, total } = calculatePercentages();
    
    return (
      <div className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300 min-w-[300px] w-[320px] flex-shrink-0">
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={boycott.imageURL || boycott.imageUrl || `https://via.placeholder.com/300x200?text=${language === 'tr' ? 'Görsel+Yok' : 'No+Image'}`} 
            alt={boycott.title} 
            className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/300x200?text=${language === 'tr' ? 'Görsel+Yüklenemedi' : 'Image+Failed'}`;
            }}
          />
        </div>
        <div className="px-4 py-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {boycott.title}
            </h3>
            <div className="flex items-center ml-2">
              {boycott.isFeatured && (
                <span className="px-2 py-1 mr-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {language === 'tr' ? 'Öne Çıkan' : 'Featured'}
                </span>
              )}
              <span className={`px-2 py-1 text-xs rounded-full ${boycott.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {boycott.isApproved 
                  ? (language === 'tr' ? 'Onaylandı' : 'Approved') 
                  : (language === 'tr' ? 'Onay Bekliyor' : 'Pending Approval')}
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(boycott.createdAt)}
          </p>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {boycott.mainCategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {boycott.mainCategory}
              </span>
            )}
            {boycott.subCategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {boycott.subCategory}
              </span>
            )}
          </div>
          
          <p className="mt-2 text-sm text-gray-500 line-clamp-3">
            {boycott.description?.length > 150
              ? `${boycott.description.substring(0, 150)}...`
              : boycott.description}
            {!boycott.description && (language === 'tr' ? 'Bu boykot için açıklama bulunmamaktadır.' : 'No description available for this boycott.')}
          </p>
          
          {/* Vote percentage visualization */}
          <div className="mt-4 mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-green-600">
                {language === 'tr' ? 'Destekleyenler: %' : 'Supporters: %'}{supportPercentage}
              </span>
              <span className="font-medium text-red-600">
                {language === 'tr' ? 'Karşı Çıkanlar: %' : 'Opposition: %'}{oppositionPercentage}
              </span>
            </div>
            
            <div className="h-2.5 flex w-full rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
                style={{ width: `${supportPercentage}%` }}
              ></div>
              <div 
                className="bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500 ease-out"
                style={{ width: `${oppositionPercentage}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-gray-500 mt-1 text-center">
              {language === 'tr' ? `Toplam ${total} oy` : `Total ${total} votes`}
            </p>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <div className="flex space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                {boycott.supportCount || 0}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1 h-5 w-5 text-red-500 transform rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                {boycott.oppositionCount || 0}
              </div>
            </div>
            <Link
              to={`/boycott/${boycott.id}`}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
            >
              {t.details}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <main className="flex-grow">
        <HomeHeader />
        
        <AtaturkSpeech />
        
        {/* Featured Protests Section - Made more prominent */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{t.featuredProtests}</h2>
              <p className="mt-2 text-lg text-gray-600">
                {language === 'tr' 
                  ? 'Gündemdeki önemli protestolar ve katılım bilgileri' 
                  : 'Important protests in the agenda and participation information'}
              </p>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            ) : featuredProtests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t.noProtests}</p>
              </div>
            ) : (
              <div className="relative">
                <div className="flex overflow-x-auto pb-4 hide-scrollbar space-x-6 scroll-smooth" id="protestsScrollContainer">
                  {featuredProtests.map(protest => (
                    <div key={protest.id} className="w-[320px] flex-shrink-0">
                      <ProtestCard protest={protest} />
                    </div>
                  ))}
                </div>
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gradient-to-r from-white to-transparent w-16 h-full pointer-events-none"></div>
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gradient-to-l from-white to-transparent w-16 h-full pointer-events-none"></div>
                
                {/* Scroll arrows */}
                <button 
                  onClick={() => document.getElementById('protestsScrollContainer').scrollBy({left: -320, behavior: 'smooth'})}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:shadow-xl text-indigo-600 hover:text-indigo-800 focus:outline-none border border-gray-200 hover:border-indigo-300 transition-all duration-300"
                  aria-label={language === 'tr' ? 'Sola kaydır' : 'Scroll left'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => document.getElementById('protestsScrollContainer').scrollBy({left: 320, behavior: 'smooth'})}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:shadow-xl text-indigo-600 hover:text-indigo-800 focus:outline-none border border-gray-200 hover:border-indigo-300 transition-all duration-300"
                  aria-label={language === 'tr' ? 'Sağa kaydır' : 'Scroll right'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Scroll indicator */}
                <div className="flex justify-center mt-4">
                  <div className="flex items-center px-3 py-1.5 rounded-full bg-gray-100 shadow-inner text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>{language === 'tr' ? 'Daha fazla görmek için kaydırın' : 'Scroll to see more'}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center mt-8">
              <Link 
                to="/protestolar"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {t.allProtests}
                <svg className="ml-2 -mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Featured Boycotts Section */}
        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{t.featuredBoycotts}</h2>
              <p className="mt-2 text-lg text-gray-600">
                {language === 'tr' 
                  ? 'Etkili boykotlar ve katılım durumları' 
                  : 'Effective boycotts and participation status'}
              </p>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            ) : featuredBoycotts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t.noBoycotts}</p>
              </div>
            ) : (
              <div className="relative">
                <div className="flex overflow-x-auto pb-4 hide-scrollbar space-x-6 scroll-smooth" id="boycottsScrollContainer">
                  {featuredBoycotts.map(boycott => (
                    <div key={boycott.id} className="w-[320px] flex-shrink-0">
                      <BoycottCard boycott={boycott} />
                    </div>
                  ))}
                </div>
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gradient-to-r from-white to-transparent w-16 h-full pointer-events-none"></div>
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gradient-to-l from-white to-transparent w-16 h-full pointer-events-none"></div>
                
                {/* Scroll arrows */}
                <button 
                  onClick={() => document.getElementById('boycottsScrollContainer').scrollBy({left: -320, behavior: 'smooth'})}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:shadow-xl text-indigo-600 hover:text-indigo-800 focus:outline-none border border-gray-200 hover:border-indigo-300 transition-all duration-300"
                  aria-label={language === 'tr' ? 'Sola kaydır' : 'Scroll left'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => document.getElementById('boycottsScrollContainer').scrollBy({left: 320, behavior: 'smooth'})}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:shadow-xl text-indigo-600 hover:text-indigo-800 focus:outline-none border border-gray-200 hover:border-indigo-300 transition-all duration-300"
                  aria-label={language === 'tr' ? 'Sağa kaydır' : 'Scroll right'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Scroll indicator */}
                <div className="flex justify-center mt-4">
                  <div className="flex items-center px-3 py-1.5 rounded-full bg-gray-100 shadow-inner text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>{language === 'tr' ? 'Daha fazla görmek için kaydırın' : 'Scroll to see more'}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center mt-8">
              <Link 
                to="/boykotlar"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {t.exploreBoycotts}
                <svg className="ml-2 -mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
        
        <HowItWorks />
      </main>
      
      <Footer />
    </div>
  );
}

export default HomePage; 