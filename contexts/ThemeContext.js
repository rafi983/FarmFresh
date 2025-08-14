"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Always start with false during SSR to match server-rendered state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state with what the script already applied
  useEffect(() => {
    const initializeTheme = () => {
      try {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;

        const shouldBeDark =
          savedTheme === "dark" || (!savedTheme && prefersDark);

        // Check if the script already applied the dark class
        const isDarkApplied =
          document.documentElement.classList.contains("dark");

        // Sync our state with what's actually on the DOM
        setIsDarkMode(isDarkApplied || shouldBeDark);

        // Ensure DOM is consistent (the script should have already handled this)
        if (shouldBeDark && !isDarkApplied) {
          document.documentElement.classList.add("dark");
        } else if (!shouldBeDark && isDarkApplied) {
          document.documentElement.classList.remove("dark");
        }

        setIsLoaded(true);
      } catch (error) {
        console.error("Error initializing theme:", error);
        // Fallback logic matching the script
        try {
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches;
          setIsDarkMode(prefersDark);
          if (prefersDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } catch (e2) {
          setIsDarkMode(false);
          document.documentElement.classList.remove("dark");
        }
        setIsLoaded(true);
      }
    };

    initializeTheme();
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (!isLoaded) return; // Prevent toggle before theme is loaded

    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
    isLoaded,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
