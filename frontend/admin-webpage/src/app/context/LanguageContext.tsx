import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (text: string): string => {
    // Simple mapping for hardcoded translations
    const translations: { [key: string]: string } = {
      // Dashboard
      'Mission Control': 'مركز القيادة',
      'Real-time facility management overview': 'نظرة عامة على إدارة المرافق في الوقت الفعلي',
      'Active Work Orders': 'طلبات العمل النشطة',
      'Weekly Revenue': 'إيرادات الأسبوع',
      'Avg Completion Rate': 'متوسط معدل الإنجاز',
      'Total Technicians': 'إجمالي الفنيين',
      'Completed Today': 'المكتملة اليوم',
      'Revenue Overview': 'نظرة عامة على الإيرادات',
      'Service Distribution': 'توزيع الخدمات',
      'Recent Work Orders': 'طلبات العمل الأخيرة',
      'Weekly Performance': 'الأداء الأسبوعي',
      'Daily': 'يومي',
      'Weekly': 'أسبوعي',
      'Monthly': 'شهري',
      'Yearly': 'سنوي',

      // Settings
      'Settings': 'الإعدادات',
      'Manage your preferences and settings': 'إدارة تفضيلاتك والإعدادات',
      'Language': 'اللغة',
      'English': 'English',
      'Theme': 'المظهر',
      'Dark Mode': 'الوضع الليلي',
      'Light Mode': 'الوضع الفاتح',
      'Switch to العربية': 'التبديل إلى English',
      'Switch to English': 'التبديل إلى العربية',

      // Navigation
      'Dashboard': 'لوحة التحكم',
      'Technician Tracking': 'تتبع الفنيين',
      'Work Orders': 'طلبات العمل',
      'Services & Pricing': 'الخدمات والتسعير',
      'Reports': 'التقارير',
      'Loading dashboard...': 'جاري تحميل لوحة المعلومات...',
      'System Online': 'النظام متصل',
    };

    if (language === 'en') {
      return text;
    }

    return translations[text] || text;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
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
