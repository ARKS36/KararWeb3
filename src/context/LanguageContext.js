import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // localStorage'dan dil tercihini al, yoksa varsayılan olarak Türkçe kullan
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'tr';
  });

  useEffect(() => {
    // Dil değiştiğinde localStorage'a kaydet
    localStorage.setItem('language', language);
    // HTML lang özniteliğini de güncelle
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'tr' ? 'en' : 'tr');
  };

  const value = {
    language,
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
} 