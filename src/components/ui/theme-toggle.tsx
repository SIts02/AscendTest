
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useThemeEffect } from "@/hooks/useThemeEffect";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { preferences, savePreferences, loading } = useUserPreferences();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useThemeEffect();
  
  // Update the mounted state once the component is mounted
  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  // Update the isDark state when the preferences change
  useEffect(() => {
    if (!loading && mounted) {
      if (preferences.theme === 'dark') {
        setIsDark(true);
      } else if (preferences.theme === 'light') {
        setIsDark(false);
      } else if (preferences.theme === 'system') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
      }
    }
  }, [preferences.theme, loading, mounted]);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    if (loading) return;
    savePreferences({ ...preferences, theme });
  };

  // Don't render anything until the component is mounted to avoid hydration mismatch
  if (!mounted) return null;

  // The current icon to show based on theme
  const getCurrentIcon = () => {
    if (preferences.theme === 'system') return <Monitor size={18} />;
    return isDark ? <Moon size={18} /> : <Sun size={18} />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Selecionar tema"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={preferences.theme}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute"
            >
              {getCurrentIcon()}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn("cursor-pointer", preferences.theme === 'light' && "font-bold")}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn("cursor-pointer", preferences.theme === 'dark' && "font-bold")}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn("cursor-pointer", preferences.theme === 'system' && "font-bold")}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
