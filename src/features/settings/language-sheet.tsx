"use client";
import { X, Globe, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n, type Locale } from "@/lib/i18n";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LanguageSheet() {
  const { setModal } = useApp();
  const { locale, setLocale, t } = useI18n();

  const options: { key: Locale; label: string; nativeLabel: string; flag: string }[] = [
    { key: "fa", label: t("persian"), nativeLabel: "فارسی", flag: "🇮🇷" },
    { key: "en", label: t("english"), nativeLabel: "English", flag: "🇬🇧" },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <Globe className="h-4 w-4" />
          {t("language")}
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-3 text-xs text-muted-foreground">
          {locale === "fa" ? "زبان پیش‌فرض فارسی است. زبان برنامه را انتخاب کنید." : "Persian is the default language. Choose your preferred language."}
        </p>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => {
                setLocale(opt.key);
                setTimeout(() => setModal(null), 200);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition-colors",
                locale === opt.key ? "border-foreground bg-card" : "border-border bg-card"
              )}
            >
              <span className="text-3xl">{opt.flag}</span>
              <div className="flex-1 text-left">
                <div className="text-base font-bold">{opt.nativeLabel}</div>
                <div className="text-xs text-muted-foreground">{opt.label}</div>
              </div>
              {locale === opt.key && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
