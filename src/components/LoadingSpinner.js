import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

function LoadingSpinner() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t.loading}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner; 