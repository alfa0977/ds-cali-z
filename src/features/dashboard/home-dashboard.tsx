"use client";
import { Flame, Footprints, Dumbbell, Minus, Plus, Droplets, Wheat, Drumstick, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import { AnimatedNumber } from "@/components/animated-number";
import { TapCard, StaggerList, StaggerItem } from "@/components/motion";
import { useDashboard, useLogWater } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { FavoritesQuickAdd } from "@/features/dashboard/favorites-quick-add";
import { NutritionInsights } from "@/features/dashboard/nutrition-insights";
import { MacroRatioCard } from "@/features/dashboard/macro-ratio-card";
import { WeeklyCalendar } from "@/features/dashboard/weekly-calendar";
import { RecentsSection } from "@/features/dashboard/recents-section";
import { NutritionTimeline } from "@/features/dashboard/nutrition-timeline";
import { MealSuggestions } from "@/features/dashboard/meal-suggestions";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function MacroCard({
  label, value, goal, unit, color, icon: Icon, index,
}: {
  label: string; value: number; goal: number; unit: string; color: string; icon: typeof Wheat; index: number;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <StaggerItem>
      <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 shadow-ios">
        <ProgressRing value={pct} size={52} strokeWidth={5} color={color}>
          <Icon className="h-5 w-5" style={{ color }} />
        </ProgressRing>
        <div className="text-center">
          <div className="text-base font-bold leading-tight tabular-nums">
            <AnimatedNumber value={value} />
            <span className="text-xs font-medium text-muted-foreground">{unit}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{label} left</div>
        </div>
      </div>
    </StaggerItem>
  );
}

function WeekStrip() {
  const { data } = useDashboard();
  const week = data?.weekHealth ?? [];
  const today = new Date();
  const days: Array<{ letter: string; date: string; logged: boolean; isToday: boolean; isFuture: boolean }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    const key = d.toISOString().slice(0, 10);
    const h = week.find((x) => x.date === key);
    days.push({
      letter: WEEKDAYS[i],
      date: key,
      logged: !!(h && (h.steps > 0 || h.waterMl > 0)),
      isToday: key === today.toISOString().slice(0, 10),
      isFuture: d > today,
    });
  }
  return (
    <div className="flex items-center justify-between px-1">
      {days.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="text-[11px] font-medium text-muted-foreground">{d.letter}</span>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors",
              d.isToday
                ? "border-foreground bg-foreground text-background"
                : d.logged
                ? "border-success text-success"
                : d.isFuture
                ? "border-muted text-muted-foreground/40"
                : "border-muted text-muted-foreground"
            )}
          >
            {d.logged && !d.isToday ? "✓" : new Date(d.date + "T00:00:00").getDate()}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StepsCard() {
  const { data } = useDashboard();
  const steps = data?.todayHealth?.steps ?? 0;
  const goal = 10000;
  const pct = Math.min(100, (steps / goal) * 100);
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-ios">
      <ProgressRing value={pct} size={76} strokeWidth={8} color="var(--foreground)">
        <Footprints className="h-7 w-7" />
      </ProgressRing>
      <div className="text-center">
        <div className="text-lg font-bold tabular-nums">
          <AnimatedNumber value={steps} />
          <span className="text-xs font-normal text-muted-foreground">/{goal.toLocaleString()}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">Steps today</div>
      </div>
    </div>
  );
}

