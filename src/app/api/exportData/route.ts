// GET /api/exportData?format=csv|json
export const dynamic = "force-static";

// Exports all user data (user profile, meals, logs, healthDaily, favorites) as JSON or CSV.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { parseMacros, parseIngredients, parseWorkouts } from "@/lib/json";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const userId = await ensureDemoUser().then((u) => u.id);

  const [user, meals, logs, healthDaily, favorites, foods] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.meal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.log.findMany({ where: { userId }, orderBy: { timestamp: "desc" } }),
    db.healthDaily.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    db.favorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.food.findMany({ where: { createdBy: userId }, orderBy: { name: "asc" } }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    appVersion: "1.0.0",
    user: user ? {
      ...user,
      goals: parseMacros(user.goals),
    } : null,
    meals: meals.map((m) => ({
      ...m,
      ingredients: parseIngredients(m.ingredients),
      macros: parseMacros(m.macros),
    })),
    logs: logs.map((l) => ({
      ...l,
      macros: l.macros ? parseMacros(l.macros) : null,
      workoutSummary: l.workoutSummary ? JSON.parse(l.workoutSummary) : null,
    })),
    healthDaily: healthDaily.map((h) => ({
      ...h,
      workouts: parseWorkouts(h.workouts),
    })),
    favorites,
    customFoods: foods,
  };

  if (format === "csv") {
    // Export logs as CSV
    const headers = ["Date", "Type", "Title", "Calories", "Protein", "Carbs", "Fat", "Water (ml)", "Workout", "Duration (min)", "Meal Slot"];
    const rows = logs.map((l) => {
      const m = l.macros ? parseMacros(l.macros) : null;
      const w = l.workoutSummary ? JSON.parse(l.workoutSummary) : null;
      return [
        new Date(l.timestamp).toISOString(),
        l.type,
        l.title ?? "",
        m?.calories ?? "",
        m?.protein ?? "",
        m?.carbs ?? "",
        m?.fat ?? "",
        l.waterMl ?? "",
        w?.type ?? "",
        w?.durationMinutes ?? "",
        l.mealSlot ?? "",
      ];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="calai-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="calai-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
