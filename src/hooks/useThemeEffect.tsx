import { useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';

export function useThemeEffect() {
  const { preferences, loading } = useUserPreferences();

  useEffect(() => {
    if (loading) return;

    const root = window.document.documentElement;

    const resolveTheme = () => {
      if (preferences.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      return preferences.theme;
    };

    const applyTheme = (theme: string) => {
      root.style.transition = 'background-color 0.6s ease, color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease';

      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }

      setTimeout(() => {
        root.style.transition = '';
      }, 600);
    };

    applyTheme(resolveTheme());

    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        applyTheme(newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

  }, [preferences.theme, loading]);
}