function CaloriesBurnedCard() {
  const { data } = useDashboard();
  const burned = data?.burned ?? 0;
  const stepsCal = Math.min(burned, Math.round((data?.todayHealth?.steps ?? 0) * 0.035));
  const workoutCal = burned - stepsCal;
  return (
    <div className="flex flex-col rounded-2xl bg-card p-4 shadow-ios">
      <div className="flex items-center gap-1.5">
        <Flame className="h-4 w-4 text-streak" fill="currentColor" />
        <span className="text-lg font-bold tabular-nums">
          <AnimatedNumber value={burned} />
        </span>
      </div>
      <div className="mb-2 text-[11px] text-muted-foreground">Calories burned</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
              <Footprints className="h-3 w-3" />
            </span>
            Steps
          </span>
          <span className="font-semibold tabular-nums">+{stepsCal}</span>
        </div>
        {workoutCal > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                <Dumbbell className="h-3 w-3" />
              </span>
              Workout
            </span>
            <span className="font-semibold tabular-nums">+{workoutCal}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function WaterCard() {
  const { data } = useDashboard();
  const waterMl = data?.todayHealth?.waterMl ?? 0;
  const goalMl = 2500;
  const cups = Math.floor(waterMl / 250);
  const flOz = Math.round((waterMl / 29.574) * 10) / 10;
  const logWater = useLogWater();
  return (
    <TapCard className="rounded-2xl bg-card p-4 shadow-ios">
      <div className="flex items-center gap-3">
        <motion.div
          whileTap={{ scale: 0.9 }}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-water/15"
        >
          <Droplets className="h-6 w-6 text-water" />
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Water</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {flOz} fl oz ({cups} cups)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            aria-label="Remove water"
            onClick={() => logWater.mutate(-250)}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground text-foreground"
          >
            <Minus className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            aria-label="Add water"
            onClick={() => logWater.mutate(250)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: Math.ceil(goalMl / 250) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              i < cups ? "bg-water" : "bg-muted"
            )}
          />
        ))}
      </div>
    </TapCard>
  );
}

interface DashboardLog {
  id: string;
  type: string;
  title: string | null;
  macros: { calories: number; protein: number; carbs: number; fat: number } | null;
  waterMl: number | null;
  workoutSummary: {
    type: string;
    durationMinutes: number;
    intensity: string;
    caloriesBurned: number;
  } | null;
  imageUrl: string | null;
  timestamp: string;
  mealId: string | null;
}

function LogRow({ log, index }: { log: DashboardLog; index: number }) {
  const { setModal, setEditingLog } = useApp();
  const time = new Date(log.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  function openDetail() {
    if (log.type === "water") return;
    setEditingLog({
      id: log.id,
      type: log.type,
      title: log.title,
      macros: log.macros,
      mealId: log.mealId,
    });
    // Meals open meal-detail; workouts open edit-log
    setModal(log.type === "meal" && log.mealId ? "meal-detail" : "edit-log");
  }

  const content = (() => {
    if (log.type === "water") {
      return (
        <>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-water/15">
            <Droplets className="h-5 w-5 text-water" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Water</div>
            <div className="text-xs text-muted-foreground">+{log.waterMl} ml</div>
          </div>
        </>
      );
    }
    if (log.type === "workout" && log.workoutSummary) {
      const w = log.workoutSummary;
      return (
        <>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{log.title ?? w.type}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-streak" /> {w.caloriesBurned} cal</span>
              <span>{w.durationMinutes} min</span>
              <span className="capitalize">{w.intensity}</span>
            </div>
          </div>
        </>
      );
    }
    const m = log.macros;
    return (
      <>
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-secondary text-lg">
          {log.imageUrl ? (
            <img src={log.imageUrl} alt="" className="h-11 w-11 object-cover" />
          ) : (
            "🍽️"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-semibold">{log.title ?? "Meal"}</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {m && (
              <>
                <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-streak" /> {m.calories}</span>
                <span className="flex items-center gap-1 text-protein"><Drumstick className="h-3 w-3" /> {m.protein}g</span>
                <span className="flex items-center gap-1 text-carbs"><Wheat className="h-3 w-3" /> {m.carbs}g</span>
                <span className="flex items-center gap-1 text-fats"><Droplets className="h-3 w-3" /> {m.fat}g</span>
              </>
            )}
          </div>
        </div>
      </>
    );
  })();

  return (
    <StaggerItem>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={openDetail}
        className="flex cursor-pointer items-center gap-3 rounded-2xl bg-card p-3 shadow-ios active:bg-secondary/50"
      >
        {content}
        <div className="flex items-center gap-2">
          {log.type !== "water" && <Pencil className="h-3.5 w-3.5 text-muted-foreground/60" />}
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{time}</span>
        </div>
      </motion.div>
    </StaggerItem>
  );
}

function RecentFeed() {
  const { data } = useDashboard();
  const logs = data?.dayLogs ?? [];
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center shadow-ios">
        <div className="mb-2 text-4xl">🍽️</div>
        <p className="text-sm font-medium text-foreground">No logs yet today</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Tap the + button to scan a meal or add food.</p>
      </div>
    );
  }
  return (
    <StaggerList className="space-y-2">
      {logs.map((log, i) => (
        <LogRow key={log.id} log={log} index={i} />
      ))}
    </StaggerList>
  );
}

