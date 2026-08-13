"use client";
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Insight {
  type: "success" | "warning" | "info";
  icon: typeof TrendingUp;
  title: string;
  desc: string;
  color: string;
}

export function NutritionInsights() {
  const { data } = useDashboard();
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
      title: "Low on protein",
      desc: `You're at ${Math.round(proteinPct)}% of your protein goal. Try adding chicken, eggs, or Greek yogurt.`,
      color: "var(--protein)",
    });
  } else if (proteinPct >= 100) {
    insights.push({
      type: "success",
      icon: CheckCircle2,
      title: "Protein goal hit! 💪",
      desc: `You've reached ${Math.round(consumed.protein)}g of protein today.`,
      color: "var(--success)",
    });
  }

  // Calorie insight
  const calPct = goals.calories > 0 ? (consumed.calories / goals.calories) * 100 : 0;
  if (calPct > 100) {
    insights.push({
      type: "warning",
      icon: AlertCircle,
      title: "Over calorie goal",
      desc: `You're ${Math.round(consumed.calories - goals.calories)} cal over your daily target.`,
      color: "var(--destructive)",
    });
  } else if (calPct >= 80 && calPct <= 100) {
    insights.push({
      type: "success",
      icon: CheckCircle2,
      title: "Right on track",
      desc: `You're ${Math.round(100 - calPct)}% from your calorie goal. Great balance!`,
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
      title: "Stay hydrated",
      desc: `You've had ${Math.round(waterMl)}ml of water. Aim for 2.5L today.`,
      color: "var(--water)",
    });
  } else if (waterPct >= 100) {
    insights.push({
      type: "success",
      icon: CheckCircle2,
      title: "Hydration goal met! 💧",
      desc: `Excellent! You've drunk ${Math.round(waterMl)}ml of water.`,
      color: "var(--water)",
    });
  }

  // Steps insight
  const steps = data.todayHealth?.steps ?? 0;
  if (steps >= 10000) {
    insights.push({
      type: "success",
      icon: TrendingUp,
      title: "10K steps crushed! 🚶",
      desc: `You walked ${steps.toLocaleString()} steps today. Amazing!`,
      color: "var(--success)",
    });
  } else if (steps < 5000 && new Date().getHours() >= 18) {
    insights.push({
      type: "info",
      icon: TrendingDown,
      title: "Time for a walk?",
      desc: `Only ${steps.toLocaleString()} steps so far. A short walk could help you reach 10K.`,
      color: "var(--carbs)",
    });
  }

  // Streak insight
  const streak = data.user.streak;
  if (streak >= 3) {
    insights.push({
      type: "success",
      icon: TrendingUp,
      title: `${streak}-day streak! 🔥`,
      desc: "Consistency is paying off. Keep logging to build your streak!",
      color: "var(--streak)",
    });
  }

  if (insights.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 px-1 text-base font-semibold">
        <Lightbulb className="h-4 w-4 text-carbs" />
        Insights
      </h3>
      <div className="space-y-2">
        {insights.slice(0, 4).map((insight, i) => (
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
