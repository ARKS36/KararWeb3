import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const Footer = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="bg-gradient-to-b from-indigo-900 to-black text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo and description */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <div className="font-bold text-2xl tracking-tight">Karar<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">Web3</span></div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {t.platformDescription}
            </p>
            <div className="flex space-x-5">
              <a href="https://twitter.com" className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 transform hover:scale-110" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://facebook.com" className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 transform hover:scale-110" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://instagram.com" className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 transform hover:scale-110" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-5 border-b border-indigo-700/50 pb-2 inline-block text-indigo-200">{t.quickLinks}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white flex items-center group transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{t.home}</span>
                </Link>
              </li>
              <li>
                <Link to="/protestolar" className="text-gray-300 hover:text-white flex items-center group transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{t.protests}</span>
                </Link>
              </li>
              <li>
                <Link to="/boykotlar" className="text-gray-300 hover:text-white flex items-center group transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{t.boycotts}</span>
                </Link>
              </li>
              <li>
                <Link to="/hakkimizda" className="text-gray-300 hover:text-white flex items-center group transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{t.about}</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Katılım */}
          <div>
            <h3 className="text-lg font-semibold mb-5 border-b border-indigo-700/50 pb-2 inline-block text-indigo-200">{t.participation}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/create-protest" className="text-gray-300 hover:text-white flex items-center group transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{t.startProtest}</span>
                </Link>
              </li>
              <li>
                <Link to="/create-boycott" className="text-gray-300 hover:text-white flex items-center group transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{t.createBoycott}</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-white flex items-center group transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{t.login}</span>
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-300 hover:text-white flex items-center group transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{t.register}</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4: İletişim */}
          <div>
            <h3 className="text-lg font-semibold mb-5 border-b border-indigo-700/50 pb-2 inline-block text-indigo-200">{t.footerContact}</h3>
            <ul className="space-y-4">
              <li className="flex items-start group">
                <div className="h-8 w-8 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-md group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-300 hover:text-white transition-colors duration-300 group-hover:translate-x-1">kararweb3iletisim@outlook.com</span>
              </li>
              <li className="flex items-start group">
                <div className="h-8 w-8 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-md group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </div>
                <span className="text-gray-300 group-hover:translate-x-1 transition-transform duration-300">Twitter: {t.comingSoon}</span>
              </li>
              <li className="flex items-start group">
                <div className="h-8 w-8 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-md group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span className="text-gray-300 group-hover:translate-x-1 transition-transform duration-300">Instagram: {t.comingSoon}</span>
              </li>
            </ul>
            
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-indigo-200 mb-3">{t.newsletter}</h4>
              <div className="flex flex-col sm:flex-row">
                <input 
                  type="email" 
                  placeholder={t.emailAddress} 
                  className="bg-indigo-900/50 text-white px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:rounded-r-none border border-indigo-800"
                />
                <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-3 text-sm font-medium rounded-lg mt-2 sm:mt-0 sm:rounded-l-none transition-all duration-300 transform hover:translate-x-1 hover:shadow-lg">
                  {t.subscribe}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-indigo-800/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Karar Web3. {t.allRightsReserved}
          </p>
          <div className="mt-4 md:mt-0 flex flex-wrap justify-center gap-4">
            <Link to="/kullanim-kosullari" className="text-gray-400 hover:text-indigo-300 text-sm transition-colors duration-300">
              {t.termsOfService}
            </Link>
            <Link to="/gizlilik-politikasi" className="text-gray-400 hover:text-indigo-300 text-sm transition-colors duration-300">
              {t.privacyPolicy}
            </Link>
            <Link to="/cerez-politikasi" className="text-gray-400 hover:text-indigo-300 text-sm transition-colors duration-300">
              {t.cookiePolicy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 