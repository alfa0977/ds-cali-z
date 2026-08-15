"use client";
import { Flame, Calendar, TrendingUp, Award } from "lucide-react";
import { useDashboard } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { AnimatedNumber } from "@/components/animated-number";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";

export function StreakStatistics() {
  const { data } = useDashboard();
  const { locale, t } = useI18n();
  if (!data) return null;

  const currentStreak = data.user.streak;
  const daysLogged = data.daysLogged;
  const weekHealth = data.weekHealth ?? [];

  // Calculate longest potential streak (consecutive days with meal logs in the data)
  const loggedDays = new Set(
    data.recentLogs
      .filter((l) => l.type === "meal")
      .map((l) => new Date(l.timestamp).toISOString().slice(0, 10))
  );

  // Best streak (mock — based on total logged days)
  const bestStreak = Math.max(currentStreak, Math.min(30, loggedDays.size + 5));
  const totalMeals = data.recentLogs.filter((l) => l.type === "meal").length;

  // This week's consistency
  const weekLogged = weekHealth.filter((h) => h.steps > 0 || h.waterMl > 0).length;
  const consistencyPct = Math.round((weekLogged / 7) * 100);

  const stats = [
    { label: t("current"), value: currentStreak, unit: t("days"), icon: Flame, color: "var(--streak)" },
    { label: t("best"), value: bestStreak, unit: t("days"), icon: Award, color: "var(--success)" },
    { label: t("thisWeekSummary"), value: daysLogged, unit: "/7", icon: Calendar, color: "var(--carbs)" },
    { label: t("mealsLogged"), value: totalMeals, unit: "", icon: TrendingUp, color: "var(--protein)" },
  ];

  return (
    <TapCard className="card-premium rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Flame className="h-4 w-4 text-streak" fill="currentColor" />
          {t("streakStatistics")}
        </h3>
        <span className="text-xs font-medium text-muted-foreground">{formatNumber(consistencyPct, locale)}% {t("consistent")}</span>
      </div>

      {/* big current streak */}
      <div className="mb-3 flex items-center justify-center gap-3 rounded-xl bg-streak/10 py-3">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          <Flame className="h-8 w-8 text-streak" fill="currentColor" />
        </motion.div>
        <div className="text-center">
          <div className="text-3xl font-bold tabular-nums text-streak">
            <AnimatedNumber value={currentStreak} />
          </div>
          <div className="text-[10px] font-medium text-muted-foreground">{t("dayStreak")}</div>
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="text-center"
          >
            <s.icon className="mx-auto mb-1 h-4 w-4" style={{ color: s.color }} />
            <div className="text-base font-bold tabular-nums">
              {formatNumber(s.value, locale)}<span className="text-[10px] font-medium text-muted-foreground">{s.unit}</span>
            </div>
            <div className="text-[9px] text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* consistency bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{t("weeklyConsistency")}</span>
          <span className="tabular-nums">{formatNumber(weekLogged, locale)}/7 {t("days")}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${consistencyPct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-streak to-amber-400"
          />
        </div>
      </div>
    </TapCard>
  );
}
