'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Instead of throwing error, return a default context
    console.warn('useTheme called outside of ThemeProvider, using default theme');
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {},
      setTheme: () => {}
    };
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark mode
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Apply CSS custom properties based on theme
    if (theme === 'light') {
      // Light Mode Colors - Background dark (navy gradient), cards light (white)
      root.style.setProperty('--theme-bg', 'linear-gradient(135deg, #0A1B2A 0%, #002F6C 100%)');
      root.style.setProperty('--theme-bg-secondary', '#0A1B2A');
      root.style.setProperty('--theme-card', '#FFFFFF'); // White cards
      root.style.setProperty('--theme-card-kpi', '#FFFFFF'); // White KPI cards
      root.style.setProperty('--theme-text', '#FFFFFF'); // White text for headers on dark background
      root.style.setProperty('--theme-text-secondary', '#B3B3B3'); // Silver for secondary text on dark background
      root.style.setProperty('--theme-text-accent', '#002F6C'); // Dark navy text on white cards
      root.style.setProperty('--theme-card-text', '#002F6C'); // Dark navy for card titles & numbers
      root.style.setProperty('--theme-card-text-secondary', '#4A4A4A'); // Medium-dark gray for card labels
      root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.1)'); // Light borders on dark background
      root.style.setProperty('--theme-accent', '#0B4FA7'); // Blue accents
      root.style.setProperty('--theme-success', '#00A859'); // Green indicators
      root.style.setProperty('--theme-warning', '#F59E0B'); // Amber warnings
      root.style.setProperty('--theme-danger', '#ED1C24'); // Red alerts
      root.style.setProperty('--theme-silver', '#B3B3B3'); // Silver for gridlines
      root.style.setProperty('--theme-header-gradient', 'linear-gradient(135deg, #3C2E8F 0%, #2B2C7A 50%, #002F6C 100%)');
    } else {
      // Dark Mode Colors - Background light (white), cards dark (dark navy)
      root.style.setProperty('--theme-bg', '#FFFFFF'); // Pure white background
      root.style.setProperty('--theme-bg-secondary', '#FFFFFF'); // Pure white secondary background
      root.style.setProperty('--theme-card', '#0E2F51'); // Dark navy cards
      root.style.setProperty('--theme-card-kpi', '#0E2F51'); // Dark navy KPI cards
      root.style.setProperty('--theme-text', '#002F6C'); // Dark navy text for headers on white background
      root.style.setProperty('--theme-text-secondary', '#4A4A4A'); // Medium-dark gray for secondary text on white background
      root.style.setProperty('--theme-text-accent', '#FFFFFF'); // White text on dark cards
      root.style.setProperty('--theme-card-text', '#FFFFFF'); // White for card titles & numbers
      root.style.setProperty('--theme-card-text-secondary', '#B3B3B3'); // Silver for card labels (use #D0D0D0 if more contrast needed)
      root.style.setProperty('--theme-border', 'rgba(0, 47, 108, 0.1)'); // Dark navy borders on white background
      root.style.setProperty('--theme-accent', '#0B4FA7'); // Blue accents
      root.style.setProperty('--theme-success', '#00A859'); // Green indicators
      root.style.setProperty('--theme-warning', '#F59E0B'); // Amber warnings
      root.style.setProperty('--theme-danger', '#ED1C24'); // Red alerts
      root.style.setProperty('--theme-silver', '#B3B3B3'); // Silver for gridlines
      root.style.setProperty('--theme-header-gradient', 'linear-gradient(135deg, #3C2E8F 0%, #2B2C7A 50%, #002F6C 100%)');
    }
    
    // Save to localStorage
    localStorage.setItem('dashboard-theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
