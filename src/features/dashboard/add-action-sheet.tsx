"use client";
import { X, Camera, Search, Dumbbell, Barcode } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

const ACTIONS = [
  { key: "scanner", labelKey: "scanMeal", descKey: "aiPoweredFoodRecognition", icon: Camera, color: "var(--streak)" },
  { key: "barcode", labelKey: "barcodeScan", descKey: "lookUpPackagedFoods", icon: Barcode, color: "var(--water)" },
  { key: "food-db", labelKey: "searchFoods", descKey: "browseFoodDatabase", icon: Search, color: "var(--success)" },
  { key: "add-workout", labelKey: "logWorkout", descKey: "trackExercise", icon: Dumbbell, color: "var(--protein)" },
] as const;

export function AddActionSheet() {
  const { setModal } = useApp();
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col justify-end bg-black/40" onClick={() => setModal(null)}>
      <div
        className="rounded-t-3xl bg-background px-4 pb-safe pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("addToToday")}</h2>
          <button onClick={() => setModal(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 pb-4">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => setModal(a.key)}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 shadow-ios transition-transform active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${a.color} 15%, transparent)` }}>
                <a.icon className="h-5 w-5" style={{ color: a.color }} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold">{t(a.labelKey as "scanMeal")}</div>
                <div className="text-xs text-muted-foreground">{t(a.descKey as "aiPoweredFoodRecognition")}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
