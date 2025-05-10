import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const HomeHeader = () => {
  const { language } = useLanguage();
  const t = translations[language];
  
  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-10 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <span className="text-white">
                {language === 'tr' ? 'KararWeb3: Tüm ' : 'KararWeb3: The '}
              </span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
                  {language === 'tr' ? 'Türkiye\'nin' : 'First and Only'}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-amber-300 to-yellow-300 opacity-30 blur-sm transform scale-110 z-0"></span>
              </span>
              <span className="text-white">
                {language === 'tr' ? ' İlk ve Tek Ortak ' : ' Joint '}
              </span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  {language === 'tr' ? 'Boykot' : 'Boycott'}
                </span>
                <span className="absolute inset-0 bg-blue-400 opacity-20 blur-sm transform scale-110 z-0"></span>
              </span>
              <span className="text-white">&</span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-500">
                  {language === 'tr' ? 'Protesto' : 'Protest'}
                </span>
                <span className="absolute inset-0 bg-red-500 opacity-20 blur-sm transform scale-110 z-0"></span>
              </span>
              <span className="text-white">
                {language === 'tr' ? ' Platformu' : ' Platform in Turkey'}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-xl mb-4">
              {language === 'tr' 
                ? 'Güncel protestolara katıl ve etkili boykotlarla destek ol. Veriler herkese karşı gizlidir, ' 
                : 'Join current protests and support with effective boycotts. Data is private from everyone, participate '}
              <span className="relative inline-block mx-1">
                <span className="relative z-10 font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                  {language === 'tr' ? 'Tam Anonim' : 'Completely Anonymous'}
                </span>
                <span className="absolute inset-0 bg-purple-500 opacity-20 blur-sm transform scale-110 z-0"></span>
              </span>
              {language === 'tr' ? 'olarak katılın.' : '.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <Link 
                to="/protestolar" 
                className="bg-white text-blue-800 hover:bg-blue-100 transition-colors duration-300 font-medium rounded-lg px-6 py-3 shadow-md"
              >
                {t.allProtests}
              </Link>
              <Link 
                to="/boykotlar" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-800 transition-colors duration-300 font-medium rounded-lg px-6 py-3"
              >
                {t.exploreBoycotts}
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center md:justify-end">
            <div className="bg-white p-6 rounded-full shadow-lg w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 md:h-40 md:w-40 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHeader; 