// GET /api/mealSuggestions — suggests foods from the database that fit remaining macros.
// Prioritizes foods that fill the biggest macro gap (e.g., high-protein if protein is low).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { parseMacros } from "@/lib/json";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slot = url.searchParams.get("slot") ?? "snack"; // breakfast|lunch|dinner|snack
  const userId = await ensureDemoUser().then((u) => u.id);

  // Get today's consumed macros
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date(today + "T00:00:00.000Z");
  const dayEnd = new Date(today + "T23:59:59.999Z");
  const logs = await db.log.findMany({
    where: { userId, type: "meal", timestamp: { gte: dayStart, lte: dayEnd } },
  });

  const user = await db.user.findUnique({ where: { id: userId } });
  const goals = user ? parseMacros(user.goals) : { calories: 2500, protein: 150, carbs: 250, fat: 70 };

  let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const log of logs) {
    if (log.macros) {
      const m = parseMacros(log.macros);
      consumed.calories += m.calories;
      consumed.protein += m.protein;
      consumed.carbs += m.carbs;
      consumed.fat += m.fat;
    }
  }

  const remaining = {
    calories: Math.max(0, goals.calories - consumed.calories),
    protein: Math.max(0, goals.protein - consumed.protein),
    carbs: Math.max(0, goals.carbs - consumed.carbs),
    fat: Math.max(0, goals.fat - consumed.fat),
  };

  // Determine the biggest macro gap (by percentage)
  const proteinPct = goals.protein > 0 ? remaining.protein / goals.protein : 0;
  const carbsPct = goals.carbs > 0 ? remaining.carbs / goals.carbs : 0;
  const fatPct = goals.fat > 0 ? remaining.fat / goals.fat : 0;

  let sortField: "protein" | "carbs" | "fat" | "calories" = "protein";
  if (proteinPct >= carbsPct && proteinPct >= fatPct) sortField = "protein";
  else if (carbsPct >= fatPct) sortField = "carbs";
 else sortField = "fat";

  // Category mapping by slot
  const slotCategories: Record<string, string[]> = {
    breakfast: ["grain", "fruit", "dairy", "beverage"],
    lunch: ["protein", "vegetable", "grain", "snack"],
    dinner: ["protein", "vegetable", "grain"],
    snack: ["fruit", "snack", "dairy"],
  };
  const categories = slotCategories[slot] ?? ["snack", "fruit"];

  // Fetch foods matching the slot categories, sorted by the biggest gap macro
  const foods = await db.food.findMany({
    where: { category: { in: categories } },
    take: 20,
    orderBy: { [sortField]: "desc" },
  });

  // Also get some favorites
  const favorites = await db.favorite.findMany({
    where: { userId },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  // Score foods by how well they fit remaining macros
  const scored = foods.map((f) => {
    let score = 0;
    if (remaining.protein > 0) score += Math.min(1, f.protein / remaining.protein) * (sortField === "protein" ? 2 : 1);
    if (remaining.carbs > 0) score += Math.min(1, f.carbs / remaining.carbs) * (sortField === "carbs" ? 2 : 1);
    if (remaining.fat > 0) score += Math.min(1, f.fat / remaining.fat) * (sortField === "fat" ? 2 : 1);
    if (remaining.calories > 0 && f.calories <= remaining.calories) score += 0.5;
    return { ...f, score: Math.round(score * 100) / 100 };
  });

  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    suggestions: scored.slice(0, 8),
    favorites: favorites.map((f) => ({ ...f, score: 0 })),
    remaining,
    biggestGap: sortField,
  });
}
