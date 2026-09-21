// Language Context for Multilingual Support (English, Hindi, Odia)
// KRISHIFLOW-AI - Smart India Hackathon 2026

import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'hi' | 'or';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (lang: Language) => void;
  languageNames: Record<Language, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const languageNames: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  or: 'ଓଡ଼ିଆ (Odia)',
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    (localStorage.getItem('krishiflow_lang') as Language) || 'en'
  );

  const changeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('krishiflow_lang', lang);
    setCurrentLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
