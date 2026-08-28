"use client";
import { Star, Plus, Flame } from "lucide-react";
import { useFavorites } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";
import { translateFoodName } from "@/lib/food-translations";

export function FavoritesQuickAdd() {
  const { data: favorites, isLoading } = useFavorites();
  const { setModal, setQuickLogPayload } = useApp();
  const { locale, t } = useI18n();

  if (isLoading) return null;

  if (!favorites || favorites.length === 0) {
    return null; // don't show section if no favorites yet
  }

  function openQuickLog(fav: { id: string; name: string; foodId: string | null; calories: number; protein: number; carbs: number; fat: number; servingSize: string | null }) {
    setQuickLogPayload({
      foodId: fav.foodId ?? undefined,
      name: fav.name,
      emoji: "⭐",
      calories: fav.calories,
      protein: fav.protein,
      carbs: fav.carbs,
      fat: fav.fat,
      servingSize: fav.servingSize ?? "1 serving",
      servingWeightGrams: 100,
    });
    setModal("quick-log");
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-1.5 text-base font-semibold">
          <Star className="h-4 w-4 text-streak" fill="currentColor" />
          {t("quickAdd")}
        </h3>
        <button onClick={() => setModal("favorites")} className="text-xs font-medium text-muted-foreground">
          {t("seeAll")}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {favorites.slice(0, 10).map((fav, i) => (
          <motion.button
            key={fav.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openQuickLog(fav)}
            className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-ios"
            style={{ minWidth: 80 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
              ⭐
            </div>
            <div className="max-w-[72px] truncate text-xs font-medium">{translateFoodName(fav.name, locale)}</div>
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Flame className="h-2.5 w-2.5 text-streak" />
              {formatNumber(Math.round(fav.calories), locale)}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
