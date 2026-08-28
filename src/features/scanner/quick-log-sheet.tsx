"use client";
import { useState } from "react";
import { X, Check, Flame, Drumstick, Wheat, Droplets } from "lucide-react";
import { useApp } from "@/lib/store";
import { useLogFood } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";
import { translateFoodName } from "@/lib/food-translations";
import { cn } from "@/lib/utils";

export interface QuickLogPayload {
  foodId?: string;
  name: string;
  emoji?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  servingWeightGrams?: number;
  /** Optional image URL (for recents with photos) */
  imageUrl?: string;
}

export function QuickLogSheet() {
  const { setModal, quickLogPayload } = useApp();
  const logFood = useLogFood();
  const { locale, t } = useI18n();

  const [servings, setServings] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string>(() => {
    const h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 16) return "lunch";
    if (h < 22) return "dinner";
    return "snack";
  });
  const [mealTime, setMealTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  if (!quickLogPayload) return null;
  const p = quickLogPayload;

  const scaledMacros = {
    calories: Math.round(p.calories * servings),
    protein: Math.round(p.protein * servings * 10) / 10,
    carbs: Math.round(p.carbs * servings * 10) / 10,
    fat: Math.round(p.fat * servings * 10) / 10,
  };

  function confirm() {
    const today = new Date();
    const [hours, minutes] = mealTime.split(":").map(Number);
    today.setHours(hours, minutes, 0, 0);
    const timestamp = today.toISOString();
    if (p.foodId) {
      logFood.mutate(
        { foodId: p.foodId, servings, mealSlot: selectedSlot, timestamp },
        {
          onSuccess: () => {
            setModal(null);
            useApp.getState().setQuickLogPayload(null);
          },
        }
      );
    } else {
      logFood.mutate(
        {
          manualFood: {
            name: p.name,
            servingSize: p.servingSize ?? "1 serving",
            servingWeightGrams: p.servingWeightGrams ?? 100,
            calories: p.calories,
            protein: p.protein,
            carbs: p.carbs,
            fat: p.fat,
            emoji: p.emoji ?? "🍽️",
          },
          servings,
          mealSlot: selectedSlot,
          timestamp,
        },
        {
          onSuccess: () => {
            setModal(null);
            useApp.getState().setQuickLogPayload(null);
          },
        }
      );
    }
  }

  function close() {
    setModal(null);
    useApp.getState().setQuickLogPayload(null);
  }

  const slotOptions = [
    { key: "breakfast", emoji: "🌅", label: t("breakfast") },
    { key: "lunch", emoji: "☀️", label: t("lunch") },
    { key: "dinner", emoji: "🌙", label: t("dinner") },
    { key: "snack", emoji: "🍿", label: t("snacks") },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">{t("logFood")}</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        {/* Food hero card */}
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-ios">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-secondary text-3xl">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} className="h-16 w-16 object-cover" />
            ) : (
              <span>{p.emoji ?? "🍽️"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-lg font-bold leading-tight">{translateFoodName(p.name, locale)}</h3>
            <p className="text-xs text-muted-foreground">{p.servingSize ?? "1 serving"}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-0.5 text-streak">
                <Flame className="h-3 w-3" /> {formatNumber(p.calories, locale)} {t("cal")}
              </span>
              <span className="flex items-center gap-0.5 text-protein">
                <Drumstick className="h-3 w-3" /> {formatNumber(Math.round(p.protein), locale)}g
              </span>
            </div>
          </div>
        </div>

        {/* Servings stepper */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("servings")}</p>
          <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-ios">
            <button
              onClick={() => setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 10) / 10))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg font-bold"
            >
              −
            </button>
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{formatNumber(servings, locale)}</div>
              <div className="text-[10px] text-muted-foreground">{t("servings")}</div>
            </div>
            <button
              onClick={() => setServings((s) => Math.round((s + 0.5) * 10) / 10)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick serving presets */}
        <div className="mt-2 flex gap-2">
          {[0.5, 1, 1.5, 2, 3].map((preset) => (
            <button
              key={preset}
              onClick={() => setServings(preset)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                servings === preset ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
              )}
            >
              {formatNumber(preset, locale)}×
            </button>
          ))}
        </div>

        {/* Meal slot selector */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("mealSlot")}</p>
          <div className="grid grid-cols-4 gap-2">
            {slotOptions.map((slot) => (
              <button
                key={slot.key}
                onClick={() => setSelectedSlot(slot.key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 transition-colors",
                  selectedSlot === slot.key ? "border-foreground bg-card" : "border-border bg-card text-muted-foreground"
                )}
              >
                <span className="text-lg">{slot.emoji}</span>
                <span className="text-[10px] font-medium">{slot.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time picker */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("time")}</p>
          <div className="flex items-center gap-2 rounded-2xl bg-card p-4 shadow-ios">
            <input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="flex-1 bg-transparent text-lg font-semibold tabular-nums outline-none"
            />
            <span className="text-xs text-muted-foreground">{t("today")}</span>
          </div>
        </div>

        {/* Scaled macros preview */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("scaledMacros")}</p>
          <div className="grid grid-cols-2 gap-3">
            <MacroBox label={t("calories")} value={scaledMacros.calories} unit="" icon="🔥" color="text-streak" />
            <MacroBox label={t("carbs")} value={scaledMacros.carbs} unit="g" icon="🌾" color="text-carbs" />
            <MacroBox label={t("protein")} value={scaledMacros.protein} unit="g" icon="🍗" color="text-protein" />
            <MacroBox label={t("fats")} value={scaledMacros.fat} unit="g" icon="💧" color="text-fats" />
          </div>
        </div>
      </div>

      {/* Footer with confirm button */}
      <div className="border-t border-border bg-card px-4 py-3 pb-safe">
        <Button
          className="w-full rounded-full py-3"
          size="lg"
          disabled={logFood.isPending}
          onClick={confirm}
        >
          {logFood.isPending ? (
            t("saving")
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {t("logThisFood")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function MacroBox({ label, value, unit, icon, color }: { label: string; value: number; unit: string; icon: string; color: string }) {
  const { locale } = useI18n();
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{icon}</span>
        {label}
      </div>
      <div className={cn("mt-0.5 text-xl font-bold tabular-nums", color)}>
        {formatNumber(value, locale)}
        <span className="text-xs font-medium text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
