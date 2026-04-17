import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/app/utils/translations';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguageState(savedLanguage);
      applyLanguageSettings(savedLanguage);
    }
  }, []);

  const applyLanguageSettings = (lang: Language) => {
    // Set text direction for RTL languages
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  };

  const t = (key: string): string => {
    const langTranslations = translations[language];
    return langTranslations?.[key as keyof typeof langTranslations] || key;
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    applyLanguageSettings(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      t,
      setLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
