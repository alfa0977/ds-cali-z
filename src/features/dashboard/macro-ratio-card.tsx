"use client";
import { Drumstick, Wheat, Droplets } from "lucide-react";
import { DonutChart } from "@/components/donut-chart";
import { useDashboard } from "@/lib/hooks";
import { TapCard } from "@/components/motion";

export function MacroRatioCard() {
  const { data } = useDashboard();
  if (!data) return null;

  const consumed = data.consumed;
  // Calculate calorie contribution from each macro (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
  const proteinCal = consumed.protein * 4;
  const carbsCal = consumed.carbs * 4;
  const fatCal = consumed.fat * 9;
  const totalMacroCal = proteinCal + carbsCal + fatCal;

  if (totalMacroCal === 0) return null;

  const segments = [
    { label: "Protein", value: proteinCal, color: "var(--protein)" },
    { label: "Carbs", value: carbsCal, color: "var(--carbs)" },
    { label: "Fats", value: fatCal, color: "var(--fats)" },
  ];

  const proteinPct = Math.round((proteinCal / totalMacroCal) * 100);
  const carbsPct = Math.round((carbsCal / totalMacroCal) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  return (
    <TapCard className="card-premium rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold">Macro split</h3>
      <div className="flex items-center gap-4">
        <DonutChart segments={segments} size={110} strokeWidth={14}>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{consumed.calories}</div>
            <div className="text-[9px] text-muted-foreground">kcal</div>
          </div>
        </DonutChart>
        <div className="flex-1 space-y-2">
          <MacroRow icon={Drumstick} label="Protein" pct={proteinPct} grams={consumed.protein} color="var(--protein)" />
          <MacroRow icon={Wheat} label="Carbs" pct={carbsPct} grams={consumed.carbs} color="var(--carbs)" />
          <MacroRow icon={Droplets} label="Fats" pct={fatPct} grams={consumed.fat} color="var(--fats)" />
        </div>
      </div>
    </TapCard>
  );
}

function MacroRow({
  icon: Icon,
  label,
  pct,
  grams,
  color,
}: {
  icon: typeof Drumstick;
  label: string;
  pct: number;
  grams: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground tabular-nums">
            <span className="font-semibold" style={{ color }}>{pct}%</span>
            {" · "}
            {Math.round(grams)}g
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
