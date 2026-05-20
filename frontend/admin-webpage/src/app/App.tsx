import { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from '@/app/context/ThemeContext';
import { LanguageProvider } from '@/app/context/LanguageContext';
import { LoginPage } from '@/app/components/LoginPage';
import { DashboardView } from '@/app/components/DashboardView';
import TechnicianTrackingMap from '@/app/TechnicianTrackingMap';
import { TechnicianManagement } from '@/app/components/TechnicianManagement';
import { WorkOrdersView } from '@/app/components/WorkOrdersView';
import { ServicesView } from '@/app/components/ServicesView';
import { ServicePackagesView } from '@/app/components/ServicePackagesView';
import { ReportsView } from '@/app/components/ReportsView';
import { SettingsView } from '@/app/components/SettingsView';
import { LayoutDashboard, Map, ClipboardList, Settings, FileText, LogOut, Menu, X, Sun, Moon, Package2, Bell, Users } from 'lucide-react';
import { Toaster } from '@/app/components/ui/sonner';
import { toast } from 'sonner';
import { canAccessView, canManageDispatch, type AuthUser, type UserRole } from '@/app/utils/accessControl';
import { api as mockApi, type NotificationItem } from '@/app/services/api';

type View = 'dashboard' | 'map' | 'technicians' | 'orders' | 'services' | 'service-packages' | 'reports' | 'settings';

type NavigateEventDetail = {
  view: View;
  focusOrderId?: string;
};

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [focusOrderId, setFocusOrderId] = useState<string | undefined>();
  const { theme, toggleTheme } = useTheme();

  const role: UserRole = currentUser?.role ?? 'customer';
  const allowedNavItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map' as View, label: 'Technician Tracking', icon: Map },
    { id: 'technicians' as View, label: 'Technician Registry', icon: Users },
    { id: 'orders' as View, label: 'Work Orders', icon: ClipboardList },
    { id: 'services' as View, label: 'Services & Pricing', icon: Settings },
    { id: 'service-packages' as View, label: 'Service Packages', icon: Package2 },
    { id: 'reports' as View, label: 'Reports', icon: FileText },
  ].filter(item => canAccessView(role, item.id));

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('backend_access_token');
    localStorage.removeItem('admin_refresh_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    setNotifications([]);
    setUnreadCount(0);
    setIsNotificationOpen(false);
  };

  const loadNotifications = async (silent = true) => {
    try {
      const [list, count] = await Promise.all([
        mockApi.getNotifications(),
        mockApi.getUnreadNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      if (!silent) {
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      handleLogout();
    };

    window.addEventListener('admin:session-expired', handleSessionExpired as EventListener);
    return () => {
      window.removeEventListener('admin:session-expired', handleSessionExpired as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void loadNotifications(false);
    const timer = window.setInterval(() => {
      void loadNotifications(true);
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<NavigateEventDetail>;
      const targetView = customEvent.detail?.view;

      if (!targetView) {
        return;
      }

      setCurrentView(targetView);

      if (customEvent.detail?.focusOrderId) {
        setFocusOrderId(customEvent.detail.focusOrderId);
      }
    };

    window.addEventListener('admin:navigate', handleNavigate as EventListener);

    return () => {
      window.removeEventListener('admin:navigate', handleNavigate as EventListener);
    };
  }, []);

  const handleMarkAllNotifications = async () => {
    await mockApi.markAllNotificationsAsRead();
    await loadNotifications(true);
  };

  const extractBookingId = (message: string): number | null => {
    const match = message.match(/booking\s*#\s*(\d+)/i);
    if (!match) {
      return null;
    }
    const parsed = Number(match[1]);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const isApprovalNotification = (notification: NotificationItem): boolean => {
    const normalizedType = notification.type.toLowerCase();
    return normalizedType === 'admin_review_pending' || normalizedType === 'completion_requested';
  };

  const handleQuickApproveFromNotification = async (notification: NotificationItem) => {
    const bookingId = extractBookingId(notification.message);
    if (!bookingId) {
      toast.error('Could not find booking ID in this notification.');
      return;
    }

    try {
      const workOrder = await mockApi.getWorkOrderById(String(bookingId));
      if (!workOrder) {
        toast.error(`Booking #${bookingId} could not be found.`);
        return;
      }

      const displayStatus = workOrder.status === 'admin_review_pending'
        ? 'completion requested'
        : workOrder.status.replace(/-/g, ' ');

      if (workOrder.status !== 'admin_review_pending') {
        await loadNotifications(true);
        setCurrentView('orders');
        setIsNotificationOpen(false);
        toast.info(`Booking #${bookingId} is already ${displayStatus}.`);
        return;
      }

      await mockApi.approveWorkOrderCompletion(String(bookingId));
      if (!notification.isRead) {
        await mockApi.markNotificationAsRead(notification.id);
      }
      await loadNotifications(true);
      setCurrentView('orders');
      setIsNotificationOpen(false);
      toast.success(`Approved booking #${bookingId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to approve this booking.';
      toast.error(message);
    }
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await mockApi.markNotificationAsRead(notification.id);
      await loadNotifications(true);
    }

    if (extractBookingId(notification.message)) {
      setCurrentView('orders');
      setIsNotificationOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {!isAuthenticated ? (
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthenticated(true);
            setCurrentView('dashboard');
          }}
        />
      ) : (
        <>
          <Toaster position="top-right" />

      {/* Glassmorphism Sidebar */}
      <aside 
        className={`fixed top-0 left-0 flex h-screen flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl transition-all duration-300 z-50 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo & Brand */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <div>
                <h1 className="text-2xl font-bold bg-linear-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  DeepCognix
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mission Control</p>
              </div>
            ) : (
              <div className="w-8 h-8 bg-linear-to-br from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 rounded-xl"></div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-linear-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white shadow-lg shadow-teal-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-4 mt-4 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="font-medium">Dark Mode</span>}
              </>
            ) : (
              <>
                <Sun className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="font-medium">Light Mode</span>}
              </>
            )}
          </button>
          
          {/* Settings Button */}
          {canAccessView(role, 'settings') && (
            <button
              onClick={() => setCurrentView('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                currentView === 'settings'
                  ? 'bg-linear-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white shadow-lg shadow-teal-500/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium">Settings</span>}
            </button>
          )}
        </div>

        {/* User Profile */}
        <div className="mt-auto p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50">
              <div className="w-10 h-10 bg-linear-to-br from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{currentUser?.name ?? 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email ?? ''}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-linear-to-br from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Bar - Glassmorphism */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentView === 'settings' ? 'Settings' : allowedNavItems.find(item => item.id === currentView)?.label}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen((current) => !current)}
                    className="relative p-2 rounded-xl border border-gray-200/70 bg-white/70 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-slate-800/70 dark:text-gray-200 dark:hover:bg-slate-700"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-90 max-h-115 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-slate-900 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        <button
                          onClick={() => void handleMarkAllNotifications()}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Mark all read
                        </button>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No notifications yet.</div>
                      ) : (
                        notifications.slice(0, 12).map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${notification.isRead ? 'opacity-80' : 'bg-blue-50/60 dark:bg-blue-950/20'}`}
                          >
                            <button
                              onClick={() => void handleOpenNotification(notification)}
                              className="w-full text-left hover:bg-transparent"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-gray-800 dark:text-gray-100">{notification.message}</p>
                                {!notification.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></span>}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                            </button>

                            {isApprovalNotification(notification) && extractBookingId(notification.message) && (
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => void handleQuickApproveFromNotification(notification)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  Approve Now
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 rounded-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">System Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="p-8">
          {!canAccessView(role, currentView) && <DashboardView role={role} />}
          {currentView === 'dashboard' && <DashboardView role={role} />}
          {currentView === 'map' && canAccessView(role, 'map') && <TechnicianTrackingMap />}
          {currentView === 'technicians' && canAccessView(role, 'technicians') && <TechnicianManagement />}
          {currentView === 'orders' && canAccessView(role, 'orders') && <WorkOrdersView canManage={canManageDispatch(role)} role={role} focusOrderId={focusOrderId} />}
          {currentView === 'services' && canAccessView(role, 'services') && <ServicesView />}
          {currentView === 'service-packages' && canAccessView(role, 'service-packages') && <ServicePackagesView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'settings' && canAccessView(role, 'settings') && <SettingsView />}
        </div>
      </main>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
