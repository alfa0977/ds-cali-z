"use client";
import { Flame, Clock } from "lucide-react";
import { useDashboard } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";

const HOURS = [6, 9, 12, 15, 18, 21];

export function NutritionTimeline() {
  const { data } = useDashboard();
  const { locale, t } = useI18n();
  if (!data) return null;

  // Group meal logs by hour bucket
  const logs = data.dayLogs.filter((l) => l.type === "meal" && l.macros);
  const buckets: Record<number, { calories: number; count: number; label: string }> = {};

  HOURS.forEach((h) => {
    buckets[h] = { calories: 0, count: 0, label: hourLabel(h, locale) };
  });

  for (const log of logs) {
    const hour = new Date(log.timestamp).getHours();
    // Find nearest bucket
    let nearest = HOURS[0];
    let minDiff = 24;
    for (const h of HOURS) {
      const diff = Math.abs(hour - h);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = h;
      }
    }
    buckets[nearest].calories += log.macros!.calories;
    buckets[nearest].count += 1;
  }

  const maxCal = Math.max(...Object.values(buckets).map((b) => b.calories), 1);
  const totalCal = Object.values(buckets).reduce((a, b) => a + b.calories, 0);

  return (
    <TapCard className="card-premium rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="h-4 w-4" />
          {t("todayTimeline")}
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(totalCal, locale)} {t("calTotal")}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2" style={{ height: 80 }}>
        {HOURS.map((h, i) => {
          const b = buckets[h];
          const heightPct = (b.calories / maxCal) * 100;
          return (
            <div key={h} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[9px] font-semibold tabular-nums text-muted-foreground">
                {b.calories > 0 ? formatNumber(b.calories, locale) : ""}
              </span>
              <div className="relative flex w-full flex-1 items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "w-full max-w-[28px] rounded-t-md",
                    b.count > 0 ? "bg-gradient-to-t from-streak/60 to-streak" : "bg-muted"
                  )}
                  style={{ minHeight: b.count > 0 ? 4 : 2 }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">{b.label}</span>
            </div>
          );
        })}
      </div>
    </TapCard>
  );
}

function hourLabel(h: number, locale: "fa" | "en"): string {
  const num = h === 0 ? 12 : h <= 12 ? h : h - 12;
  const suffix = h < 12 ? (locale === "fa" ? "ق" : "a") : locale === "fa" ? "ب" : "p";
  const numStr = locale === "fa" ? formatNumber(num, locale) : String(num);
  return `${numStr}${suffix}`;
}
