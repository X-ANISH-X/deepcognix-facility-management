import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useLanguage } from '@/app/context/LanguageContext';
import { useTheme } from '@/app/context/ThemeContext';
import { Globe, Moon, Sun } from 'lucide-react';

export function SettingsView() {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col justify-start">
        <h1 className="text-3xl font-bold tracking-tight">{t('Settings')}</h1>
        <p className="text-gray-500 mt-1">{t('Manage your preferences and settings')}</p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Language Settings */}
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              {t('Language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  {language === 'en' ? 'English' : 'العربية'}
                </span>
                <button
                  onClick={toggleLanguage}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white rounded-2xl hover:shadow-lg transition-all hover:scale-105"
                >
                  {language === 'en' ? 'Switch to عربي' : 'Switch to English'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
              {t('Theme')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  {theme === 'light' ? t('Light Mode') : t('Dark Mode')}
                </span>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white rounded-2xl hover:shadow-lg transition-all hover:scale-105"
                >
                  Toggle
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
