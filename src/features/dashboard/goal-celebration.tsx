"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/lib/hooks";

interface Celebration {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

export function GoalCelebration() {
  const { data } = useDashboard();
  const [active, setActive] = useState<Celebration | null>(null);
  const [shown, setShown] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    const goals = data.user.goals;
    const consumed = data.consumed;
    const water = data.todayHealth?.waterMl ?? 0;
    const steps = data.todayHealth?.steps ?? 0;

    const possible: Celebration[] = [];

    // Protein goal hit
    if (consumed.protein >= goals.protein && !shown.has("protein")) {
      possible.push({
        id: "protein",
        emoji: "💪",
        title: "Protein goal smashed!",
        desc: `You hit ${Math.round(consumed.protein)}g of protein today.`,
      });
    }

    // Water goal hit
    if (water >= 2500 && !shown.has("water")) {
      possible.push({
        id: "water",
        emoji: "💧",
        title: "Hydration goal met!",
        desc: `You drank ${(water / 1000).toFixed(1)}L of water today.`,
      });
    }

    // 10K steps
    if (steps >= 10000 && !shown.has("steps")) {
      possible.push({
        id: "steps",
        emoji: "🚶",
        title: "10K steps crushed!",
        desc: `You walked ${steps.toLocaleString()} steps today.`,
      });
    }

    // Calorie goal on track (80-100%)
    const calPct = (consumed.calories / goals.calories) * 100;
    if (calPct >= 80 && calPct <= 100 && !shown.has("calories")) {
      possible.push({
        id: "calories",
        emoji: "🎯",
        title: "Right on track!",
        desc: `You're ${Math.round(calPct)}% to your calorie goal.`,
      });
    }

    if (possible.length > 0) {
      const next = possible[0];
      // Use setTimeout to defer setState outside the effect body
      const t1 = setTimeout(() => {
        setActive(next);
        setShown((prev) => new Set(prev).add(next.id));
      }, 100);
      const t2 = setTimeout(() => setActive(null), 4100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [data, shown]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed left-1/2 top-20 z-[60] -translate-x-1/2"
        >
          <div className="glass card-premium flex items-center gap-3 rounded-2xl px-5 py-3 shadow-fab">
            <motion.div
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-4xl"
            >
              {active.emoji}
            </motion.div>
            <div>
              <div className="text-sm font-bold">{active.title}</div>
              <div className="text-xs text-muted-foreground">{active.desc}</div>
            </div>
            {/* Confetti dots */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  backgroundColor: ["var(--streak)", "var(--success)", "var(--protein)", "var(--carbs)", "var(--fats)", "var(--water)"][i],
                  top: "50%",
                  left: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.cos((i / 6) * Math.PI * 2) * 60),
                  y: (Math.sin((i / 6) * Math.PI * 2) * 60),
                  opacity: 0,
                }}
                transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
