import { createContext, useContext, useEffect, useState } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface ThemeContextType {
  theme: "light" | "dark" | "system" | undefined;
  setTheme: (theme: string) => Promise<void>;
  themes: string[];
  systemTheme: string | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences, savePreferences } = useUserPreferences();
  const [systemTheme, setSystemTheme] = useState<string | undefined>("light");

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

    const root = window.document.documentElement;

    let themeToApply = theme;
    if (theme === "system") {
      themeToApply = systemTheme === "dark" ? "dark" : "light";
    }

    if (themeToApply === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    await savePreferences({
      ...preferences,
      theme: theme as "light" | "dark" | "system",
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: preferences.theme,
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