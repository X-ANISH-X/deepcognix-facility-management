import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { getDisplayNameFromEmail, type AuthUser } from '@/app/utils/accessControl';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const API_BASE =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8000';
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        const detail = payload?.detail;
        const detailMessage = Array.isArray(detail)
          ? detail.map((entry) => entry?.msg || String(entry)).join('; ')
          : typeof detail === 'string'
            ? detail
            : detail
              ? JSON.stringify(detail)
              : null;
        throw new Error(detailMessage || payload?.error || 'Login failed');
      }

      localStorage.setItem('admin_token', payload.access_token);
      localStorage.setItem('backend_access_token', payload.access_token);
      localStorage.setItem('admin_user', JSON.stringify({
        id: payload.user_id,
        full_name: payload.full_name || getDisplayNameFromEmail(normalizedEmail),
        email: normalizedEmail,
        role: payload.role,
      }));

      const user: AuthUser = {
        email: normalizedEmail,
        name: payload.full_name || getDisplayNameFromEmail(normalizedEmail),
        role: payload.role === 'admin' ? 'admin' : payload.role === 'technician' ? 'technician' : 'customer',
      };

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', normalizedEmail);
      }

      onLoginSuccess(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-600 via-emerald-500 to-cyan-600 dark:from-teal-900 dark:via-emerald-900 dark:to-cyan-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative paint-like background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 dark:bg-teal-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-300 dark:bg-emerald-700 rounded-full mix-blend-multiply filter blur-3xl opacity-45 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-200 dark:bg-cyan-700 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-300 dark:bg-teal-800 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-6000"></div>

      {/* Header with Theme Toggle - Using Flexbox */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-8 z-20">
        {/* Spacer for centering */}
        <div className="flex-1"></div>
        
        {/* Theme toggle button */}
        <button 
          onClick={toggleTheme}
          className="bg-white/20 dark:bg-black/20 backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 w-12 h-12 rounded-xl transition-all duration-300 flex items-center justify-center overflow-hidden border border-white/20"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            {/* Sun Icon */}
            <svg 
              className={`w-6 h-6 text-yellow-300 absolute transition-all duration-500 ease-in-out ${
                theme === 'light' 
                  ? 'opacity-100 translate-x-0 translate-y-0 scale-100' 
                  : 'opacity-0 translate-x-6 translate-y-6 scale-0'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>

            {/* Moon Icon */}
            <svg 
              className={`w-6 h-6 text-slate-100 absolute transition-all duration-500 ease-in-out ${
                theme === 'dark' 
                  ? 'opacity-100 translate-x-0 translate-y-0 scale-100' 
                  : 'opacity-0 -translate-x-6 -translate-y-6 scale-0'
              }`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              <circle cx="12" cy="15" r="1" fill="black" fillOpacity="0.2" />
              <circle cx="16" cy="13" r="0.5" fill="black" fillOpacity="0.2" />
            </svg>
          </div>
        </button>
      </div>

      {/* Login Card Container - Using Flexbox */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        <div className="bg-white/15 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 md:p-10 w-full">
          {/* Header - Flexbox Column Layout */}
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-white/80 dark:text-white/70">Sign in to your account</p>
          </div>

          {/* Login Form - Flexbox Column Layout */}
          <form onSubmit={handleLogin} className="flex flex-col space-y-4">
            {/* Email Input Container */}
            <div className="flex flex-col">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 dark:bg-white/1 border border-white/15 dark:border-white/15 rounded-xl text-white placeholder-white/60 dark:placeholder-white/50 focus:outline-none focus:border-white/70 dark:focus:border-white/30 focus:bg-white/35 dark:focus:bg-white/15 transition-all backdrop-blur-sm"
              />
            </div>

            {/* Password Input Container */}
            <div className="flex flex-col relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 dark:bg-white/1 border border-white/15 dark:border-white/15 rounded-xl text-white placeholder-white/60 dark:placeholder-white/50 focus:outline-none focus:border-white/70 dark:focus:border-white/30 focus:bg-white/35 dark:focus:bg-white/15 transition-all backdrop-blur-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 dark:text-white/70 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/20 dark:bg-white/40 border border-white/20 dark:border-white/20 checked:bg-cyan-200 checked:border-cyan-400 accent-white-400 cursor-pointer"
                />
                <span className="text-white/80 dark:text-white/70">Remember me</span>
              </label>
              <a href="#" className="text-cyan-300 dark:text-cyan-200 hover:text-cyan-200 dark:hover:text-cyan-100 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 bg-linear-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-500 dark:hover:to-cyan-500 disabled:from-gray-400 disabled:to-gray-500 rounded-xl font-semibold text-white dark:text-slate-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

            {/* Divider - Flexbox implementation for split lines */}
            <div className="relative my-6 flex items-center">
            {/* Left Line Segment */}
            <div className="grow border-t border-white/20 dark:border-white/10"></div>
            
            {/* Text with precise 2px horizontal margin */}
            <span className="shrink mx-1 text-sm text-white/80 dark:text-white/70 whitespace-nowrap">
                or continue with
            </span>
            
            {/* Right Line Segment */}
            <div className="grow border-t border-white/20 dark:border-white/10"></div>
            </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 dark:bg-white/10 border border-white/15 dark:border-white/15 rounded-xl text-white hover:bg-white/30 dark:hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 dark:bg-white/10 border border-white/15 dark:border-white/15 rounded-xl text-white hover:bg-white/30 dark:hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="hidden sm:inline text-sm font-medium">GitHub</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <span className="text-white/80 dark:text-white/70">Don't have an account? </span>
            <a href="#" className="text-cyan-300 dark:text-cyan-200 hover:text-cyan-200 dark:hover:text-cyan-100 font-semibold transition-colors">
              Sign up
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }

        /* Smooth theme toggle transitions */
        svg {
          will-change: opacity, transform;
        }
      `}</style>
    </div>
  );
}
