"use client";
import { Star, Plus, Flame } from "lucide-react";
import { useFavorites, useLogFood } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function FavoritesQuickAdd() {
  const { data: favorites, isLoading } = useFavorites();
  const logFood = useLogFood();
  const { setModal } = useApp();

  if (isLoading) return null;

  if (!favorites || favorites.length === 0) {
    return null; // don't show section if no favorites yet
  }

  function quickLog(fav: { id: string; name: string; foodId: string | null; calories: number; protein: number; carbs: number; fat: number }) {
    if (fav.foodId) {
      logFood.mutate({ foodId: fav.foodId, servings: 1 });
    } else {
      // Log as manual food using the favorite snapshot
      logFood.mutate({
        manualFood: {
          name: fav.name,
          calories: fav.calories,
          protein: fav.protein,
          carbs: fav.carbs,
          fat: fav.fat,
          servingSize: "1 serving",
          servingWeightGrams: 100,
          emoji: "⭐",
        },
      });
    }
    toast.success(`${fav.name} logged`);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-1.5 text-base font-semibold">
          <Star className="h-4 w-4 text-streak" fill="currentColor" />
          Quick add
        </h3>
        <button onClick={() => setModal("favorites")} className="text-xs font-medium text-muted-foreground">
          See all
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
            onClick={() => quickLog(fav)}
            disabled={logFood.isPending}
            className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-ios"
            style={{ minWidth: 80 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
              ⭐
            </div>
            <div className="max-w-[72px] truncate text-xs font-medium">{fav.name}</div>
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Flame className="h-2.5 w-2.5 text-streak" />
              {Math.round(fav.calories)}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
