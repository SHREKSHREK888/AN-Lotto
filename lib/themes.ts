export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryHover: string;
    sidebar: string;
    sidebarHover: string;
    background: string;
    card: string;
    text: string;
    border: string;
  };
}

export const themes: Theme[] = [
  {
    id: "red",
    name: "สีแดง",
    colors: {
      primary: "red-600",
      primaryHover: "red-700",
      sidebar: "from-red-700 via-rose-700 to-red-800",
      sidebarHover: "red-600",
      background: "from-slate-50 via-red-50/70 to-rose-50/70",
      card: "white/95",
      text: "red-700",
      border: "red-300",
    },
  },
  {
    id: "blue",
    name: "สีน้ำเงิน",
    colors: {
      primary: "blue-600",
      primaryHover: "blue-700",
      sidebar: "from-blue-700 via-indigo-700 to-blue-800",
      sidebarHover: "blue-600",
      background: "from-slate-50 via-blue-50/70 to-indigo-50/70",
      card: "white/95",
      text: "blue-700",
      border: "blue-300",
    },
  },
  {
    id: "green",
    name: "สีเขียว",
    colors: {
      primary: "green-600",
      primaryHover: "green-700",
      sidebar: "from-green-700 via-emerald-700 to-green-800",
      sidebarHover: "green-600",
      background: "from-slate-50 via-green-50/70 to-emerald-50/70",
      card: "white/95",
      text: "green-700",
      border: "green-300",
    },
  },
  {
    id: "purple",
    name: "สีม่วง",
    colors: {
      primary: "purple-600",
      primaryHover: "purple-700",
      sidebar: "from-purple-700 via-violet-700 to-purple-800",
      sidebarHover: "purple-600",
      background: "from-slate-50 via-purple-50/70 to-violet-50/70",
      card: "white/95",
      text: "purple-700",
      border: "purple-300",
    },
  },
  {
    id: "orange",
    name: "สีส้ม",
    colors: {
      primary: "orange-600",
      primaryHover: "orange-700",
      sidebar: "from-orange-700 via-amber-700 to-orange-800",
      sidebarHover: "orange-600",
      background: "from-slate-50 via-orange-50/70 to-amber-50/70",
      card: "white/95",
      text: "orange-700",
      border: "orange-300",
    },
  },
  {
    id: "pink",
    name: "สีชมพู",
    colors: {
      primary: "pink-600",
      primaryHover: "pink-700",
      sidebar: "from-pink-700 via-rose-700 to-pink-800",
      sidebarHover: "pink-600",
      background: "from-slate-50 via-pink-50/70 to-rose-50/70",
      card: "white/95",
      text: "pink-700",
      border: "pink-300",
    },
  },
  {
    id: "teal",
    name: "สีเทาเขียว",
    colors: {
      primary: "teal-600",
      primaryHover: "teal-700",
      sidebar: "from-teal-700 via-cyan-700 to-teal-800",
      sidebarHover: "teal-600",
      background: "from-slate-50 via-teal-50/70 to-cyan-50/70",
      card: "white/95",
      text: "teal-700",
      border: "teal-300",
    },
  },
  {
    id: "indigo",
    name: "สีคราม",
    colors: {
      primary: "indigo-600",
      primaryHover: "indigo-700",
      sidebar: "from-indigo-700 via-blue-700 to-indigo-800",
      sidebarHover: "indigo-600",
      background: "from-slate-50 via-indigo-50/70 to-blue-50/70",
      card: "white/95",
      text: "indigo-700",
      border: "indigo-300",
    },
  },
  {
    id: "yellow",
    name: "สีเหลือง",
    colors: {
      primary: "yellow-600",
      primaryHover: "yellow-700",
      sidebar: "from-yellow-700 via-amber-700 to-yellow-800",
      sidebarHover: "yellow-600",
      background: "from-slate-50 via-yellow-50/70 to-amber-50/70",
      card: "white/95",
      text: "yellow-700",
      border: "yellow-300",
    },
  },
  {
    id: "cyan",
    name: "สีฟ้า",
    colors: {
      primary: "cyan-600",
      primaryHover: "cyan-700",
      sidebar: "from-cyan-700 via-blue-700 to-cyan-800",
      sidebarHover: "cyan-600",
      background: "from-slate-50 via-cyan-50/70 to-blue-50/70",
      card: "white/95",
      text: "cyan-700",
      border: "cyan-300",
    },
  },
  {
    id: "emerald",
    name: "สีเขียวมรกต",
    colors: {
      primary: "emerald-600",
      primaryHover: "emerald-700",
      sidebar: "from-emerald-700 via-green-700 to-emerald-800",
      sidebarHover: "emerald-600",
      background: "from-slate-50 via-emerald-50/70 to-green-50/70",
      card: "white/95",
      text: "emerald-700",
      border: "emerald-300",
    },
  },
  {
    id: "violet",
    name: "สีม่วงเข้ม",
    colors: {
      primary: "violet-600",
      primaryHover: "violet-700",
      sidebar: "from-violet-700 via-purple-700 to-violet-800",
      sidebarHover: "violet-600",
      background: "from-slate-50 via-violet-50/70 to-purple-50/70",
      card: "white/95",
      text: "violet-700",
      border: "violet-300",
    },
  },
  {
    id: "amber",
    name: "สีอำพัน",
    colors: {
      primary: "amber-600",
      primaryHover: "amber-700",
      sidebar: "from-amber-700 via-orange-700 to-amber-800",
      sidebarHover: "amber-600",
      background: "from-slate-50 via-amber-50/70 to-orange-50/70",
      card: "white/95",
      text: "amber-700",
      border: "amber-300",
    },
  },
  {
    id: "rose",
    name: "สีกุหลาบ",
    colors: {
      primary: "rose-600",
      primaryHover: "rose-700",
      sidebar: "from-rose-700 via-pink-700 to-rose-800",
      sidebarHover: "rose-600",
      background: "from-slate-50 via-rose-50/70 to-pink-50/70",
      card: "white/95",
      text: "rose-700",
      border: "rose-300",
    },
  },
  {
    id: "sky",
    name: "สีฟ้าอ่อน",
    colors: {
      primary: "sky-600",
      primaryHover: "sky-700",
      sidebar: "from-sky-700 via-cyan-700 to-sky-800",
      sidebarHover: "sky-600",
      background: "from-slate-50 via-sky-50/70 to-cyan-50/70",
      card: "white/95",
      text: "sky-700",
      border: "sky-300",
    },
  },
  {
    id: "lime",
    name: "สีเขียวอ่อน",
    colors: {
      primary: "lime-600",
      primaryHover: "lime-700",
      sidebar: "from-lime-700 via-green-700 to-lime-800",
      sidebarHover: "lime-600",
      background: "from-slate-50 via-lime-50/70 to-green-50/70",
      card: "white/95",
      text: "lime-700",
      border: "lime-300",
    },
  },
  {
    id: "fuchsia",
    name: "สีม่วงชมพู",
    colors: {
      primary: "fuchsia-600",
      primaryHover: "fuchsia-700",
      sidebar: "from-fuchsia-700 via-pink-700 to-fuchsia-800",
      sidebarHover: "fuchsia-600",
      background: "from-slate-50 via-fuchsia-50/70 to-pink-50/70",
      card: "white/95",
      text: "fuchsia-700",
      border: "fuchsia-300",
    },
  },
  {
    id: "slate",
    name: "สีเทา",
    colors: {
      primary: "slate-600",
      primaryHover: "slate-700",
      sidebar: "from-slate-700 via-gray-700 to-slate-800",
      sidebarHover: "slate-600",
      background: "from-slate-50 via-gray-50/70 to-slate-50/70",
      card: "white/95",
      text: "slate-700",
      border: "slate-300",
    },
  },
  {
    id: "stone",
    name: "สีหิน",
    colors: {
      primary: "stone-600",
      primaryHover: "stone-700",
      sidebar: "from-stone-700 via-neutral-700 to-stone-800",
      sidebarHover: "stone-600",
      background: "from-slate-50 via-stone-50/70 to-neutral-50/70",
      card: "white/95",
      text: "stone-700",
      border: "stone-300",
    },
  },
  {
    id: "zinc",
    name: "สีสังกะสี",
    colors: {
      primary: "zinc-600",
      primaryHover: "zinc-700",
      sidebar: "from-zinc-700 via-gray-700 to-zinc-800",
      sidebarHover: "zinc-600",
      background: "from-slate-50 via-zinc-50/70 to-gray-50/70",
      card: "white/95",
      text: "zinc-700",
      border: "zinc-300",
    },
  },
];

