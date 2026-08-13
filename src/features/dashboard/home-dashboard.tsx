"use client";
import { Flame, Footprints, Dumbbell, Minus, Plus, Droplets, Wheat, Drumstick } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import { useDashboard, useLogWater } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function MacroCard({
  label,
  value,
  goal,
  unit,
  color,
  icon: Icon,
  over,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  icon: typeof Wheat;
  over?: boolean;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 shadow-ios">
      <ProgressRing value={pct} size={52} strokeWidth={5} color={color}>
        <Icon className="h-5 w-5" style={{ color }} />
      </ProgressRing>
      <div className="text-center">
        <div className="text-base font-bold leading-tight tabular-nums">
          {value}
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {label} {over && value > goal ? <span className="text-destructive">over</span> : "left"}
        </div>
      </div>
    </div>
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
        <div key={i} className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">{d.letter}</span>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors",
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
        </div>
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
          {steps.toLocaleString()}
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
        <span className="text-lg font-bold tabular-nums">{burned}</span>
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
    <div className="rounded-2xl bg-card p-4 shadow-ios">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-water/15">
          <Droplets className="h-6 w-6 text-water" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Water</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {flOz} fl oz ({cups} cups)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Remove water"
            onClick={() => logWater.mutate(-250)}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground text-foreground transition-transform active:scale-90"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            aria-label="Add water"
            onClick={() => logWater.mutate(250)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-90"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: Math.ceil(goalMl / 250) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              i < cups ? "bg-water" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
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
}

function LogRow({ log }: { log: DashboardLog }) {
  const time = new Date(log.timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  if (log.type === "water") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-ios">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-water/15">
          <Droplets className="h-5 w-5 text-water" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Water</div>
          <div className="text-xs text-muted-foreground">+{log.waterMl} ml</div>
        </div>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    );
  }
  if (log.type === "workout" && log.workoutSummary) {
    const w = log.workoutSummary;
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-ios">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{log.title ?? w.type}</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-streak" /> {w.caloriesBurned} cal
            </span>
            <span>{w.durationMinutes} min</span>
            <span className="capitalize">{w.intensity}</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    );
  }
  const m = log.macros;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-ios">
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
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-streak" /> {m.calories}
              </span>
              <span className="flex items-center gap-1 text-protein">
                <Drumstick className="h-3 w-3" /> {m.protein}g
              </span>
              <span className="flex items-center gap-1 text-carbs">
                <Wheat className="h-3 w-3" /> {m.carbs}g
              </span>
              <span className="flex items-center gap-1 text-fats">
                <Droplets className="h-3 w-3" /> {m.fat}g
              </span>
            </>
          )}
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
        {time}
      </span>
    </div>
  );
}

function RecentFeed() {
  const { data } = useDashboard();
  const logs = data?.dayLogs ?? [];
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-6 text-center shadow-ios">
        <p className="text-sm text-muted-foreground">No logs yet today.</p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">Tap + to scan or add food.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <LogRow key={log.id} log={log} />
      ))}
    </div>
  );
}

export function HomeDashboard() {
  const { data, isLoading } = useDashboard();
  const { setModal } = useApp();

  if (isLoading || !data) {
    return (
      <div className="space-y-4 px-4 py-2">
        <div className="h-40 animate-pulse rounded-3xl bg-card" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  const goals = data.user.goals;
  const consumed = data.consumed;
  const left = Math.max(0, goals.calories - consumed.calories);
  const pct = goals.calories > 0 ? (consumed.calories / goals.calories) * 100 : 0;

  const proteinLeft = Math.max(0, goals.protein - consumed.protein);
  const carbsLeft = Math.max(0, goals.carbs - consumed.carbs);
  const fatLeft = Math.max(0, goals.fat - consumed.fat);

  return (
    <div className="space-y-4 px-4 pb-4">
      <div className="flex items-center gap-2">
        <button className="rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold">
          Today
        </button>
        <button className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground">
          Yesterday
        </button>
      </div>

      <div className="flex items-center justify-between rounded-3xl bg-card p-5 shadow-ios">
        <div>
          <div className="text-5xl font-bold tabular-nums tracking-tight">{left}</div>
          <div className="text-sm text-muted-foreground">Calories left</div>
          <div className="mt-2 text-xs text-muted-foreground">
            {consumed.calories} eaten · {data.burned} burned
          </div>
        </div>
        <ProgressRing value={pct} size={96} strokeWidth={10} color="var(--streak)">
          <div className="flex flex-col items-center">
            <Flame className="h-5 w-5 text-streak" fill="currentColor" />
            <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
              {Math.round(pct)}%
            </span>
          </div>
        </ProgressRing>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MacroCard label="Protein" value={proteinLeft} goal={goals.protein} unit="g" color="var(--protein)" icon={Drumstick} />
        <MacroCard label="Carbs" value={carbsLeft} goal={goals.carbs} unit="g" color="var(--carbs)" icon={Wheat} />
        <MacroCard label="Fats" value={fatLeft} goal={goals.fat} unit="g" color="var(--fats)" icon={Droplets} />
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-ios">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Weekly habit</h3>
          <span className="text-xs text-muted-foreground">{data.daysLogged}/7 days</span>
        </div>
        <WeekStrip />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StepsCard />
        <CaloriesBurnedCard />
      </div>

      <WaterCard />

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
