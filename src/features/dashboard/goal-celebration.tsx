"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";

interface Celebration {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

function tpl(key: string, ...vals: (string | number)[]): string {
  let out = key;
  vals.forEach((v, i) => {
    out = out.replace(`{${i}}`, String(v));
  });
  return out;
}

const AUTO_DISMISS_MS = 4000;

export function GoalCelebration() {
  const { data } = useDashboard();
  const { locale, t } = useI18n();
  const [active, setActive] = useState<Celebration | null>(null);
  // Use a ref for the "shown" set so that effect re-runs (caused by query refetches)
  // do NOT clear the dismiss timer. The dismiss timer is owned by a separate effect.
  const shownRef = useRef<Set<string>>(new Set());
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effect 1: Detect new celebrations and SHOW them.
  // This effect re-runs whenever `data` changes (query refetch), but it only
  // triggers a new celebration if the id hasn't been shown yet.
  useEffect(() => {
    if (!data) return;
    const goals = data.user.goals;
    const consumed = data.consumed;
    const water = data.todayHealth?.waterMl ?? 0;
    const steps = data.todayHealth?.steps ?? 0;

    const possible: Celebration[] = [];

    if (consumed.protein >= goals.protein && !shownRef.current.has("protein")) {
      possible.push({
        id: "protein",
        emoji: "💪",
        title: t("proteinGoalSmashed"),
        desc: tpl(t("proteinGoalSmashedDesc"), formatNumber(Math.round(consumed.protein), locale)),
      });
    }

    if (water >= 2500 && !shownRef.current.has("water")) {
      possible.push({
        id: "water",
        emoji: "💧",
        title: t("hydrationGoalMet"),
        desc: tpl(t("hydrationGoalMetDesc"), formatNumber((water / 1000).toFixed(1), locale)),
      });
    }

    if (steps >= 10000 && !shownRef.current.has("steps")) {
      possible.push({
        id: "steps",
        emoji: "🚶",
        title: t("stepsCrushed"),
        desc: tpl(t("stepsCrushedGoalDesc"), formatNumber(steps, locale)),
      });
    }

    const calPct = (consumed.calories / goals.calories) * 100;
    if (calPct >= 80 && calPct <= 100 && !shownRef.current.has("calories")) {
      possible.push({
        id: "calories",
        emoji: "🎯",
        title: t("rightOnTrack"),
        desc: tpl(t("rightOnTrackGoalDesc"), formatNumber(Math.round(calPct), locale)),
      });
    }

    if (possible.length > 0) {
      const next = possible[0];
      // Mark as shown immediately so a refetch doesn't re-trigger it.
      shownRef.current.add(next.id);
      // Defer setActive to avoid calling setState synchronously within the effect body.
      setTimeout(() => setActive(next), 0);
    }
  }, [data, locale, t]);

  // Effect 2: Auto-dismiss the active celebration after AUTO_DISMISS_MS.
  // This effect ONLY depends on `active` — it does NOT depend on `data`,
  // so query refetches will NOT cancel the dismiss timer.
  useEffect(() => {
    if (!active) return;
    dismissTimerRef.current = setTimeout(() => {
      setActive(null);
    }, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [active]);

  // Allow tapping the celebration to dismiss it early.
  function dismiss() {
    setActive(null);
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={dismiss}
          className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 cursor-pointer"
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
