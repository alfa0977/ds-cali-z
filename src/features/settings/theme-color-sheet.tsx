"use client";
import { X, Palette, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useThemeColor, THEME_COLOR_OPTIONS } from "@/lib/theme-color";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeColorSheet() {
  const { setModal } = useApp();
  const { t } = useI18n();
  const { color, setColor } = useThemeColor();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <Palette className="h-4 w-4" />
          {t("themeColor")}
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-3 text-xs text-muted-foreground">
          {t("themeColor")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {THEME_COLOR_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setColor(opt.key)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors",
                color === opt.key ? "border-foreground bg-card" : "border-border bg-card"
              )}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
                style={{ backgroundColor: opt.swatch }}
              >
                {color === opt.key && (
                  <Check className="h-6 w-6 text-white" strokeWidth={3} />
                )}
              </div>
              <span className="text-sm font-medium">
                {opt.labelFa} · {opt.labelEn}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Preview */}
        <div className="mt-4 rounded-2xl bg-card p-4 shadow-ios">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            {useI18n().locale === "fa" ? "پیش‌نمایش" : "Preview"}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "var(--streak)" }} />
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "var(--protein)" }} />
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "var(--carbs)" }} />
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "var(--fats)" }} />
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "var(--success)" }} />
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "var(--water)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
