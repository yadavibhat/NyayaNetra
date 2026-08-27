import React, { createContext, useContext, useState, useEffect } from 'react';
import { strings } from '../i18n/strings';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('nyayanetra_language') || 'en';
  });

  const setLanguage = (lang) => {
    const validLang = lang === 'kn' ? 'kn' : 'en';
    setLanguageState(validLang);
    localStorage.setItem('nyayanetra_language', validLang);
  };

  const t = (key, fallback) => {
    const langDict = strings[language] || strings.en;
    return langDict[key] || strings.en[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, strings: strings[language] || strings.en }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if not wrapped in provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, fallback) => strings.en[key] || fallback || key,
      strings: strings.en
    };
  }
  return context;
}
