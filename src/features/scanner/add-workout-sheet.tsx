"use client";
import { useState } from "react";
import { X, Dumbbell, Footprints, Bike, Heart } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useLogWorkout } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";
import { translateFoodName } from "@/lib/food-translations";

const TYPES = [
  { label: "Running", icon: Footprints, mets: 9.8, emoji: "🏃" },
  { label: "Weight lifting", icon: Dumbbell, mets: 6, emoji: "🏋️" },
  { label: "Cycling", icon: Bike, mets: 7.5, emoji: "🚴" },
  { label: "Cardio", icon: Heart, mets: 8, emoji: "💗" },
  { label: "Walking", icon: Footprints, mets: 3.5, emoji: "🚶" },
  { label: "Swimming", icon: Heart, mets: 8.3, emoji: "🏊" },
  { label: "Yoga", icon: Heart, mets: 3, emoji: "🧘" },
  { label: "HIIT", icon: Dumbbell, mets: 12, emoji: "🔥" },
];
const INTENSITIES = ["low", "medium", "high"] as const;
const INTENSITY_KEYS = { low: "low", medium: "medium", high: "high" } as const;

// Quick duration presets (minutes)
const DURATION_PRESETS = [15, 30, 45, 60, 90];

export function AddWorkoutSheet() {
  const { setModal } = useApp();
  const logWorkout = useLogWorkout();
  const { locale, t } = useI18n();
  const [type, setType] = useState("Running");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<(typeof INTENSITIES)[number]>("medium");

  // crude calorie estimate: METs * weight(kg) * hours
  const weightKg = 78;
  const mets = TYPES.find((tt) => tt.label === type)?.mets ?? 6;
  const intensityMult = intensity === "low" ? 0.8 : intensity === "high" ? 1.25 : 1;
  const calories = Math.round(mets * weightKg * (duration / 60) * intensityMult);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">{t("logWorkout")}</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("activity")}</p>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((tt) => (
            <button
              key={tt.label}
              onClick={() => setType(tt.label)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 transition-colors",
                type === tt.label ? "border-foreground bg-card" : "border-border bg-card"
              )}
            >
              <span className="text-xl">{tt.emoji}</span>
              <span className="text-[10px] font-medium leading-tight text-center">{translateFoodName(tt.label, locale)}</span>
            </button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-semibold text-muted-foreground">{t("duration")}</p>
        <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-ios">
          <button onClick={() => setDuration((d) => Math.max(5, d - 5))} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg font-bold">−</button>
          <div className="text-center">
            <span className="text-3xl font-bold tabular-nums">{formatNumber(duration, locale)}</span>
            <span className="ml-1 text-sm text-muted-foreground">{t("min")}</span>
          </div>
          <button onClick={() => setDuration((d) => d + 5)} className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background text-lg font-bold">+</button>
        </div>
        {/* Quick duration presets */}
        <div className="mt-2 flex gap-2">
          {DURATION_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setDuration(p)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                duration === p ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
              )}
            >
              {formatNumber(p, locale)}m
            </button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-semibold text-muted-foreground">{t("intensity")}</p>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITIES.map((i) => (
            <button
              key={i}
              onClick={() => setIntensity(i)}
              className={cn(
                "rounded-xl border-2 py-2.5 text-sm font-medium transition-colors",
                intensity === i ? "border-foreground bg-card" : "border-border bg-card text-muted-foreground"
              )}
            >
              {t(INTENSITY_KEYS[i] as "low")}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-streak/10 p-4 text-center">
          <p className="text-xs text-muted-foreground">{t("estimatedCaloriesBurned")}</p>
          <p className="text-3xl font-bold text-streak tabular-nums">{formatNumber(calories, locale)}</p>
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-3 pb-safe">
        <Button
          className="w-full rounded-full py-3"
          size="lg"
          disabled={logWorkout.isPending}
          onClick={() =>
            logWorkout.mutate(
              { type, durationMinutes: duration, intensity, caloriesBurned: calories },
              { onSuccess: () => setModal(null) }
            )
          }
        >
          {logWorkout.isPending ? t("saving") : t("logWorkout")}
        </Button>
      </div>
    </div>
  );
}
