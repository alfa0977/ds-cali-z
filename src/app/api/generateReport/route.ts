// GET /api/generateReport?range=daily|weekly
export const dynamic = "force-static";

// Generates an HTML report (printable to PDF from browser).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { parseMacros } from "@/lib/json";

export const runtime = "nodejs";

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = (url.searchParams.get("range") ?? "weekly") as "daily" | "weekly";
    const userId = await ensureDemoUser().then((u) => u.id);

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = new Date();
    const todayKey = fmtDate(today);
    const startDay = new Date(today);
    if (range === "weekly") startDay.setDate(startDay.getDate() - 6);
    startDay.setHours(0, 0, 0, 0);
    const startKey = fmtDate(startDay);

    const logs = await db.log.findMany({
      where: { userId, timestamp: { gte: startDay, lte: today } },
      orderBy: { timestamp: "asc" },
    });
    const health = await db.healthDaily.findMany({
      where: { userId, date: { gte: startKey, lte: todayKey } },
      orderBy: { date: "asc" },
    });

    // Group by date
    const byDate = new Map<string, { calories: number; protein: number; carbs: number; fat: number; water: number; burned: number; workouts: number }>();
    for (const log of logs) {
      const dayKey = log.timestamp.toISOString().slice(0, 10);
      const entry = byDate.get(dayKey) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, burned: 0, workouts: 0 };
      if (log.type === "meal" && log.macros) {
        const m = parseMacros(log.macros);
        entry.calories += m.calories; entry.protein += m.protein; entry.carbs += m.carbs; entry.fat += m.fat;
      } else if (log.type === "water") entry.water += log.waterMl ?? 0;
      else if (log.type === "workout" && log.workoutSummary) {
        const w = JSON.parse(log.workoutSummary);
        entry.burned += w.caloriesBurned ?? 0; entry.workouts += 1;
      }
      byDate.set(dayKey, entry);
    }

    const days: Array<{ date: string; calories: number; protein: number; carbs: number; fat: number; water: number; burned: number; workouts: number; weight: number | null; steps: number }> = [];
    const totalDays = range === "weekly" ? 7 : 1;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = fmtDate(d);
      const e = byDate.get(key);
      const h = health.find((hd) => hd.date === key);
      days.push({ date: key, calories: e?.calories ?? 0, protein: e?.protein ?? 0, carbs: e?.carbs ?? 0, fat: e?.fat ?? 0, water: e?.water ?? 0, burned: e?.burned ?? 0, workouts: e?.workouts ?? 0, weight: h?.weightKg ?? null, steps: h?.steps ?? 0 });
    }

    const goals = parseMacros(user.goals);
    const total = days.reduce((acc, d) => ({ calories: acc.calories + d.calories, protein: acc.protein + d.protein, carbs: acc.carbs + d.carbs, fat: acc.fat + d.fat, water: acc.water + d.water, burned: acc.burned + d.burned, workouts: acc.workouts + d.workouts }), { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, burned: 0, workouts: 0 });
    const avgCalories = days.length > 0 ? Math.round(total.calories / days.length) : 0;

    const workouts = logs.filter((l) => l.type === "workout" && l.workoutSummary).map((l) => ({ date: l.timestamp.toISOString().slice(0, 10), ...JSON.parse(l.workoutSummary!) })).reverse().slice(0, 20);

    // Build HTML report
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>DS-Cali Report</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
  h1 { color: #f97316; }
  h2 { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
  th { background: #f5f5f5; }
  .summary { background: #fff8f0; padding: 15px; border-radius: 8px; margin: 10px 0; }
  .bar { height: 20px; border-radius: 4px; background: #eee; overflow: hidden; margin: 5px 0; }
  .bar-fill { height: 100%; border-radius: 4px; }
  @media print { body { max-width: none; } }
</style></head><body>
<h1>🍎 DS-Cali Report</h1>
<p>Generated: ${new Date().toLocaleString()}<br>Range: ${startKey} → ${todayKey} (${range})<br>User: ${user.displayName ?? "User"}</p>

<div class="summary">
  <h2>Summary</h2>
  <p><strong>Avg daily calories:</strong> ${avgCalories} kcal (goal: ${goals.calories} kcal)</p>
  <p><strong>Total protein:</strong> ${Math.round(total.protein)}g | <strong>Carbs:</strong> ${Math.round(total.carbs)}g | <strong>Fat:</strong> ${Math.round(total.fat)}g</p>
  <p><strong>Total water:</strong> ${(total.water / 1000).toFixed(1)} L</p>
  <p><strong>Workouts:</strong> ${total.workouts} | <strong>Burned:</strong> ${Math.round(total.burned)} kcal</p>
</div>

<h2>Daily Summaries</h2>
<table><tr><th>Date</th><th>Cal</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Water(ml)</th><th>Burned</th><th>Steps</th></tr>
${days.map(d => `<tr><td>${d.date}</td><td>${d.calories}</td><td>${Math.round(d.protein)}g</td><td>${Math.round(d.carbs)}g</td><td>${Math.round(d.fat)}g</td><td>${d.water}</td><td>${d.burned}</td><td>${d.steps}</td></tr>`).join("")}
</table>

<h2>Macro Breakdown</h2>
${["protein", "carbs", "fat"].map(m => {
  const val = Math.round(total[m as "protein"]); const goal = (goals[m as "protein"] ?? 0) * days.length;
  const pct = goal > 0 ? Math.min(100, (val / goal) * 100) : 0;
  const colors: Record<string, string> = { protein: "#ef4444", carbs: "#f97316", fat: "#3b82f6" };
  return `<p>${m.charAt(0).toUpperCase() + m.slice(1)}: ${val}g / ${goal}g</p><div class="bar"><div class="bar-fill" style="width:${pct}%;background:${colors[m]}"></div></div>`;
}).join("")}

${days.filter(d => d.weight != null).length > 0 ? `<h2>Weight Trend</h2><table><tr><th>Date</th><th>Weight</th></tr>${days.filter(d => d.weight != null).map(d => `<tr><td>${d.date}</td><td>${d.weight!.toFixed(1)} kg</td></tr>`).join("")}</table>` : ""}

${workouts.length > 0 ? `<h2>Workout History</h2><table><tr><th>Date</th><th>Type</th><th>Duration</th><th>Intensity</th><th>Calories</th></tr>${workouts.map((w: Record<string, unknown>) => `<tr><td>${w.date}</td><td>${w.type}</td><td>${w.durationMinutes} min</td><td>${w.intensity}</td><td>${w.caloriesBurned} kcal</td></tr>`).join("")}</table>` : ""}

<p style="text-align:center;color:#999;margin-top:30px;font-size:11px;">DS-Cali · AI Calorie Tracker · Generated from your health data</p>
</body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="ds-cali-report-${todayKey}.html"`,
      },
    });
  } catch (e) {
    console.error("[generateReport] error:", e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
