"use client";

import { MonitorIcon, MoonStarIcon, SunIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import type { JSX } from "react";
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

function ThemeOption({
  icon,
  value,
  label,
  isActive,
  onClick,
}: {
  icon: JSX.Element;
  value: string;
  label: string;
  isActive?: boolean;
  onClick: (value: string) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", bounce: 0.5, duration: 0.3 }}
      className={cn(
        "relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all pointer-events-auto",
        isActive
          ? "text-zinc-950 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800"
          : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      )}
      role="radio"
      aria-checked={isActive}
      aria-label={`Switch to ${label} theme`}
      onClick={() => onClick(value)}
      type="button"
    >
      <span className="[&_svg]:size-4">{icon}</span>
      <span className="text-sm font-medium">{label}</span>

      {isActive && (
        <motion.div
          layoutId="theme-option-bg"
          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
          className="absolute inset-0 rounded-lg border border-zinc-300 dark:border-zinc-600 -z-10"
        />
      )}
    </motion.button>
  );
}

const THEME_OPTIONS = [
  {
    icon: <SunIcon />,
    value: "light",
    label: "Light",
  },
  {
    icon: <MoonStarIcon />,
    value: "dark",
    label: "Dark",
  },
  {
    icon: <MonitorIcon />,
    value: "system",
    label: "System",
  },
];

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentThemeOption = THEME_OPTIONS.find((opt) => opt.value === theme);

  if (!isMounted || !currentThemeOption) {
    return <div className="flex h-8 w-8" />;
  }

  const handleThemeChange = async (newTheme: string) => {
    await setTheme(newTheme);
    setIsExpanded(false);
  };

  return (
    <div className="relative">
      <motion.button
        className="relative flex size-8 cursor-pointer items-center justify-center rounded-full transition-all pointer-events-auto bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        aria-label="Theme switcher"
      >
        <span className="[&_svg]:size-4">{currentThemeOption.icon}</span>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
            className="absolute bottom-12 right-0 flex flex-col gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700 pointer-events-auto z-50"
          >
            {THEME_OPTIONS.map((option) => (
              <ThemeOption
                key={option.value}
                icon={option.icon}
                value={option.value}
                label={option.label}
                isActive={theme === option.value}
                onClick={handleThemeChange}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close on outside click */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

export { ThemeSwitcher };