// NEW: Meal categorization (breakfast/lunch/dinner/snacks)
const MEAL_SLOTS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snacks", emoji: "🍿" },
] as const;

function MealsBySlot() {
  const { data } = useDashboard();
  const { setModal, setEditingLog } = useApp();
  const mealsBySlot = data?.mealsBySlot;
  if (!mealsBySlot) return null;

  function openMealDetail(m: { id: string; type: string; title: string | null; macros: { calories: number; protein: number; carbs: number; fat: number } | null; mealId: string | null; timestamp: string }) {
    if (m.type === "meal" && m.mealId) {
      setEditingLog({
        id: m.id,
        type: m.type,
        title: m.title,
        macros: m.macros,
        mealId: m.mealId,
      });
      setModal("meal-detail");
    }
  }

  return (
    <div className="space-y-3">
      {MEAL_SLOTS.map((slot) => {
        const meals = mealsBySlot[slot.key as keyof typeof mealsBySlot] ?? [];
        const slotCalories = meals.reduce((sum, m) => sum + (m.macros?.calories ?? 0), 0);
        return (
          <TapCard key={slot.key} className="rounded-2xl bg-card p-4 shadow-ios">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{slot.emoji}</span>
                <h3 className="text-sm font-semibold">{slot.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {slotCalories > 0 ? `${slotCalories} cal` : "—"}
                </span>
                <button
                  onClick={() => setModal("add-action")}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Add to ${slot.label}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            {meals.length > 0 ? (
              <div className="space-y-1.5">
                {meals.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => openMealDetail(m)}
                    className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-secondary text-sm">
                      {m.imageUrl ? <img src={m.imageUrl} alt="" className="h-8 w-8 object-cover" /> : "🍽️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-medium">{m.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.macros && (
                          <>
                            <span className="text-streak">{m.macros.calories} cal</span>
                            <span className="mx-1">·</span>
                            <span className="text-protein">P{Math.round(m.macros.protein)}</span>
                            <span className="mx-0.5">·</span>
                            <span className="text-carbs">C{Math.round(m.macros.carbs)}</span>
                            <span className="mx-0.5">·</span>
                            <span className="text-fats">F{Math.round(m.macros.fat)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-1 text-xs text-muted-foreground/60">Nothing logged yet</p>
            )}
          </TapCard>
        );
      })}
    </div>
  );
}

// NEW: Consumed vs goal macro bars
function MacroProgressBars() {
  const { data } = useDashboard();
  if (!data) return null;
  const goals = data.user.goals;
  const consumed = data.consumed;
  const macros = [
    { label: "Calories", consumed: consumed.calories, goal: goals.calories, unit: "", color: "var(--streak)", icon: Flame },
    { label: "Protein", consumed: consumed.protein, goal: goals.protein, unit: "g", color: "var(--protein)", icon: Drumstick },
    { label: "Carbs", consumed: consumed.carbs, goal: goals.carbs, unit: "g", color: "var(--carbs)", icon: Wheat },
    { label: "Fats", consumed: consumed.fat, goal: goals.fat, unit: "g", color: "var(--fats)", icon: Droplets },
  ];
  return (
    <TapCard className="rounded-2xl bg-card p-4 shadow-ios">
      <h3 className="mb-3 text-sm font-semibold">Today's intake</h3>
      <div className="space-y-3">
        {macros.map((m, i) => {
          const pct = m.goal > 0 ? Math.min(100, (m.consumed / m.goal) * 100) : 0;
          const over = m.consumed > m.goal;
          return (
            <div key={m.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                  {m.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{Math.round(m.consumed)}{m.unit}</span>
                  {" / "}
                  {m.goal}{m.unit}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: over ? "var(--destructive)" : m.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </TapCard>
  );
}

function DateNav() {
  const { selectedDate, setSelectedDate } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const isYesterday = selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const label = isToday ? "Today" : isYesterday ? "Yesterday" : new Date(selectedDate + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" });

  function shift(days: number) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    const key = d.toISOString().slice(0, 10);
    if (key <= today) setSelectedDate(key);
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => shift(-1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
        <ChevronLeft className="h-4 w-4" />
      </motion.button>
      <div className="min-w-24 text-center">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-[10px] text-muted-foreground">{new Date(selectedDate + "T00:00:00").toLocaleDateString([], { weekday: "long" })}</div>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => shift(1)}
        disabled={isToday}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
}

export function HomeDashboard() {
  const { selectedDate, setModal } = useApp();
  const { data, isLoading } = useDashboard(selectedDate);

  if (isLoading || !data) {
    return (
      <div className="space-y-4 px-4 py-2">
        <div className="h-8 animate-pulse rounded-full bg-card" />
        <div className="h-40 animate-pulse rounded-3xl bg-card" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />)}
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  const goals = data.user.goals;
  const consumed = data.consumed;
  const left = Math.max(0, goals.calories - consumed.calories);
  const pct = goals.calories > 0 ? (consumed.calories / goals.calories) * 100 : 0;

  return (
    <div className="space-y-4 px-4 pb-4">
      <DateNav />

      {/* Calories hero card — premium styling */}
      <TapCard className="card-premium rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold tabular-nums tracking-tight leading-none">
              <AnimatedNumber value={left} />
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">Calories left</div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">
                <span className="text-foreground">{consumed.calories}</span>
                <span className="text-muted-foreground"> eaten</span>
              </span>
              <span className="rounded-full bg-streak/10 px-2 py-0.5 font-medium text-streak">
                {data.burned} burned
              </span>
            </div>
          </div>
          <ProgressRing value={pct} size={96} strokeWidth={10} color="var(--streak)">
            <div className="flex flex-col items-center">
              <Flame className="h-5 w-5 text-streak" fill="currentColor" />
              <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">{Math.round(pct)}%</span>
            </div>
          </ProgressRing>
        </div>
        {/* progress bar under hero — rounded caps + gradient */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "h-full rounded-full",
              pct > 100
                ? "bg-gradient-to-r from-destructive to-red-400"
                : "bg-gradient-to-r from-streak to-amber-400"
            )}
          />
        </div>
      </TapCard>

      {/* Macro triplet */}
      <StaggerList className="grid grid-cols-3 gap-2">
        <MacroCard label="Protein" value={Math.max(0, goals.protein - consumed.protein)} goal={goals.protein} unit="g" color="var(--protein)" icon={Drumstick} index={0} />
        <MacroCard label="Carbs" value={Math.max(0, goals.carbs - consumed.carbs)} goal={goals.carbs} unit="g" color="var(--carbs)" icon={Wheat} index={1} />
        <MacroCard label="Fats" value={Math.max(0, goals.fat - consumed.fat)} goal={goals.fat} unit="g" color="var(--fats)" icon={Droplets} index={2} />
      </StaggerList>

      {/* NEW: Macro ratio donut chart */}
      <MacroRatioCard />

      {/* NEW: Consumed vs goal progress bars */}
      <MacroProgressBars />

      {/* NEW: Weekly calendar */}
      <WeeklyCalendar />

      {/* Weekly habit strip */}
      <TapCard className="rounded-2xl bg-card p-4 shadow-ios">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Weekly habit</h3>
          <span className="text-xs text-muted-foreground">{data.daysLogged}/7 days</span>
        </div>
        <WeekStrip />
      </TapCard>

      {/* Steps + calories burned */}
      <div className="grid grid-cols-2 gap-3">
        <StepsCard />
        <CaloriesBurnedCard />
      </div>

      {/* Water */}
      <WaterCard />

      {/* NEW: Favorites quick-add */}
      <FavoritesQuickAdd />

      {/* NEW: Recents section */}
      <RecentsSection />

      {/* NEW: Smart meal suggestions */}
      <MealSuggestions />

      {/* NEW: Meals by slot (breakfast/lunch/dinner/snacks) */}
      <div>
        <h3 className="mb-2 px-1 text-base font-semibold">Meals</h3>
        <MealsBySlot />
      </div>

      {/* NEW: Nutrition insights */}
      <NutritionInsights />

      {/* NEW: Nutrition timeline (hourly breakdown) */}
      <NutritionTimeline />

      {/* Recent feed (all logs including water/workouts) */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-base font-semibold">Recently logged</h3>
          <button onClick={() => setModal("food-db")} className="text-xs font-medium text-muted-foreground">
            See all
          </button>
        </div>
        <RecentFeed />
      </div>
    </div>
  );
}
