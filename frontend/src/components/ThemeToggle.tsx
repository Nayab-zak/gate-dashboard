'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        bg-theme-card/20 hover:bg-theme-card/40
        border border-theme-border
        transition-all duration-300 ease-in-out
        group
      "
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Sun Icon (Light Mode) */}
      <svg
        className={`
          absolute w-5 h-5 text-theme-text
          transition-all duration-300 ease-in-out
          ${theme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-180 scale-75'
          }
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Moon Icon (Dark Mode) */}
      <svg
        className={`
          absolute w-5 h-5 text-theme-text
          transition-all duration-300 ease-in-out
          ${theme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-180 scale-75'
          }
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>

      {/* Ripple effect on click */}
      <span 
        className="
          absolute inset-0 rounded-full
          bg-theme-accent/20
          scale-0 group-active:scale-100
          transition-transform duration-200 ease-out
        "
      />
    </button>
  );
}
