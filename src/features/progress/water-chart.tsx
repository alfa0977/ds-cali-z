"use client";
import { Droplets } from "lucide-react";
import { useDashboard } from "@/lib/hooks";
import { TapCard } from "@/components/motion";
import { AnimatedNumber } from "@/components/animated-number";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { formatNumber, getWeekdayShort } from "@/lib/date-utils";

const GOAL_ML = 2500;

export function WaterChart() {
  const { data } = useDashboard();
  const { locale, t } = useI18n();
  if (!data) return null;

  const week = data.weekHealth;
  const todayWater = data.todayHealth?.waterMl ?? 0;

  // Build last 7 days water data
  const today = new Date();
  const days: Array<{ date: string; waterMl: number; isToday: boolean; dayLabel: string }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const h = week.find((x) => x.date === key);
    days.push({
      date: key,
      waterMl: h?.waterMl ?? 0,
      isToday: key === today.toISOString().slice(0, 10),
      dayLabel: getWeekdayShort(d, locale).charAt(0),
    });
  }

  const maxWater = Math.max(GOAL_ML, ...days.map((d) => d.waterMl));
  const avgWater = Math.round(days.reduce((a, b) => a + b.waterMl, 0) / days.length);
  const pct = Math.min(100, (todayWater / GOAL_ML) * 100);

  const W = 300;
  const H = 100;
  const pad = 24;
  const barW = (W - pad * 2) / days.length - 8;

  return (
    <TapCard className="card-premium rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Droplets className="h-4 w-4 text-water" />
          {t("waterIntake")}
        </h3>
        <span className="text-xs text-muted-foreground">{t("goalLabel")} {formatNumber((GOAL_ML / 1000).toFixed(1), locale)}L</span>
      </div>

      {/* today summary */}
      <div className="mb-3 flex items-center justify-between rounded-xl bg-water/10 px-3 py-2">
        <div>
          <div className="text-2xl font-bold tabular-nums text-water">
            <AnimatedNumber value={todayWater / 1000} decimals={1} />L
          </div>
          <div className="text-[10px] text-muted-foreground">{t("todayLabel")} ({formatNumber(Math.round(pct), locale)}% {t("ofGoal")})</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums">{formatNumber(avgWater, locale)}ml</div>
          <div className="text-[10px] text-muted-foreground">{t("sevenDayAvg")}</div>
        </div>
      </div>

      {/* bar chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="waterBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--water)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--water)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* goal line */}
        <line
          x1={pad}
          x2={W - pad}
          y1={pad + (1 - GOAL_ML / maxWater) * (H - pad * 2)}
          y2={pad + (1 - GOAL_ML / maxWater) * (H - pad * 2)}
          stroke="var(--water)"
          strokeDasharray="4 3"
          strokeWidth={1}
          opacity={0.4}
        />
        {days.map((d, i) => {
          const x = pad + i * ((W - pad * 2) / days.length) + 4;
          const h = maxWater > 0 ? (d.waterMl / maxWater) * (H - pad * 2) : 0;
          const y = H - pad - h;
          return (
            <g key={i}>
              <motion.rect
                initial={{ height: 0, y: H - pad }}
                animate={{ height: h, y }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                x={x}
                width={barW}
                rx={3}
                fill={d.isToday ? "var(--water)" : "url(#waterBar)"}
              />
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
                {d.dayLabel}
              </text>
              {d.waterMl > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--foreground)">
                  {d.waterMl >= 1000 ? `${formatNumber((d.waterMl / 1000).toFixed(1), locale)}L` : `${formatNumber(d.waterMl, locale)}`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </TapCard>
  );
}
