import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllProtests, searchProtests } from '../services/protestService';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getAllLocations } from '../utils/locationData';
import ProtestCard from '../components/ProtestCard';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function ProtestsPage() {
  const [protests, setProtests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [isLocationFilterOpen, setIsLocationFilterOpen] = useState(false);
  
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  
  // Get all locations for filtering
  const allLocations = getAllLocations();

  useEffect(() => {
    const fetchProtests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if any filter is applied
        const isFilterApplied = searchText || selectedCategory || selectedLocation || approvalStatus;
        
        if (isFilterApplied) {
          // Use searchProtests with filters
          const result = await searchProtests({
            searchTerm: searchText,
            category: selectedCategory,
            location: selectedLocation,
            isApproved: approvalStatus === 'approved' ? true : 
                        approvalStatus === 'pending' ? false : null,
            limitCount: 50
          });
          
          if (result.success) {
            setProtests(result.protests);
            
            // Extract unique categories
            const uniqueCategories = [...new Set(result.protests
              .filter(protest => protest.category)
              .map(protest => protest.category))];
            setCategories(uniqueCategories);
          } else {
            setError(`${t.error}: ${result.error}`);
          }
        } else {
          // Create filters object
          const filters = {};
          if (approvalStatus) {
            filters.approvalStatus = approvalStatus;
          }
          
          const result = await getAllProtests(filters);
          
          if (result.success) {
            setProtests(result.protests);
            
            // Extract unique categories
            const uniqueCategories = [...new Set(result.protests
              .filter(protest => protest.category)
              .map(protest => protest.category))];
            setCategories(uniqueCategories);
          } else {
            setError(`${t.protestsLoadingError}: ${result.error}`);
          }
        }
      } catch (error) {
        setError(`${t.protestsLoadingError}: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProtests();
  }, [searchText, selectedCategory, selectedLocation, approvalStatus, t]);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', options);
  };

  // Filter protests based on search text, category, location and approval status
  const filterProtests = () => {
    return protests.filter(protest => {
      const matchesSearch = searchText === '' || 
        protest.title?.toLowerCase().includes(searchText.toLowerCase()) || 
        protest.description?.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || 
        protest.category === selectedCategory;
      
      const matchesLocation = selectedLocation === '' || 
        (protest.location && protest.location.includes(selectedLocation));
      
      const matchesApproval = approvalStatus === '' || 
        (approvalStatus === 'approved' && protest.isApproved) ||
        (approvalStatus === 'pending' && !protest.isApproved);
      
      return matchesSearch && matchesCategory && matchesLocation && matchesApproval;
    });
  };

  // Sort protests
  const sortProtests = (protests) => {
    if (sortBy === 'newest') {
      return [...protests].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB - dateA;
      });
    } else if (sortBy === 'oldest') {
      return [...protests].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateA - dateB;
      });
    } else if (sortBy === 'mostSupported') {
      return [...protests].sort((a, b) => (b.supportCount || 0) - (a.supportCount || 0));
    } else if (sortBy === 'mostOpposed') {
      return [...protests].sort((a, b) => (b.oppositionCount || 0) - (a.oppositionCount || 0));
    }
    return protests;
  };

  const filteredProtests = sortProtests(filterProtests());
  
  // Toggle location filter dropdown
  const toggleLocationFilter = () => {
    setIsLocationFilterOpen(!isLocationFilterOpen);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedLocation('');
    setApprovalStatus('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      
      <main className="flex-grow">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-3/5">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{t.protestsTitle}</h1>
                <p className="text-blue-100 text-lg md:pr-8 mb-6">
                  {t.protestsSubtitle}
                </p>
                {/* Add protest button - for larger screens */}
                <div className="hidden md:block">
                  <Link
                    to="/create-protest"
                    className="inline-flex items-center px-5 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addNewProtest}
                  </Link>
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:w-2/5">
                {/* Add protest button - for mobile screens */}
                <div className="md:hidden mb-6">
                  <Link
                    to="/create-protest"
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addNewProtest}
                  </Link>
                </div>
                {/* Search bar - prominently placed in the hero section */}
                <div className="relative text-white">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="quickSearch"
                    id="quickSearch"
                    className="bg-blue-800 bg-opacity-50 block w-full pl-10 pr-3 py-3 border border-blue-600 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t.searchProtests}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Advanced Filters */}
          <div className="bg-white shadow-md rounded-lg p-5 mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.advancedFilters}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">{t.category}</label>
                <select
                  id="category"
                  name="category"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">{t.allCategories}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">{t.location}</label>
                <div className="mt-1 relative">
                  <button
                    type="button"
                    onClick={toggleLocationFilter}
                    className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <span className="block truncate">
                      {selectedLocation || t.selectLocation}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </button>
                  
                  {isLocationFilterOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      <div className="sticky top-0 z-10 bg-white shadow-sm">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-blue-100"
                          onClick={() => {
                            setSelectedLocation('');
                            setIsLocationFilterOpen(false);
                          }}
                        >
                          {t.allLocations}
                        </button>
                      </div>
                    
                      {allLocations.map((location) => (
                        <button
                          key={location}
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-blue-100"
                          onClick={() => {
                            setSelectedLocation(location);
                            setIsLocationFilterOpen(false);
                          }}
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">{t.sortBy}</label>
                <select
                  id="sortBy"
                  name="sortBy"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">{t.newest}</option>
                  <option value="oldest">{t.oldest}</option>
                  <option value="mostSupported">{t.mostSupported}</option>
                  <option value="mostOpposed">{t.mostOpposed}</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  {t.resetFilters}
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
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
            ) : filteredProtests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noProtestsFound}</h3>
                <div className="mt-6">
                  <Link
                    to="/create-protest"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addNewProtest}
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProtests.map((protest) => (
                    <ProtestCard key={protest.id} protest={protest} />
                  ))}
                </div>
                
                {/* Load more button */}
                {filteredProtests.length >= 20 && hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t.loading}
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          {t.loadMore}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default ProtestsPage; 