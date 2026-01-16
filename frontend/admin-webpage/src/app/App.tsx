import { useState } from 'react';
import { ThemeProvider, useTheme } from '@/app/context/ThemeContext';
import { LoginPage } from '@/app/components/LoginPage';
import { DashboardView } from '@/app/components/DashboardView';
import { TechnicianMapView } from '@/app/components/TechnicianMapView';
import { WorkOrdersView } from '@/app/components/WorkOrdersView';
import { ServicesView } from '@/app/components/ServicesView';
import { ReportsView } from '@/app/components/ReportsView';
import { LayoutDashboard, Map, ClipboardList, Settings, FileText, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { Toaster } from '@/app/components/ui/sonner';

type View = 'dashboard' | 'map' | 'orders' | 'services' | 'reports';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map' as View, label: 'Technician Tracking', icon: Map },
    { id: 'orders' as View, label: 'Work Orders', icon: ClipboardList },
    { id: 'services' as View, label: 'Services & Pricing', icon: Settings },
    { id: 'reports' as View, label: 'Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      {/* Show login page if not authenticated */}
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <>
          <Toaster position="top-right" />
      
      {/* Glassmorphism Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-screen bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl transition-all duration-300 z-50 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo & Brand */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  DeepCognix
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mission Control</p>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 rounded-xl"></div>
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
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white shadow-lg shadow-teal-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-4 mt-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium">Dark Mode</span>}
              </>
            ) : (
              <>
                <Sun className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium">Light Mode</span>}
              </>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                AD
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">admin@facility.com</p>
              </div>
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                AD
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
                  {navItems.find(item => item.id === currentView)?.label}
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
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'map' && <TechnicianMapView />}
          {currentView === 'orders' && <WorkOrdersView />}
          {currentView === 'services' && <ServicesView />}
          {currentView === 'reports' && <ReportsView />}
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
      <AppContent />
    </ThemeProvider>
  );
}
