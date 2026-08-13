// GET /api/mealDetail?id=MEAL_ID — full meal detail with ingredients + macros
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { parseMacros, parseIngredients } from "@/lib/json";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const userId = await ensureDemoUser().then((u) => u.id);

  const meal = await db.meal.findUnique({ where: { id } });
  if (!meal || meal.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...meal,
    ingredients: parseIngredients(meal.ingredients),
    macros: parseMacros(meal.macros),
  });
}
