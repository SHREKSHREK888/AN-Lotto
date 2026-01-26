"use client";

import { useEffect } from "react";
import { getCurrentTheme, applyTheme } from "@/lib/themes";
import { useDarkMode } from "@/hooks/use-dark-mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mounted } = useDarkMode();

  useEffect(() => {
    // Apply color theme on mount
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme.id);

    // Listen for theme changes
    const handleThemeChange = () => {
      const theme = getCurrentTheme();
      applyTheme(theme.id);
    };

    window.addEventListener("themechange", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
