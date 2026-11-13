import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' || 'dark';
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('crm_theme', next);
    } catch {}
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      className={`btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 ${className}`}
      aria-label="Toggle visual theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5 text-tx-muted" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-tx-muted" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
};
