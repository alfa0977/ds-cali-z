"use client";
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";

interface Insight {
  type: "success" | "warning" | "info";
  icon: typeof TrendingUp;
  title: string;
  desc: string;
  color: string;
}

function tpl(key: string, ...vals: (string | number)[]): string {
  let out = key;
  vals.forEach((v, i) => {
    out = out.replace(`{${i}}`, String(v));
  });
  return out;
}

export function NutritionInsights() {
  const { data } = useDashboard();
  const { locale, t } = useI18n();
  if (!data) return null;

  const goals = data.user.goals;
  const consumed = data.consumed;
  const insights: Insight[] = [];

  // Protein insight
  const proteinPct = goals.protein > 0 ? (consumed.protein / goals.protein) * 100 : 0;
  if (proteinPct < 60 && consumed.calories > 500) {
    insights.push({
      type: "warning",
      icon: TrendingDown,
      title: t("lowOnProtein"),
      desc: tpl(t("lowProteinDesc"), formatNumber(Math.round(proteinPct), locale)),
      color: "var(--protein)",
    });
  } else if (proteinPct >= 100) {
    insights.push({
      type: "success",
      icon: CheckCircle2,
      title: t("proteinGoalHit"),
      desc: tpl(t("proteinHitDesc"), formatNumber(Math.round(consumed.protein), locale)),
      color: "var(--success)",
    });
  }

  // Calorie insight
  const calPct = goals.calories > 0 ? (consumed.calories / goals.calories) * 100 : 0;
  if (calPct > 100) {
    insights.push({
      type: "warning",
      icon: AlertCircle,
      title: t("overCalorieGoal"),
      desc: tpl(t("overCalorieDesc"), formatNumber(Math.round(consumed.calories - goals.calories), locale)),
      color: "var(--destructive)",
    });
  } else if (calPct >= 80 && calPct <= 100) {
    insights.push({
      type: "success",
      icon: CheckCircle2,
      title: t("rightOnTrack"),
      desc: tpl(t("rightOnTrackDesc"), formatNumber(Math.round(100 - calPct), locale)),
      color: "var(--success)",
    });
  }

  // Water insight
  const waterMl = data.todayHealth?.waterMl ?? 0;
  const waterGoal = 2500;
  const waterPct = (waterMl / waterGoal) * 100;
  if (waterPct < 50) {
    insights.push({
      type: "info",
      icon: TrendingDown,
      title: t("stayHydrated"),
      desc: tpl(t("stayHydratedDesc"), formatNumber(Math.round(waterMl), locale)),
      color: "var(--water)",
    });
  } else if (waterPct >= 100) {
    insights.push({
      type: "success",
      icon: CheckCircle2,
      title: t("hydrationGoalMet"),
      desc: tpl(t("hydrationMetDesc"), formatNumber(Math.round(waterMl), locale)),
      color: "var(--water)",
    });
  }

  // Steps insight
  const steps = data.todayHealth?.steps ?? 0;
  if (steps >= 10000) {
    insights.push({
      type: "success",
      icon: TrendingUp,
      title: t("stepsCrushed"),
      desc: tpl(t("stepsCrushedDesc"), formatNumber(steps, locale)),
      color: "var(--success)",
    });
  } else if (steps < 5000 && new Date().getHours() >= 18) {
    insights.push({
      type: "info",
      icon: TrendingDown,
      title: t("timeForWalk"),
      desc: tpl(t("timeForWalkDesc"), formatNumber(steps, locale)),
      color: "var(--carbs)",
    });
  }

  // Streak insight
  const streak = data.user.streak;
  if (streak >= 3) {
    insights.push({
      type: "success",
      icon: TrendingUp,
      title: tpl(t("dayStreakDesc"), formatNumber(streak, locale)),
      desc: t("consistencyIsKey"),
      color: "var(--streak)",
    });
  }

  // Protein trend comparison (NEW)
  const trend = data.macroTrend ?? [];
  const todayProtein = trend[trend.length - 1]?.protein ?? 0;
  const avgProtein = trend.length > 0 ? Math.round(trend.reduce((a, b) => a + b.protein, 0) / trend.length) : 0;
  if (trend.length >= 2 && avgProtein > 0 && todayProtein > 0) {
    const proteinDiff = todayProtein - avgProtein;
    if (Math.abs(proteinDiff) >= 20) {
      insights.push({
        type: proteinDiff > 0 ? "success" : "warning",
        icon: proteinDiff > 0 ? TrendingUp : TrendingDown,
        title: proteinDiff > 0 ? t("proteinUp") : t("proteinDown"),
        desc: tpl(
          proteinDiff > 0 ? t("proteinUpDesc") : t("proteinDownDesc"),
          formatNumber(Math.round(todayProtein), locale),
          formatNumber(avgProtein, locale),
          formatNumber(Math.round(Math.abs(proteinDiff)), locale)
        ),
        color: "var(--protein)",
      });
    }
  }

  // Water trend comparison (NEW)
  const weekWater = data.weekHealth ?? [];
  const todayWaterMl = data.todayHealth?.waterMl ?? 0;
  const avgWaterMl = weekWater.length > 0 ? Math.round(weekWater.reduce((a, b) => a + b.waterMl, 0) / weekWater.length) : 0;
  if (weekWater.length >= 2 && avgWaterMl > 0 && todayWaterMl > 0) {
    const waterDiff = todayWaterMl - avgWaterMl;
    if (Math.abs(waterDiff) >= 500) {
      insights.push({
        type: waterDiff > 0 ? "success" : "info",
        icon: waterDiff > 0 ? TrendingUp : TrendingDown,
        title: waterDiff > 0 ? t("drinkingMoreWater") : t("drinkMoreWater"),
        desc: tpl(
          t("waterUpDesc"),
          formatNumber(Math.round(todayWaterMl / 100) / 10, locale),
          formatNumber((avgWaterMl / 1000).toFixed(1), locale)
        ),
        color: "var(--water)",
      });
    }
  }

  if (insights.length === 0) return null;

  // Weekly calorie trend comparison
  const todayCal = trend[trend.length - 1]?.calories ?? 0;
  const avgCal = trend.length > 0 ? Math.round(trend.reduce((a, b) => a + b.calories, 0) / trend.length) : 0;
  const calDiff = todayCal - avgCal;
  const trendInsight: Insight | null = trend.length >= 2 && avgCal > 0 ? {
    type: calDiff > 200 ? "warning" : calDiff < -200 ? "success" : "info",
    icon: calDiff > 0 ? TrendingUp : TrendingDown,
    title: calDiff > 200 ? t("eatingMore") : calDiff < -200 ? t("eatingLess") : t("consistentIntake"),
    desc: tpl(
      calDiff > 200 ? t("eatingMoreDesc") : calDiff < -200 ? t("eatingLessDesc") : t("consistentIntakeDesc"),
      formatNumber(todayCal, locale),
      formatNumber(avgCal, locale),
      formatNumber(Math.abs(calDiff), locale)
    ),
    color: calDiff > 200 ? "var(--protein)" : calDiff < -200 ? "var(--success)" : "var(--carbs)",
  } : null;

  const allInsights = [...insights];
  if (trendInsight) allInsights.splice(1, 0, trendInsight);

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 px-1 text-base font-semibold">
        <Lightbulb className="h-4 w-4 text-carbs" />
        {t("insights")}
      </h3>
      <div className="space-y-2">
        {allInsights.slice(0, 5).map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <TapCard className="flex items-start gap-3 rounded-2xl bg-card p-3 shadow-ios">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${insight.color} 15%, transparent)` }}
              >
                <insight.icon className="h-4 w-4" style={{ color: insight.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{insight.title}</div>
                <div className="text-xs text-muted-foreground leading-snug">{insight.desc}</div>
              </div>
            </TapCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
