"use client";
import { Clock, Plus, Flame } from "lucide-react";
import { useDashboard, useLogFood } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function RecentsSection() {
  const { data } = useDashboard();
  const logFood = useLogFood();

  if (!data) return null;

  // Get unique meal titles from recent logs (last 7 days)
  const seen = new Set<string>();
  const recents = data.recentLogs
    .filter((l) => l.type === "meal" && l.title)
    .filter((l) => {
      const key = l.title!;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);

  if (recents.length === 0) return null;

  function quickLog(item: { title: string | null; macros: { calories: number; protein: number; carbs: number; fat: number } | null }) {
    if (!item.macros) return;
    logFood.mutate({
      manualFood: {
        name: item.title!,
        calories: item.macros.calories,
        protein: item.macros.protein,
        carbs: item.macros.carbs,
        fat: item.macros.fat,
        servingSize: "1 serving",
        servingWeightGrams: 100,
        emoji: "🔄",
      },
    });
    toast.success(`${item.title} logged`);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold">Recent foods</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {recents.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => quickLog(item)}
            disabled={logFood.isPending}
            className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-ios"
            style={{ minWidth: 80 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                "🔄"
              )}
            </div>
            <div className="max-w-[72px] truncate text-xs font-medium">{item.title}</div>
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Flame className="h-2.5 w-2.5 text-streak" />
              {item.macros?.calories ?? 0}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