const THEME_STORAGE_KEY = "lotto_theme";

export function getCurrentTheme(): Theme {
  if (typeof window === "undefined") return themes[0];
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) {
    const theme = themes.find((t) => t.id === stored);
    if (theme) return theme;
  }
  return themes[0]; // Default to red
}

export function setTheme(themeId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
  applyTheme(themeId);
}

// Color mapping for Tailwind classes
const colorMap: Record<string, Record<string, string>> = {
  red: { 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b" },
  blue: { 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af" },
  green: { 600: "#16a34a", 700: "#15803d", 800: "#166534" },
  purple: { 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8" },
  orange: { 600: "#ea580c", 700: "#c2410c", 800: "#9a3412" },
  pink: { 600: "#db2777", 700: "#be185d", 800: "#9f1239" },
  teal: { 600: "#0d9488", 700: "#0f766e", 800: "#115e59" },
  indigo: { 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3" },
  yellow: { 600: "#ca8a04", 700: "#a16207", 800: "#854d0e" },
  cyan: { 600: "#0891b2", 700: "#0e7490", 800: "#155e75" },
  emerald: { 600: "#059669", 700: "#047857", 800: "#065f46" },
  violet: { 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6" },
  amber: { 600: "#d97706", 700: "#b45309", 800: "#92400e" },
  rose: { 600: "#e11d48", 700: "#be123c", 800: "#9f1239" },
  sky: { 600: "#0284c7", 700: "#0369a1", 800: "#075985" },
  lime: { 600: "#65a30d", 700: "#4d7c0f", 800: "#365314" },
  fuchsia: { 600: "#c026d3", 700: "#a21caf", 800: "#86198f" },
  slate: { 600: "#475569", 700: "#334155", 800: "#1e293b" },
  stone: { 600: "#57534e", 700: "#44403c", 800: "#292524" },
  zinc: { 600: "#52525b", 700: "#3f3f46", 800: "#27272a" },
};

export function applyTheme(themeId: string): void {
  if (typeof window === "undefined") return;
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return;

  const root = document.documentElement;
  root.setAttribute("data-theme", themeId);
  
  // Extract base color name (e.g., "red" from "red-600")
  const baseColor = theme.colors.primary.split("-")[0];
  const colors = colorMap[baseColor] || colorMap.red;
  
  // Set CSS variables for theme colors
  root.style.setProperty("--theme-primary", colors[600]);
  root.style.setProperty("--theme-primary-hover", colors[700]);
  root.style.setProperty("--theme-primary-dark", colors[800]);
  root.style.setProperty("--theme-sidebar-from", colors[700]);
  root.style.setProperty("--theme-sidebar-to", colors[800]);
  
  // Dispatch custom event for theme change
  window.dispatchEvent(new CustomEvent("themechange", { detail: { themeId, theme } }));
}
