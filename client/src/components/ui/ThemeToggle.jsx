/**
 * ===========================================
 * Theme Toggle Component
 * ===========================================
 * 
 * A toggle button for switching between light and dark modes.
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-lg 
        bg-muted hover:bg-accent transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
        focus:ring-offset-background ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className={`h-5 w-5 transition-all duration-300 ${
        theme === 'dark' 
          ? 'rotate-0 scale-100 text-foreground' 
          : 'rotate-90 scale-0 absolute'
      }`} />
      <Moon className={`h-5 w-5 transition-all duration-300 ${
        theme === 'light' 
          ? 'rotate-0 scale-100 text-foreground' 
          : '-rotate-90 scale-0 absolute'
      }`} />
    </button>
  );
}

export default ThemeToggle;
