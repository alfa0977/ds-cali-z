"use client";
import { Dumbbell, Clock, Flame } from "lucide-react";
import { useDashboard } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";

export function WorkoutHistory() {
  const { data } = useDashboard();
  if (!data) return null;

  // Get all workout logs from recent logs
  const workouts = data.recentLogs
    .filter((l) => l.type === "workout" && l.workoutSummary)
    .slice(0, 8);

  if (workouts.length === 0) return null;

  const totalCalories = workouts.reduce((sum, w) => sum + (w.workoutSummary?.caloriesBurned ?? 0), 0);
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.workoutSummary?.durationMinutes ?? 0), 0);

  return (
    <TapCard className="card-premium rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Dumbbell className="h-4 w-4 text-protein" />
          Workout history
        </h3>
        <span className="text-xs text-muted-foreground">{workouts.length} workouts</span>
      </div>

      {/* summary stats */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-streak" />
            Calories
          </div>
          <div className="text-base font-bold tabular-nums">{totalCalories}</div>
        </div>
        <div className="rounded-xl bg-secondary/50 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Minutes
          </div>
          <div className="text-base font-bold tabular-nums">{totalMinutes}</div>
        </div>
      </div>

      {/* workout list */}
      <div className="space-y-1.5">
        {workouts.map((w, i) => {
          const summary = w.workoutSummary!;
          const date = new Date(w.timestamp);
          const isToday = date.toDateString() === new Date().toDateString();
          const timeLabel = isToday
            ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
            : date.toLocaleDateString([], { month: "short", day: "numeric" });
          const intensityColor =
            summary.intensity === "high"
              ? "var(--protein)"
              : summary.intensity === "medium"
              ? "var(--carbs)"
              : "var(--success)";
          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl bg-card p-2.5"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                style={{ backgroundColor: `color-mix(in srgb, ${intensityColor} 15%, transparent)`, color: intensityColor }}
              >
                {summary.type.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{summary.type}</div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{summary.durationMinutes} min</span>
                  <span className="capitalize" style={{ color: intensityColor }}>{summary.intensity}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-0.5 text-sm font-bold text-streak tabular-nums">
                  <Flame className="h-3 w-3" fill="currentColor" />
                  {summary.caloriesBurned}
                </div>
                <div className="text-[10px] text-muted-foreground">{timeLabel}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </TapCard>
  );
}
