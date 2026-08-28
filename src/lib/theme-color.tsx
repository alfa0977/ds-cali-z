"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeColorKey = "orange" | "green" | "purple" | "rose" | "teal" | "sunset" | "ocean" | "forest" | "candy" | "amber" | "crimson" | "monochrome";

// Each palette overrides the --streak (primary accent) and related colors.
const PALETTES: Record<ThemeColorKey, { streak: string; protein: string; carbs: string; fats: string; success: string; water: string }> = {
  orange: {
    streak: "#FF9500",
    protein: "#FF6B6B",
    carbs: "#F4A261",
    fats: "#4A90D9",
    success: "#34C759",
    water: "#007AFF",
  },
  green: {
    streak: "#34C759",
    protein: "#06b6d4",
    carbs: "#84cc16",
    fats: "#0ea5e9",
    success: "#22c55e",
    water: "#0284c7",
  },
  purple: {
    streak: "#8b5cf6",
    protein: "#ec4899",
    carbs: "#a855f7",
    fats: "#6366f1",
    success: "#10b981",
    water: "#3b82f6",
  },
  rose: {
    streak: "#f43f5e",
    protein: "#e11d48",
    carbs: "#fb7185",
    fats: "#a855f7",
    success: "#10b981",
    water: "#0ea5e9",
  },
  teal: {
    streak: "#14b8a6",
    protein: "#f97316",
    carbs: "#06b6d4",
    fats: "#6366f1",
    success: "#22c55e",
    water: "#0284c7",
  },
  sunset: {
    streak: "#f97316",
    protein: "#ef4444",
    carbs: "#fbbf24",
    fats: "#f43f5e",
    success: "#84cc16",
    water: "#06b6d4",
  },
  ocean: {
    streak: "#0ea5e9",
    protein: "#14b8a6",
    carbs: "#06b6d4",
    fats: "#0891b2",
    success: "#10b981",
    water: "#2563eb",
  },
  forest: {
    streak: "#16a34a",
    protein: "#15803d",
    carbs: "#65a30d",
    fats: "#166534",
    success: "#22c55e",
    water: "#0891b2",
  },
  candy: {
    streak: "#ec4899",
    protein: "#f472b6",
    carbs: "#c084fc",
    fats: "#fb7185",
    success: "#34d399",
    water: "#a78bfa",
  },
  amber: {
    streak: "#f59e0b",
    protein: "#d97706",
    carbs: "#fbbf24",
    fats: "#b45309",
    success: "#65a30d",
    water: "#0891b2",
  },
  crimson: {
    streak: "#dc2626",
    protein: "#b91c1c",
    carbs: "#f87171",
    fats: "#991b1b",
    success: "#16a34a",
    water: "#0ea5e9",
  },
  monochrome: {
    streak: "#404040",
    protein: "#525252",
    carbs: "#737373",
    fats: "#262626",
    success: "#525252",
    water: "#6b7280",
  },
};

const STORAGE_KEY = "ds-cali-theme-color";

interface ThemeColorContext {
  color: ThemeColorKey;
  setColor: (c: ThemeColorKey) => void;
  colors: typeof PALETTES;
}

const Ctx = createContext<ThemeColorContext | null>(null);

export function ThemeColorProvider({ children }: { children: ReactNode }) {
  // Read saved theme color synchronously on the client (no setTimeout, no flash of wrong color).
  const [color, setColorState] = useState<ThemeColorKey>(() => {
    if (typeof window === "undefined") return "orange";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeColorKey | null;
      if (saved && PALETTES[saved]) return saved;
    } catch {}
    return "orange";
  });

  // Persist + apply CSS variables whenever the color changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, color);
    } catch {}
    const palette = PALETTES[color];
    const root = document.documentElement;
    root.style.setProperty("--streak", palette.streak);
    root.style.setProperty("--protein", palette.protein);
    root.style.setProperty("--carbs", palette.carbs);
    root.style.setProperty("--fats", palette.fats);
    root.style.setProperty("--success", palette.success);
    root.style.setProperty("--water", palette.water);
  }, [color]);

  const setColor = (c: ThemeColorKey) => setColorState(c);

  return (
    <Ctx.Provider value={{ color, setColor, colors: PALETTES }}>
      {children}
    </Ctx.Provider>
  );
}

export function useThemeColor() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      color: "orange" as ThemeColorKey,
      setColor: () => {},
      colors: PALETTES,
    };
  }
  return ctx;
}

export const THEME_COLOR_OPTIONS: { key: ThemeColorKey; labelFa: string; labelEn: string; swatch: string }[] = [
  { key: "orange", labelFa: "نارنجی", labelEn: "Orange", swatch: "#FF9500" },
  { key: "green", labelFa: "سبز", labelEn: "Green", swatch: "#34C759" },
  { key: "purple", labelFa: "بنفش", labelEn: "Purple", swatch: "#8b5cf6" },
  { key: "rose", labelFa: "گل‌بهی", labelEn: "Rose", swatch: "#f43f5e" },
  { key: "teal", labelFa: "فیروزه‌ای", labelEn: "Teal", swatch: "#14b8a6" },
  { key: "sunset", labelFa: "غروب", labelEn: "Sunset", swatch: "#f97316" },
  { key: "ocean", labelFa: "اقیانوس", labelEn: "Ocean", swatch: "#0ea5e9" },
  { key: "forest", labelFa: "جنگل", labelEn: "Forest", swatch: "#16a34a" },
  { key: "candy", labelFa: "آبنبات", labelEn: "Candy", swatch: "#ec4899" },
  { key: "amber", labelFa: "کهربایی", labelEn: "Amber", swatch: "#f59e0b" },
  { key: "crimson", labelFa: "زرشکی", labelEn: "Crimson", swatch: "#dc2626" },
  { key: "monochrome", labelFa: "تک‌رنگ", labelEn: "Monochrome", swatch: "#404040" },
];
