"use client";
import { useState } from "react";
import { useDashboard } from "@/lib/hooks";
import { ProgressRing } from "@/components/progress-ring";
import { Scale, Calendar, Flag, Pencil, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const RANGES = ["90 Days", "6 Months", "1 Year", "All time"] as const;

export function ProgressDashboard() {
  const { data, isLoading } = useDashboard();
  const [range, setRange] = useState<(typeof RANGES)[number]>("90 Days");

  if (isLoading || !data) {
    return <div className="space-y-4 px-4 py-2"><div className="h-64 animate-pulse rounded-3xl bg-card" /><div className="h-48 animate-pulse rounded-2xl bg-card" /></div>;
  }

  const user = data.user;
  const lastWeight = user.weightKg ?? data.monthHealth.find((h) => h.weightKg)?.weightKg ?? 0;
  const startWeight = 90; // mock starting weight
  const goalWeight = 75;
  const goalPct = lastWeight > 0 ? Math.min(100, Math.max(0, ((startWeight - lastWeight) / (startWeight - goalWeight)) * 100)) : 0;

  // weight graph points
  const points = data.monthHealth
    .filter((h) => h.weightKg != null)
    .map((h) => ({ date: h.date, weight: h.weightKg as number }));
  // fill in mock trend if too few
  const graphData = points.length >= 4 ? points : generateMockWeights();

  return (
    <div className="space-y-4 px-4 pb-4">
      <h1 className="px-1 text-3xl font-bold tracking-tight">Progress</h1>

      {/* two stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-4 shadow-ios">
          <ProgressRing value={goalPct} size={72} strokeWidth={8} color="var(--foreground)">
            <Scale className="h-6 w-6" />
          </ProgressRing>
          <div className="mt-1 text-xs text-muted-foreground">Last weight</div>
          <div className="text-lg font-bold tabular-nums">{lastWeight} kg</div>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-4 shadow-ios">
          <ProgressRing value={Math.min(100, data.daysLogged * (100 / 7))} size={72} strokeWidth={8} color="var(--foreground)">
            <Calendar className="h-6 w-6" />
          </ProgressRing>
          <div className="mt-1 text-xs text-muted-foreground">Days logged</div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold tabular-nums">{data.daysLogged} logged</span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">2 Cheat</span>
          </div>
        </div>
      </div>

      {/* range selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              range === r ? "bg-card shadow-ios" : "text-muted-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* goal progress chart */}
      <div className="rounded-2xl bg-card p-4 shadow-ios">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Goal Progress</h3>
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">
            <Flag className="h-3 w-3" />
            {Math.round(goalPct)}% of goal
            <Pencil className="h-3 w-3" />
          </span>
        </div>
        <WeightGraph data={graphData} />
      </div>

      {/* motivation banner */}
      <div className="rounded-2xl bg-success/10 p-4 text-center">
        <p className="text-sm font-medium text-success">
          Great job! Consistency is key, and you're mastering it! 💪
        </p>
      </div>

      {/* weekly summary */}
      <div className="rounded-2xl bg-card p-4 shadow-ios">
        <h3 className="mb-3 text-sm font-semibold">This week</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Avg steps
            </div>
            <div className="mt-1 text-base font-bold tabular-nums">
              {Math.round((data.weekHealth.reduce((a, b) => a + b.steps, 0) / Math.max(1, data.weekHealth.length))).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Avg calories</div>
            <div className="mt-1 text-base font-bold tabular-nums">
              {Math.round(data.weekHealth.reduce((a, b) => a + b.activeEnergyKcal, 0) / Math.max(1, data.weekHealth.length))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Avg water</div>
            <div className="mt-1 text-base font-bold tabular-nums">
              {Math.round(data.weekHealth.reduce((a, b) => a + b.waterMl, 0) / Math.max(1, data.weekHealth.length) / 250)} cups
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateMockWeights() {
  const out: { date: string; weight: number }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i -= 2) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const w = 78 + Math.sin(i / 3) * 1.2 + (Math.random() - 0.5) * 0.5 - (29 - i) * 0.05;
    out.push({ date: d.toISOString().slice(0, 10), weight: Math.round(w * 10) / 10 });
  }
  return out;
}

function WeightGraph({ data }: { data: { date: string; weight: number }[] }) {
  if (data.length < 2) return <div className="h-40" />;
  const weights = data.map((d) => d.weight);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min || 1;
  const W = 300;
  const H = 140;
  const pad = 24;
  const step = (W - pad * 2) / (data.length - 1);

  const pts = data.map((d, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (d.weight - min) / range) * (H - pad * 2);
    return { x, y, ...d };
  });

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${path} L${pts[pts.length - 1].x},${H - pad} L${pts[0].x},${H - pad} Z`;

  const last = pts[pts.length - 1];
  const dayLabels = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid lines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={pad} x2={W - pad} y1={pad + t * (H - pad * 2)} y2={pad + t * (H - pad * 2)} stroke="var(--border)" strokeDasharray="2 3" />
        ))}
        <path d={areaPath} fill="url(#weightFill)" />
        <path d={path} fill="none" stroke="var(--success)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* last point */}
        <circle cx={last.x} cy={last.y} r={4} fill="var(--success)" stroke="var(--card)" strokeWidth={2} />
        {/* tooltip */}
        <g>
          <rect x={last.x - 48} y={last.y - 36} width="96" height="28" rx="8" fill="var(--foreground)" />
          <text x={last.x} y={last.y - 22} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--background)">{last.weight} kg</text>
          <text x={last.x} y={last.y - 12} textAnchor="middle" fontSize="8" fill="var(--background)" opacity="0.7">{last.date}</text>
        </g>
        {/* x labels */}
        {dayLabels.map((d, i) => (
          <text key={i} x={pad + (i / (dayLabels.length - 1)) * (W - pad * 2)} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{d}</text>
        ))}
      </svg>
    </div>
  );
}
