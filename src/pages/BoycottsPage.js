import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBoycotts, searchBoycotts, getAllBoycotts } from '../services/boycottService';
import BoycottCard from '../components/BoycottCard';
import Footer from '../components/Footer';
import { useDebounce } from '../hooks/useDebounce';
import { provinces, getDistrictsForProvince, getAllLocations } from '../utils/locationData';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function BoycottsPage() {
  const [boycotts, setBoycotts] = useState([]);
  const [filteredBoycotts, setFilteredBoycotts] = useState([]);
  const [allBoycotts, setAllBoycotts] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocationFilterOpen, setIsLocationFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const navigate = useNavigate();
  
  const { language } = useLanguage();
  const t = translations[language];
  
  // Main categories and corresponding subcategories
  const mainCategories = [t.brands, t.celebrities];
  
  const subCategoriesMap = {
    [t.brands]: [t.media, t.fuel, t.foodAndDrink, t.market, t.furniture, t.clothing, t.technology, t.other],
    [t.celebrities]: [t.artists, t.actors, t.socialMedia, t.athletes, t.businessPeople, t.other]
  };
  
  // Get all locations for filtering
  const allLocations = getAllLocations();
  
  // Update subcategories when main category changes
  useEffect(() => {
    if (selectedMainCategory) {
      setAvailableSubCategories(subCategoriesMap[selectedMainCategory] || []);
      setSelectedSubCategory(''); // Reset subcategory when main category changes
    } else {
      setAvailableSubCategories([]);
    }
  }, [selectedMainCategory, subCategoriesMap]);
  
  // Load all boycotts once for client-side filtering
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAllBoycotts();
        
        if (result.success) {
          setAllBoycotts(result.boycotts);
          setBoycotts(result.boycotts);
        } else {
          setError(result.error || 'Boykotlar yüklenirken bir hata oluştu');
        }
      } catch (error) {
        setError('Boykotlar yüklenirken bir hata oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    let isMounted = true;
    
    if (isMounted) {
      fetchData();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      setBoycotts([]);
      setAllBoycotts([]);
      setFilteredBoycotts([]);
      setError(null);
      setLoading(false);
    };
  }, []);
  
  // Load boycotts on initial load and category changes
  useEffect(() => {
    if (!debouncedSearchTerm) {
      loadBoycotts();
    }
  }, [selectedMainCategory, selectedSubCategory, selectedLocation, debouncedSearchTerm]);
  
  // Handle search term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch();
    }
  }, [debouncedSearchTerm, selectedMainCategory, selectedSubCategory, selectedLocation]);
  
  // Optimize search operation with useMemo
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm && !selectedMainCategory && !selectedSubCategory && !selectedLocation) {
      return allBoycotts;
    }

    return performSearch();
  }, [debouncedSearchTerm, selectedMainCategory, selectedSubCategory, selectedLocation, allBoycotts]);

  // Update filtered boycotts when search results change
  useEffect(() => {
    setFilteredBoycotts(searchResults);
  }, [searchResults]);
  
  // Client-side search function
  const performSearch = () => {
    setIsSearching(true);
    
    // Normalize the search term (lowercase and remove accents)
    const normalizedSearchTerm = debouncedSearchTerm.toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    // Filter boycotts based on search term and categories
    const results = allBoycotts.filter(boycott => {
      // Apply category filters
      if (selectedMainCategory && boycott.mainCategory !== selectedMainCategory) {
        return false;
      }
      
      if (selectedSubCategory && boycott.subCategory !== selectedSubCategory) {
        return false;
      }
      
      // Apply location filter
      if (selectedLocation && (!boycott.location || !boycott.location.toLowerCase().includes(selectedLocation.toLowerCase()))) {
        return false;
      }
      
      // If there's no search term, return true for items that passed the category and location filters
      if (!normalizedSearchTerm) {
        return true;
      }
      
      // Normalize the title and description for searching
      const normalizedTitle = (boycott.title || '').toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
      
      const normalizedDescription = (boycott.description || '').toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
      
      // Search in title and description
      return normalizedTitle.includes(normalizedSearchTerm) || 
             normalizedDescription.includes(normalizedSearchTerm);
    });
    
    setIsSearching(false);
    return results;
  };
  
  // Function to load boycotts with filters
  const loadBoycotts = async (isLoadMore = false) => {
    try {
      setLoading(true);
      
      let result;
      if (selectedMainCategory || selectedSubCategory || selectedLocation || searchTerm) {
        // Use search function if there are category filters
        result = await searchBoycotts({
          searchTerm: searchTerm,
          mainCategory: selectedMainCategory,
          subCategory: selectedSubCategory,
          location: selectedLocation,
          isApproved: true,
          limitCount: 50
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }

        // Apply sorting on the client side
        const sortedResults = sortBoycotts(result.boycotts);
        
        if (sortedResults.length === 0) {
          setHasMore(false);
          setBoycotts([]);
        } else {
          setBoycotts(sortedResults);
          setFilteredBoycotts(sortedResults);
          setHasMore(false); // Disable pagination for search results
        }
      } else {
        // Use regular getBoycotts if no filters
        result = await getBoycotts(isLoadMore ? lastVisible : null, 20);
        
        if (result.boycotts.length === 0) {
          setHasMore(false);
        } else {
          setLastVisible(result.lastVisible);
          
          // Apply sorting
          const sortedResults = sortBoycotts(result.boycotts);
          
          // If loading more, append to existing boycotts
          if (isLoadMore) {
            setBoycotts(prev => [...prev, ...sortedResults]);
          } else {
            setBoycotts(sortedResults);
            setHasMore(true);
          }
        }
      }
    } catch (error) {
      console.error(t.boycottsLoadingError, error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle loading more boycotts
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadBoycotts(true);
    }
  };
  
  // Handle main category filter change
  const handleMainCategoryChange = (category) => {
    setSelectedMainCategory(category === selectedMainCategory ? '' : category);
  };
  
  // Handle subcategory filter change
  const handleSubCategoryChange = (category) => {
    setSelectedSubCategory(category === selectedSubCategory ? '' : category);
  };
  
  // Handle location filter change
  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  // Toggle location filter dropdown
  const toggleLocationFilter = () => {
    setIsLocationFilterOpen(!isLocationFilterOpen);
  };
  
  // Handle clicks outside of the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationFilterOpen(false);
      }
    }
    
    // Add event listener only when dropdown is open
    if (isLocationFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLocationFilterOpen]);
  
  // Reset all filters and search
  const resetFilters = () => {
    setSelectedMainCategory('');
    setSelectedSubCategory('');
    setSelectedLocation('');
    setSearchTerm('');
    setSortBy('newest');
  };

  // Display either filtered boycotts or all boycotts
  const displayedBoycotts = debouncedSearchTerm ? filteredBoycotts : boycotts;

  // Sort boycotts
  const sortBoycotts = (boycotts) => {
    if (sortBy === 'newest') {
      return [...boycotts].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB - dateA;
      });
    } else if (sortBy === 'oldest') {
      return [...boycotts].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateA - dateB;
      });
    } else if (sortBy === 'mostSupported') {
      return [...boycotts].sort((a, b) => (b.supportCount || 0) - (a.supportCount || 0));
    } else if (sortBy === 'mostOpposed') {
      return [...boycotts].sort((a, b) => (b.oppositionCount || 0) - (a.oppositionCount || 0));
    }
    return boycotts;
  };

  // Format date based on language
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', options);
  };

  const locationDropdownRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset all states when component unmounts or when language changes
  useEffect(() => {
    const resetStates = () => {
      if (isMounted.current) {
        setBoycotts([]);
        setFilteredBoycotts([]);
        setAllBoycotts([]);
        setLastVisible(null);
        setLoading(true);
        setHasMore(true);
        setSelectedMainCategory('');
        setSelectedSubCategory('');
        setSelectedLocation('');
        setAvailableSubCategories([]);
        setSearchTerm('');
        setIsSearching(false);
        setIsLocationFilterOpen(false);
        setSortBy('newest');
        setError(null);
      }
    };

    // Initial load
    fetchInitialData();

    return resetStates;
  }, [language]);

  const fetchInitialData = async () => {
    try {
      if (!isMounted.current) return;
      
      setLoading(true);
      setError(null);
      
      const result = await getAllBoycotts();
      
      if (!isMounted.current) return;
      
      if (result.success) {
        setAllBoycotts(result.boycotts);
        setBoycotts(result.boycotts);
        setFilteredBoycotts(result.boycotts);
      } else {
        setError(result.error || 'Boykotlar yüklenirken bir hata oluştu');
      }
    } catch (error) {
      if (isMounted.current) {
        setError('Boykotlar yüklenirken bir hata oluştu: ' + error.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Handle navigation
  const handleNavigation = (path) => {
    // Reset states before navigation
    setBoycotts([]);
    setFilteredBoycotts([]);
    setAllBoycotts([]);
    setError(null);
    setLoading(false);
    
    // Navigate to the new path
    navigate(path);
  };

  const handleBoycottClick = useCallback((boycottId) => {
    navigate(`/boycott/${boycottId}`);
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-500">{error}</div>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      
      <main className="flex-grow">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-3/5">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{t.boycottsTitle}</h1>
                <p className="text-indigo-100 text-lg md:pr-8 mb-6">
                  {t.boycottsSubtitle}
                </p>
                {/* Add boycott button - for larger screens */}
                <div className="hidden md:block">
                  <Link
                    to="/create-boycott"
                    className="inline-flex items-center px-5 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addNewBoycott}
                  </Link>
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:w-2/5">
                {/* Add boycott button - for mobile screens */}
                <div className="md:hidden mb-6">
                  <Link
                    to="/create-boycott"
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addNewBoycott}
                  </Link>
                </div>
                {/* Search bar */}
                <div className="relative text-white">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="quickSearch"
                    id="quickSearch"
                    className="bg-indigo-800 bg-opacity-50 block w-full pl-10 pr-3 py-3 border border-indigo-600 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={t.searchBoycotts}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
            
            {/* Category filters - pills style */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">{t.mainCategory}</h3>
              <div className="flex flex-wrap gap-2">
                {mainCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleMainCategoryChange(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      selectedMainCategory === category
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } transition-colors duration-200`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sub-category filters */}
            {selectedMainCategory && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{t.subCategory}</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSubCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleSubCategoryChange(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        selectedSubCategory === category
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } transition-colors duration-200`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {/* Location filter */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">{t.location}</label>
                <div className="mt-1 relative" ref={locationDropdownRef}>
                  <button
                    type="button"
                    onClick={toggleLocationFilter}
                    className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    <div className="dropdown-container absolute z-30 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      <div className="sticky top-0 z-30 bg-white shadow-sm">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-indigo-100"
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
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-indigo-100"
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
              
              {/* Sort filter */}
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">{t.sortBy}</label>
                <select
                  id="sortBy"
                  name="sortBy"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">{t.newest}</option>
                  <option value="oldest">{t.oldest}</option>
                  <option value="mostSupported">{t.mostSupported}</option>
                </select>
              </div>
              
              {/* Reset filters */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  {t.resetFilters}
                </button>
              </div>
            </div>
          </div>
          
          {/* Display boycotts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : displayedBoycotts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noBoycottsFound}</h3>
              <div className="mt-6">
                <Link
                  to="/create-boycott"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {t.addNewBoycott}
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedBoycotts.map((boycott) => (
                  <BoycottCard
                    key={boycott.id}
                    boycott={boycott}
                    onClick={() => handleBoycottClick(boycott.id)}
                  />
                ))}
              </div>
              
              {/* Load more button */}
              {!searchTerm && !selectedMainCategory && !selectedSubCategory && !selectedLocation && hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      </main>
      
      <Footer />
    </div>
  );
}

export default BoycottsPage; 