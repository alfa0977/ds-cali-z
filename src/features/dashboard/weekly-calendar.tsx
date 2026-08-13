"use client";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useState } from "react";
import { useDashboard } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { TapCard } from "@/components/motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeeklyCalendar() {
  const { data } = useDashboard();
  const { selectedDate, setSelectedDate } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);

  if (!data) return null;

  // Get the start of the current week (Sunday)
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);

  const days: Array<{ date: string; dayNum: number; isToday: boolean; isFuture: boolean; isPast: boolean }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      dayNum: d.getDate(),
      isToday: key === todayKey,
      isFuture: d > today,
      isPast: d < today && key !== todayKey,
    });
  }

  // Build calorie map from macroTrend
  const calMap: Record<string, number> = {};
  if (data.macroTrend) {
    for (const t of data.macroTrend) {
      calMap[t.date] = t.calories;
    }
  }
  const goal = data.user.goals.calories;

  return (
    <TapCard className="card-premium rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">This week</h3>
          <p className="text-[10px] text-muted-foreground">
            {weekStart.toLocaleDateString([], { month: "short", day: "numeric" })} —{" "}
            {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString([], { month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setWeekOffset((w) => w - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
            disabled={weekOffset >= 0}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const cals = calMap[d.date] ?? 0;
          const isSelected = d.date === selectedDate;
          const hasData = cals > 0;
          const pct = goal > 0 ? Math.min(100, (cals / goal) * 100) : 0;
          return (
            <motion.button
              key={d.date}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => !d.isFuture && setSelectedDate(d.date)}
              disabled={d.isFuture}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                isSelected ? "bg-foreground text-background" : d.isFuture ? "opacity-30" : "hover:bg-secondary/50"
              )}
            >
              <span className="text-[9px] font-medium opacity-70">{WEEKDAYS[i][0]}</span>
              <span className={cn("text-sm font-bold tabular-nums", d.isToday && !isSelected && "text-streak")}>
                {d.dayNum}
              </span>
              {/* calorie indicator dot */}
              {hasData && (
                <div className="absolute bottom-1 flex items-center gap-0.5">
                  <Flame className="h-2 w-2" style={{ color: isSelected ? "currentColor" : "var(--streak)" }} />
                </div>
              )}
              {/* mini progress ring under day number */}
              {hasData && (
                <div className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full" style={{
                  backgroundColor: pct > 100 ? "var(--destructive)" : "var(--success)",
                }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* selected day summary */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {selectedDate === todayKey ? "Today" : new Date(selectedDate + "T00:00:00").toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </span>
        <span className="text-xs font-semibold tabular-nums">
          {calMap[selectedDate] ? `${calMap[selectedDate]} cal` : "No logs"}
        </span>
      </div>
    </TapCard>
  );
}
