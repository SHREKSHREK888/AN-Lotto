"use client";

import { useState, useEffect } from "react";
import { getCurrentTheme, Theme, themes } from "@/lib/themes";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(themes[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentTheme = getCurrentTheme();
    setTheme(currentTheme);

    const handleThemeChange = () => {
      const newTheme = getCurrentTheme();
      setTheme(newTheme);
    };

    window.addEventListener("themechange", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  return { theme, mounted };
}
