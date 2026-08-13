// POST /api/logMeal — save a meal (from AI result or manual) + create a log entry
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { logMealRequestSchema } from "@/lib/contracts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = logMealRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;

    const meal = await db.meal.create({
      data: {
        userId,
        source: d.source,
        ingredients: JSON.stringify(d.ingredients),
        macros: JSON.stringify(d.macros),
        healthScore: d.healthScore,
        imageUrl: d.imageUrl ?? null,
        title: d.title ?? null,
        mealSlot: d.mealSlot ?? null,
      },
    });

    const log = await db.log.create({
      data: {
        userId,
        type: "meal",
        mealId: meal.id,
        macros: JSON.stringify(d.macros),
        title: d.title ?? null,
        imageUrl: d.imageUrl ?? null,
        mealSlot: d.mealSlot ?? null,
        corrected: d.corrected,
        timestamp: new Date(),
      },
    });

    // Bump streak
    await db.user.update({
      where: { id: userId },
      data: { streak: { increment: 1 } },
    });

    return NextResponse.json({ mealId: meal.id, logId: log.id, ok: true });
  } catch (e) {
    console.error("[logMeal] error:", e);
    return NextResponse.json({ error: "Failed to log meal" }, { status: 500 });
  }
}
