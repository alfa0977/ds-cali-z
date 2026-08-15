"use client";
import { Sparkles, Flame, Plus } from "lucide-react";
import { useMealSuggestions, useLogFood } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";
import { translateFoodName } from "@/lib/food-translations";

export function MealSuggestions() {
  const { data, isLoading } = useMealSuggestions("snack");
  const logFood = useLogFood();
  const { locale, t } = useI18n();

  if (isLoading || !data?.suggestions?.length) return null;

  const { suggestions } = data;
  const biggestGap = data.biggestGap;
  const gapLabel =
    biggestGap === "protein" ? t("needMoreProtein")
    : biggestGap === "carbs" ? t("needMoreCarbs")
    : t("needMoreFats");
  const gapColor = biggestGap === "protein" ? "var(--protein)" : biggestGap === "carbs" ? "var(--carbs)" : "var(--fats)";

  function log(s: { id: string; name: string; foodId?: string }) {
    logFood.mutate(
      { foodId: s.id },
      { onSuccess: () => toast.success(t("loggedToast").replace("{0}", translateFoodName(s.name, locale))) }
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-1.5 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-streak" />
          {t("smartSuggestions")}
        </h3>
        <span className="text-xs font-medium" style={{ color: gapColor }}>
          {gapLabel}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {suggestions.slice(0, 6).map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => log(s)}
            disabled={logFood.isPending}
            className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-ios"
            style={{ minWidth: 88 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
              {s.emoji ?? "🍽️"}
            </div>
            <div className="max-w-[80px] truncate text-xs font-medium">{translateFoodName(s.name, locale)}</div>
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Flame className="h-2.5 w-2.5 text-streak" />
              {formatNumber(Math.round(s.calories), locale)} {t("cal")}
            </div>
            {/* macro match indicator */}
            <div className="flex items-center gap-0.5">
              {biggestGap === "protein" && (
                <span className="rounded-full bg-protein/10 px-1 text-[9px] font-bold text-protein">
                  +{formatNumber(Math.round(s.protein), locale)}g
                </span>
              )}
              {biggestGap === "carbs" && (
                <span className="rounded-full bg-carbs/10 px-1 text-[9px] font-bold text-carbs">
                  +{formatNumber(Math.round(s.carbs), locale)}g
                </span>
              )}
              {biggestGap === "fat" && (
                <span className="rounded-full bg-fats/10 px-1 text-[9px] font-bold text-fats">
                  +{formatNumber(Math.round(s.fat), locale)}g
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
