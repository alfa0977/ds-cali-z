// GET /api/getUserDashboard?date=YYYY-MM-DD
// Returns everything the home + progress dashboards need for a given day:
// user, today's health, consumed macros, logs (recent feed), last 7 days health,
// weight history (last N days).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { parseMacros, parseWorkouts } from "@/lib/json";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
    const userId = await ensureDemoUser().then((u) => u.id);

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Today's health
    const todayHealth = await db.healthDaily.findUnique({
      where: { userId_date: { userId, date: dateParam } },
    });

    // Logs for the selected day
    const dayStart = new Date(dateParam + "T00:00:00.000Z");
    const dayEnd = new Date(dateParam + "T23:59:59.999Z");
    const dayLogs = await db.log.findMany({
      where: { userId, timestamp: { gte: dayStart, lte: dayEnd } },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    // Calculate consumed macros today (sum of meal + workout logs)
    let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let burned = 0;
    for (const log of dayLogs) {
      if (log.type === "meal" && log.macros) {
        const m = parseMacros(log.macros);
        consumed.calories += m.calories;
        consumed.protein += m.protein;
        consumed.carbs += m.carbs;
        consumed.fat += m.fat;
      } else if (log.type === "workout" && log.workoutSummary) {
        const w = JSON.parse(log.workoutSummary);
        burned += w.caloriesBurned ?? 0;
      }
    }

    // Last 7 days health (for weekly habit rings + weight graph)
    const sevenDaysAgo = new Date(dayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const weekHealth = await db.healthDaily.findMany({
      where: { userId, date: { gte: sevenDaysAgo.toISOString().slice(0, 10), lte: dateParam } },
      orderBy: { date: "asc" },
    });

    // Last 30 days for weight graph (extended)
    const thirtyDaysAgo = new Date(dayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const monthHealth = await db.healthDaily.findMany({
      where: { userId, date: { gte: thirtyDaysAgo.toISOString().slice(0, 10), lte: dateParam } },
      orderBy: { date: "asc" },
    });

    // Macro trends: last 7 days of meal logs aggregated per day
    const trendStart = new Date(dayStart);
    trendStart.setDate(trendStart.getDate() - 6);
    const trendLogs = await db.log.findMany({
      where: {
        userId,
        type: "meal",
        timestamp: { gte: trendStart, lte: dayEnd },
      },
      orderBy: { timestamp: "asc" },
    });
    const macroTrend: Array<{ date: string; calories: number; protein: number; carbs: number; fat: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(trendStart);
      d.setDate(trendStart.getDate() + (6 - i));
      const key = d.toISOString().slice(0, 10);
      const dayLogs = trendLogs.filter((l) => l.timestamp.toISOString().slice(0, 10) === key);
      const sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      for (const l of dayLogs) {
        if (l.macros) {
          const m = parseMacros(l.macros);
          sum.calories += m.calories;
          sum.protein += m.protein;
          sum.carbs += m.carbs;
          sum.fat += m.fat;
        }
      }
      macroTrend.push({ date: key, ...sum });
    }

    // Streak info: consecutive days with at least one meal log, ending today
    const allMealLogs = await db.log.findMany({
      where: { userId, type: "meal" },
      select: { timestamp: true },
    });
    const loggedDays = new Set(allMealLogs.map((l) => l.timestamp.toISOString().slice(0, 10)));
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(dayStart);
      d.setDate(d.getDate() - i);
      if (loggedDays.has(d.toISOString().slice(0, 10))) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Recent feed: last 20 logs across all days
    const recentLogs = await db.log.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    // Days logged this week
    const daysLogged = weekHealth.filter((h) => h.steps > 0 || h.waterMl > 0).length;

    return NextResponse.json({
      user: {
        ...user,
        goals: parseMacros(user.goals),
        streak,
      },
      todayHealth: todayHealth
        ? {
            ...todayHealth,
            workouts: parseWorkouts(todayHealth.workouts),
          }
        : null,
      consumed,
      burned,
      netCalories: consumed.calories - burned,
      dayLogs: dayLogs.map((l) => ({
        ...l,
        macros: l.macros ? parseMacros(l.macros) : null,
        workoutSummary: l.workoutSummary ? JSON.parse(l.workoutSummary) : null,
      })),
      mealsBySlot: {
        breakfast: dayLogs.filter((l) => l.type === "meal" && (l.mealSlot === "breakfast" || (!l.mealSlot && new Date(l.timestamp).getHours() < 11))).map((l) => ({ ...l, macros: l.macros ? parseMacros(l.macros) : null })),
        lunch: dayLogs.filter((l) => l.type === "meal" && (l.mealSlot === "lunch" || (!l.mealSlot && new Date(l.timestamp).getHours() >= 11 && new Date(l.timestamp).getHours() < 16))).map((l) => ({ ...l, macros: l.macros ? parseMacros(l.macros) : null })),
        dinner: dayLogs.filter((l) => l.type === "meal" && (l.mealSlot === "dinner" || (!l.mealSlot && new Date(l.timestamp).getHours() >= 16 && new Date(l.timestamp).getHours() < 22))).map((l) => ({ ...l, macros: l.macros ? parseMacros(l.macros) : null })),
        snack: dayLogs.filter((l) => l.type === "meal" && l.mealSlot === "snack").map((l) => ({ ...l, macros: l.macros ? parseMacros(l.macros) : null })),
      },
      weekHealth,
      monthHealth,
      macroTrend,
      recentLogs: recentLogs.map((l) => ({
        ...l,
        macros: l.macros ? parseMacros(l.macros) : null,
        workoutSummary: l.workoutSummary ? JSON.parse(l.workoutSummary) : null,
      })),
      daysLogged,
    });
  } catch (e) {
    console.error("[getUserDashboard] error:", e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
