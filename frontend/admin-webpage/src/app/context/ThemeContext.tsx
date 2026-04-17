import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Brightness = 'low' | 'medium' | 'high';

interface ThemeContextType {
  theme: Theme;
  brightness: Brightness;
  toggleTheme: () => void;
  setBrightness: (brightness: Brightness) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const BRIGHTNESS_VALUES = {
  low: 0.8,
  medium: 1,
  high: 1.2
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [brightness, setBrightnessState] = useState<Brightness>('medium');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedBrightness = localStorage.getItem('brightness') as Brightness;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    
    if (savedBrightness) {
      setBrightnessState(savedBrightness);
      applyBrightness(savedBrightness);
    }
  }, []);

  const applyBrightness = (brightnessLevel: Brightness) => {
    const value = BRIGHTNESS_VALUES[brightnessLevel];
    document.documentElement.style.setProperty('--brightness', value.toString());
    // Apply filter to all elements for visual brightness adjustment
    document.documentElement.style.filter = `brightness(${value})`;
  };

  const toggleTheme = () => {
    setIsTransitioning(true);
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Add transition class
    document.documentElement.classList.add('theme-transition');
    
    // Toggle dark class
    setTimeout(() => {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }, 50);
    
    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
      setIsTransitioning(false);
    }, 800);
  };

  const setBrightness = (newBrightness: Brightness) => {
    setBrightnessState(newBrightness);
    localStorage.setItem('brightness', newBrightness);
    applyBrightness(newBrightness);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, brightness, setBrightness }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
