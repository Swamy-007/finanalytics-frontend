import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = (localStorage.getItem("fw-theme") as Theme) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    return saved;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fw-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return React.createElement(ThemeContext.Provider, { value: { theme, toggleTheme } }, children);
};

export const useTheme = () => useContext(ThemeContext);
