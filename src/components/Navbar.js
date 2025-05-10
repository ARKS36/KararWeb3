import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import LanguageSwitcher from './LanguageSwitcher';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBoycottMenuOpen, setIsBoycottMenuOpen] = useState(false);
  const { currentUser, logout, isAdmin } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const t = translations[language];

  // Handle navigation
  const handleNavigation = (e, path) => {
    e.preventDefault();
    
    // Close all menus
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsBoycottMenuOpen(false);
    
    // Navigate to the new path
    navigate(path);
  };

  // Optimize scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // Throttle scroll event
    let timeoutId;
    const throttledScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, 100);
    };

    window.addEventListener('scroll', throttledScroll);
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Close mobile menu and profile menu when navigation occurs
  useEffect(() => {
    const cleanup = () => {
      setIsMenuOpen(false);
      setIsProfileMenuOpen(false);
      setIsBoycottMenuOpen(false);
    };

    cleanup();
    return cleanup;
  }, [location.pathname]);

  // Memoize navigation links to prevent unnecessary re-renders
  const navigationLinks = useMemo(() => [
    { path: '/', label: t.home },
    { path: '/protestolar', label: t.protests },
    { path: '/boykotlar', label: t.boycotts },
    { path: '/hakkimizda', label: t.about }
  ], [t]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <nav className={`nav-container sticky top-0 z-40 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 shadow-lg backdrop-blur-sm transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link 
              to="/" 
              onClick={(e) => handleNavigation(e, '/')}
              className="flex-shrink-0 flex items-center group"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-500/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <div className="font-bold text-xl tracking-tight">Karar<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-200">Web3</span></div>
              </div>
            </Link>
            
            <div className="hidden md:flex ml-6 space-x-1">
              <Link 
                to="/" 
                onClick={(e) => handleNavigation(e, '/')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  location.pathname === '/' 
                    ? 'text-white bg-indigo-700/40' 
                    : 'text-indigo-100 hover:text-white hover:bg-indigo-700/20'
                }`}
              >
                {t.home}
              </Link>
              <Link 
                to="/protestolar" 
                onClick={(e) => handleNavigation(e, '/protestolar')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  location.pathname === '/protestolar' 
                    ? 'text-white bg-indigo-700/40' 
                    : 'text-indigo-100 hover:text-white hover:bg-indigo-700/20'
                }`}
              >
                {t.protests}
              </Link>
              
              <Link 
                to="/boykotlar" 
                onClick={(e) => handleNavigation(e, '/boykotlar')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  location.pathname === '/boykotlar' 
                    ? 'text-white bg-indigo-700/40' 
                    : 'text-indigo-100 hover:text-white hover:bg-indigo-700/20'
                }`}
              >
                {t.boycotts}
              </Link>
              
              <Link 
                to="/hakkimizda" 
                onClick={(e) => handleNavigation(e, '/hakkimizda')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  location.pathname === '/hakkimizda' 
                    ? 'text-white bg-indigo-700/40' 
                    : 'text-indigo-100 hover:text-white hover:bg-indigo-700/20'
                }`}
              >
                {t.about}
              </Link>
              
              <a 
                href="https://buymeacoffee.com/kararweb3" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 text-amber-300 hover:text-amber-200 hover:bg-indigo-700/20 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 3h16c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-1v10c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1zm4 5v10h8V8H8z"/>
                  <path d="M12 1l-2 3h4l-2-3z"/>
                  <path d="M17 10a3 3 0 013 3v1a3 3 0 01-3 3h-1v-7h1z"/>
                </svg>
                {t.donate}
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Switcher for Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher mode="navbar" />
            </div>

            {currentUser ? (
              <>
                <div className="hidden md:flex items-center">
                  <Link 
                    to="/create-protest" 
                    className="mr-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm"
                  >
                    <svg className="-ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addProtest}
                  </Link>
                  
                  <Link 
                    to="/create-boycott" 
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm"
                  >
                    <svg className="-ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addBoycott}
                  </Link>
                </div>
                
                <div className="relative ml-3">
                  <div>
                    <button 
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <span className="sr-only">Kullanıcı menüsünü aç</span>
                      <div className="h-8 w-8 rounded-full bg-indigo-700 flex items-center justify-center text-white font-medium border-2 border-indigo-500 shadow-md hover:border-white transition-colors duration-300">
                        {currentUser.email.charAt(0).toUpperCase()}
                      </div>
                    </button>
                  </div>
                  {/* Dropdown menu, show/hide based on menu state */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5 transform transition-all duration-200 origin-top-right animate-zoom-in">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t.profile}
                      </Link>
                      <Link to="/my-protests" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {t.myProtests}
                      </Link>
                      <Link to="/my-boycotts" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l2 2v7.086a2 2 0 01-.586 1.414l-8.707 8.707a2 2 0 01-2.828 0L3 14.414V17a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                        </svg>
                        {t.myBoycotts}
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors duration-200 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {t.adminPanel}
                        </Link>
                      )}
                      <a 
                        href="https://buymeacoffee.com/kararweb3" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors duration-200 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 3h16c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-1v10c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1zm4 5v10h8V8H8z"/>
                          <path d="M12 1l-2 3h4l-2-3z"/>
                          <path d="M17 10a3 3 0 013 3v1a3 3 0 01-3 3h-1v-7h1z"/>
                        </svg>
                        {t.donate}
                      </a>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t.logout}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-indigo-100 hover:text-white hover:bg-indigo-700/30 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-300"
                >
                  {t.login}
                </Link>
                <Link 
                  to="/register" 
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm"
                >
                  {t.register}
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-300"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block animate-fade-in' : 'hidden'}`}>
        <div className="pt-2 pb-4 space-y-1 border-t border-indigo-700/50 bg-gradient-to-b from-indigo-800 to-indigo-900">
          {/* Language Switcher for Mobile */}
          <div className="px-4 py-2.5">
            <LanguageSwitcher mode="navbar" />
          </div>

          <Link
            to="/"
            className={`block px-4 py-2.5 text-base font-medium transition-all duration-300 ${
              location.pathname === '/' 
                ? 'bg-indigo-700/50 text-white border-l-4 border-indigo-300' 
                : 'text-indigo-100 hover:bg-indigo-700/30 hover:text-white hover:border-l-4 hover:border-indigo-300/50'
            }`}
          >
            {t.home}
          </Link>
          <Link
            to="/protestolar"
            className={`block px-4 py-2.5 text-base font-medium transition-all duration-300 ${
              location.pathname === '/protestolar' 
                ? 'bg-indigo-700/50 text-white border-l-4 border-indigo-300' 
                : 'text-indigo-100 hover:bg-indigo-700/30 hover:text-white hover:border-l-4 hover:border-indigo-300/50'
            }`}
          >
            {t.protests}
          </Link>
          <Link
            to="/boykotlar"
            className={`block px-4 py-2.5 text-base font-medium transition-all duration-300 ${
              location.pathname === '/boykotlar' 
                ? 'bg-indigo-700/50 text-white border-l-4 border-indigo-300' 
                : 'text-indigo-100 hover:bg-indigo-700/30 hover:text-white hover:border-l-4 hover:border-indigo-300/50'
            }`}
          >
            {t.boycotts}
          </Link>
          <Link
            to="/hakkimizda"
            className={`block px-4 py-2.5 text-base font-medium transition-all duration-300 ${
              location.pathname === '/hakkimizda' 
                ? 'bg-indigo-700/50 text-white border-l-4 border-indigo-300' 
                : 'text-indigo-100 hover:bg-indigo-700/30 hover:text-white hover:border-l-4 hover:border-indigo-300/50'
            }`}
          >
            {t.about}
          </Link>

          <a
            href="https://buymeacoffee.com/kararweb3"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-2.5 text-base font-medium transition-all duration-300 text-amber-300 hover:bg-indigo-700/30 hover:text-amber-200 hover:border-l-4 hover:border-amber-300/50 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 3h16c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-1v10c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1zm4 5v10h8V8H8z"/>
              <path d="M12 1l-2 3h4l-2-3z"/>
              <path d="M17 10a3 3 0 013 3v1a3 3 0 01-3 3h-1v-7h1z"/>
            </svg>
            {t.donate}
          </a>
          
          {currentUser && (
            <>
              <div className="border-t border-indigo-700/30 pt-2 mt-2">
                <Link
                  to="/create-protest"
                  className="block px-4 py-2.5 text-base font-medium text-indigo-100 hover:bg-indigo-700/30 hover:text-white transition-all duration-300"
                >
                  <div className="flex items-center">
                    <svg className="mr-3 h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addProtest}
                  </div>
                </Link>
                <Link
                  to="/create-boycott"
                  className="block px-4 py-2.5 text-base font-medium text-indigo-100 hover:bg-indigo-700/30 hover:text-white transition-all duration-300"
                >
                  <div className="flex items-center">
                    <svg className="mr-3 h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {t.addBoycott}
                  </div>
                </Link>
              </div>
            </>
          )}
          
          {!currentUser && (
            <div className="border-t border-indigo-700/30 pt-2 pb-3 space-y-1">
              <Link
                to="/login"
                className="block px-4 py-2 text-base font-medium text-indigo-100 hover:bg-indigo-700/30 hover:text-white transition-colors duration-300"
              >
                {t.login}
              </Link>
              <Link
                to="/register"
                className="block mx-4 px-4 py-2 text-base font-medium text-center text-white bg-indigo-500 hover:bg-indigo-600 rounded-md transition-colors duration-300"
              >
                {t.register}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 