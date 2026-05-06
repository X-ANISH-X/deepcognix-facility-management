import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useTheme } from '@/app/context/ThemeContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { Moon, Sun, Lightbulb, Globe } from 'lucide-react';
import { api as mockApi, type PreviousCustomer } from '@/app/services/api';
import { toast } from 'sonner';

export function SettingsView() {
  const { theme, toggleTheme, brightness, setBrightness } = useTheme();
  const { language, t, setLanguage } = useLanguage();
  const [customers, setCustomers] = useState<PreviousCustomer[]>([]);
  const [targetCustomerId, setTargetCustomerId] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await mockApi.getPreviousCustomers();
        setCustomers(data);
      } catch {
        setCustomers([]);
      }
    };
    void loadCustomers();
  }, []);

  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast.error('Notification message is required');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        customerIds: targetCustomerId === 'all' ? undefined : [targetCustomerId],
      };
      const result = await mockApi.sendCustomerNotification(payload);
      toast.success(`Notification sent to ${result.sentCount} customer(s)`);
      setTitle('');
      setMessage('');
      setTargetCustomerId('all');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-start">
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Theme Settings */}
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
              {t('settings.theme')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  {theme === 'light' ? t('settings.lightMode') : t('settings.darkMode')}
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

        {/* Brightness Settings */}
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              {t('settings.brightness')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setBrightness(level)}
                    className={`flex-1 py-2 rounded-2xl font-semibold transition-all ${
                      brightness === level
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t(`settings.${level}`)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="rounded-3xl border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 rounded-2xl font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('settings.english')}
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`flex-1 py-2 rounded-2xl font-semibold transition-all ${
                    language === 'ar'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('settings.arabic')}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-lg">
        <CardHeader>
          <CardTitle>Send Customer Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Recipient</p>
            <Select value={targetCustomerId} onValueChange={setTargetCustomerId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.fullName || customer.email} ({customer.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Title (optional)</p>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Admin update"
              className="rounded-xl"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Message</p>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a customer notification"
              rows={4}
              className="rounded-xl"
            />
          </div>

          <Button onClick={handleSendNotification} disabled={isSending} className="rounded-xl">
            {isSending ? 'Sending...' : 'Send Notification'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
