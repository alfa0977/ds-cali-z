"use client";
import { X, Star, Trash2, Plus, Flame, Drumstick, Wheat, Droplets } from "lucide-react";
import { useApp } from "@/lib/store";
import { useFavorites, useRemoveFavorite, useLogFood } from "@/lib/hooks";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function FavoritesSheet() {
  const { setModal } = useApp();
  const { data: favorites, isLoading } = useFavorites();
  const removeFav = useRemoveFavorite();
  const logFood = useLogFood();

  function quickLog(fav: { id: string; name: string; foodId: string | null; calories: number; protein: number; carbs: number; fat: number }) {
    if (fav.foodId) {
      logFood.mutate({ foodId: fav.foodId, servings: 1 });
    } else {
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
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <Star className="h-4 w-4 text-streak" fill="currentColor" />
          Favorites
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (!favorites || favorites.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 text-5xl">⭐</div>
            <p className="text-sm font-medium">No favorites yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap the star on any meal to save it here for quick logging.</p>
          </div>
        )}
        {favorites && favorites.length > 0 && (
          <div className="space-y-2">
            {favorites.map((fav, i) => (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-ios"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-xl">
                  {fav.emoji ?? "⭐"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold">{fav.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-streak" />{Math.round(fav.calories)}</span>
                    <span className="flex items-center gap-0.5 text-protein"><Drumstick className="h-3 w-3" />{Math.round(fav.protein)}g</span>
                    <span className="flex items-center gap-0.5 text-carbs"><Wheat className="h-3 w-3" />{Math.round(fav.carbs)}g</span>
                    <span className="flex items-center gap-0.5 text-fats"><Droplets className="h-3 w-3" />{Math.round(fav.fat)}g</span>
                  </div>
                </div>
                <button
                  onClick={() => quickLog(fav)}
                  disabled={logFood.isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-90 disabled:opacity-50"
                  aria-label="Quick log"
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => removeFav.mutate(fav.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-transform active:scale-90"
                  aria-label="Remove favorite"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
