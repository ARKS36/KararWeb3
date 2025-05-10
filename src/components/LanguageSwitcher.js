import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const LanguageSwitcher = ({ mode = 'floating' }) => {
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];
  
  const getCurrentLanguageInfo = () => {
    return {
      tr: {
        flag: '🇹🇷',
        code: 'TR',
        fullName: 'Türkçe',
        nextFlag: '🇬🇧',
        nextCode: 'EN',
        nextFullName: 'English',
      },
      en: {
        flag: '🇬🇧',
        code: 'EN',
        fullName: 'English',
        nextFlag: '🇹🇷',
        nextCode: 'TR',
        nextFullName: 'Türkçe',
      }
    }[language];
  };

  const langInfo = getCurrentLanguageInfo();
  
  if (mode === 'floating') {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={toggleLanguage}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
          aria-label={`Switch to ${langInfo.nextFullName}`}
        >
          <span className="mr-2 text-lg">{langInfo.flag}</span>
          <span className="font-medium">{langInfo.fullName}</span>
        </button>
      </div>
    );
  }
  
  if (mode === 'navbar') {
    return (
      <button
        onClick={toggleLanguage}
        className="flex items-center text-indigo-100 hover:text-white hover:bg-indigo-700/30 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-300"
        aria-label={`Switch to ${langInfo.nextFullName}`}
      >
        <span className="mr-2 text-lg">{langInfo.flag}</span>
        {langInfo.code}
      </button>
    );
  }
  
  // Default inline mode
  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm"
      aria-label={`Switch to ${langInfo.nextFullName}`}
    >
      <span className="mr-2 text-lg">{langInfo.flag}</span>
      <span>{langInfo.code}</span>
    </button>
  );
};

export default LanguageSwitcher; 