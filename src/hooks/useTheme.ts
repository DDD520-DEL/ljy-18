import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      return savedMode;
    }
    return 'system';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode === 'light') return false;
    if (savedMode === 'dark') return true;
    return getSystemTheme() === 'dark';
  });

  useEffect(() => {
    const updateTheme = () => {
      let actualTheme: 'light' | 'dark';
      if (themeMode === 'system') {
        actualTheme = getSystemTheme();
      } else {
        actualTheme = themeMode;
      }
      applyTheme(actualTheme);
      setIsDark(actualTheme === 'dark');
    };

    updateTheme();
    localStorage.setItem('theme-mode', themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  return {
    themeMode,
    isDark,
    toggleTheme,
    setTheme,
  };
}
