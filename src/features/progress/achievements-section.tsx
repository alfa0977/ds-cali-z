"use client";
import { motion } from "framer-motion";
import { Flame, Trophy, Target, Zap, Star, Award, TrendingUp, Apple } from "lucide-react";
import { useDashboard } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";

interface Badge {
  id: string;
  labelKey: "firstScan" | "streak3" | "weekWarrior" | "monthlyMaster" | "steps10k" | "hydrated" | "mealLogger" | "perfectWeek";
  descKey: "firstScanDesc" | "streak3Desc" | "weekWarriorDesc" | "monthlyMasterDesc" | "steps10kDesc" | "hydratedDesc" | "mealLoggerDesc" | "perfectWeekDesc";
  icon: typeof Flame;
  unlocked: boolean;
  progress?: number; // 0-100
  color: string;
}

export function AchievementsSection() {
  const { data } = useDashboard();
  const { locale, t } = useI18n();
  if (!data) return null;

  const streak = data.user.streak;
  const daysLogged = data.daysLogged;
  const mealsCount = data.recentLogs.filter((l) => l.type === "meal").length;
  const stepsToday = data.todayHealth?.steps ?? 0;
  const waterToday = data.todayHealth?.waterMl ?? 0;
  const totalScans = data.recentLogs.filter((l) => l.type === "meal" && l.mealId).length;

  const badges: Badge[] = [
    {
      id: "first-scan",
      labelKey: "firstScan",
      descKey: "firstScanDesc",
      icon: Apple,
      unlocked: totalScans > 0,
      color: "var(--streak)",
    },
    {
      id: "streak-3",
      labelKey: "streak3",
      descKey: "streak3Desc",
      icon: Flame,
      unlocked: streak >= 3,
      progress: Math.min(100, (streak / 3) * 100),
      color: "var(--streak)",
    },
    {
      id: "streak-7",
      labelKey: "weekWarrior",
      descKey: "weekWarriorDesc",
      icon: Flame,
      unlocked: streak >= 7,
      progress: Math.min(100, (streak / 7) * 100),
      color: "var(--streak)",
    },
    {
      id: "streak-30",
      labelKey: "monthlyMaster",
      descKey: "monthlyMasterDesc",
      icon: Trophy,
      unlocked: streak >= 30,
      progress: Math.min(100, (streak / 30) * 100),
      color: "var(--success)",
    },
    {
      id: "step-10k",
      labelKey: "steps10k",
      descKey: "steps10kDesc",
      icon: TrendingUp,
      unlocked: stepsToday >= 10000,
      progress: Math.min(100, (stepsToday / 10000) * 100),
      color: "var(--success)",
    },
    {
      id: "water-goal",
      labelKey: "hydrated",
      descKey: "hydratedDesc",
      icon: Zap,
      unlocked: waterToday >= 2500,
      progress: Math.min(100, (waterToday / 2500) * 100),
      color: "var(--water)",
    },
    {
      id: "meals-10",
      labelKey: "mealLogger",
      descKey: "mealLoggerDesc",
      icon: Star,
      unlocked: mealsCount >= 10,
      progress: Math.min(100, (mealsCount / 10) * 100),
      color: "var(--carbs)",
    },
    {
      id: "week-complete",
      labelKey: "perfectWeek",
      descKey: "perfectWeekDesc",
      icon: Award,
      unlocked: daysLogged >= 7,
      progress: Math.min(100, (daysLogged / 7) * 100),
      color: "var(--protein)",
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-base font-semibold flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-streak" />
          {t("achievements")}
        </h3>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {formatNumber(unlockedCount, locale)}/{formatNumber(badges.length, locale)} {t("unlocked")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <TapCard
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 shadow-ios",
                badge.unlocked ? "bg-card" : "bg-card opacity-70"
              )}
            >
              {badge.unlocked && (
                <div
                  className="absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-20"
                  style={{ backgroundColor: badge.color }}
                />
              )}
              <div className="relative">
                <div
                  className={cn(
                    "mb-2 flex h-10 w-10 items-center justify-center rounded-xl",
                    badge.unlocked ? "" : "grayscale"
                  )}
                  style={{
                    backgroundColor: badge.unlocked
                      ? `color-mix(in srgb, ${badge.color} 15%, transparent)`
                      : "var(--secondary)",
                  }}
                >
                  <badge.icon
                    className="h-5 w-5"
                    style={{ color: badge.unlocked ? badge.color : "var(--muted-foreground)" }}
                    fill={badge.unlocked ? "currentColor" : "none"}
                    fillOpacity={badge.unlocked ? 0.2 : 0}
                  />
                </div>
                <div className="text-sm font-bold">{t(badge.labelKey)}</div>
                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{t(badge.descKey)}</div>
                {badge.unlocked ? (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold" style={{ color: badge.color }}>
                    <Star className="h-3 w-3" fill="currentColor" />
                    {t("unlockedLabel")}
                  </div>
                ) : badge.progress != null ? (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${badge.progress}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: badge.color }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                      {formatNumber(Math.round(badge.progress), locale)}%
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] text-muted-foreground">{t("locked")}</div>
                )}
              </div>
            </TapCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
