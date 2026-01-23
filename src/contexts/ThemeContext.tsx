import { createContext, useContext, useEffect, useState } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface ThemeContextType {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  themes: string[];
  systemTheme: string | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences, savePreferences } = useUserPreferences();
  const [systemTheme, setSystemTheme] = useState<string | undefined>("light");

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = async (theme: string) => {
    await savePreferences({
      ...preferences,
      theme: theme as "light" | "dark" | "system",
    });
  };

  const resolvedTheme =
    preferences.theme === "system" ? systemTheme : preferences.theme;

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        setTheme,
        themes: ["light", "dark", "system"],
        systemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
