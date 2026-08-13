// POST /api/logFood — log a single food item (from DB or manual) as a meal+log
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { logFoodRequestSchema } from "@/lib/contracts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = logFoodRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;

    let food = null;
    if (d.foodId) {
      food = await db.food.findUnique({ where: { id: d.foodId } });
      if (!food) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
      }
    } else if (d.manualFood) {
      food = await db.food.create({
        data: {
          ...d.manualFood,
          source: "user",
          createdBy: userId,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Either foodId or manualFood is required" },
        { status: 400 }
      );
    }

    const servings = d.servings;
    const macros = {
      calories: Math.round(food.calories * servings),
      protein: Math.round(food.protein * servings * 10) / 10,
      carbs: Math.round(food.carbs * servings * 10) / 10,
      fat: Math.round(food.fat * servings * 10) / 10,
    };

    const timestamp = d.timestamp ? new Date(d.timestamp) : new Date();

    const meal = await db.meal.create({
      data: {
        userId,
        source: "manual",
        title: food.name,
        ingredients: JSON.stringify([
          {
            name: food.name,
            estimatedWeightGrams: Math.round(food.servingWeightGrams * servings),
            confidence: 1,
          },
        ]),
        macros: JSON.stringify(macros),
        healthScore: 60,
      },
    });

    const log = await db.log.create({
      data: {
        userId,
        type: "meal",
        mealId: meal.id,
        macros: JSON.stringify(macros),
        title: food.name,
        timestamp,
      },
    });

    return NextResponse.json({ mealId: meal.id, logId: log.id, food, macros });
  } catch (e) {
    console.error("[logFood] error:", e);
    return NextResponse.json({ error: "Failed to log food" }, { status: 500 });
  }
}
