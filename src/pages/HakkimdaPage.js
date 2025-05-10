import React from 'react';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const HakkimdaPage = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t.aboutUs}</h1>
          
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t.ourVision}</h2>
            <p className="text-gray-600 mb-6">
              {t.visionText}
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t.ourMission}</h2>
            <p className="text-gray-600 mb-6">
              {t.missionText}
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t.ourValues}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start group hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-tr from-blue-500 to-blue-700 rounded-full flex items-center justify-center mt-1 shadow-md group-hover:shadow-lg group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{t.transparency}</h3>
                  <p className="mt-2 text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{t.transparencyText}</p>
                </div>
              </div>
              
              <div className="flex items-start group hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-tr from-blue-500 to-blue-700 rounded-full flex items-center justify-center mt-1 shadow-md group-hover:shadow-lg group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{t.participation}</h3>
                  <p className="mt-2 text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{t.participationText}</p>
                </div>
              </div>
              
              <div className="flex items-start group hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-tr from-blue-500 to-blue-700 rounded-full flex items-center justify-center mt-1 shadow-md group-hover:shadow-lg group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{t.security}</h3>
                  <p className="mt-2 text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{t.securityText}</p>
                </div>
              </div>
              
              <div className="flex items-start group hover:bg-blue-50 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-tr from-blue-500 to-blue-700 rounded-full flex items-center justify-center mt-1 shadow-md group-hover:shadow-lg group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{t.neutrality}</h3>
                  <p className="mt-2 text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{t.neutralityText}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t.contact}</h2>
            <p className="text-gray-600 mb-6">
              {t.contactText}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start bg-gradient-to-r from-white to-blue-50 p-5 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-300 group hover:border-blue-300">
                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-blue-200 group-hover:shadow-md transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-800 transition-colors duration-300">{t.email}</h3>
                  <p className="mt-2 text-gray-600 group-hover:text-blue-600 transition-colors duration-300">kararweb3iletisim@outlook.com</p>
                </div>
              </div>
              
              <div className="flex items-start bg-gradient-to-r from-white to-blue-50 p-5 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-300 group hover:border-blue-300">
                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-blue-200 group-hover:shadow-md transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-800 transition-colors duration-300">{t.twitter}</h3>
                  <p className="mt-2 text-gray-600 group-hover:text-blue-600 transition-colors duration-300">{t.comingSoon}</p>
                </div>
              </div>
              
              <div className="flex items-start bg-gradient-to-r from-white to-blue-50 p-5 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-300 group hover:border-blue-300">
                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-blue-200 group-hover:shadow-md transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-800 transition-colors duration-300">{t.instagram}</h3>
                  <p className="mt-2 text-gray-600 group-hover:text-blue-600 transition-colors duration-300">{t.comingSoon}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HakkimdaPage; 