// POST /api/importData — import JSON backup, restoring meals/logs/favorites
export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const importSchema = z.object({
  meals: z.array(z.object({
    source: z.string().default("manual"),
    title: z.string().optional(),
    ingredients: z.string().default("[]"),
    macros: z.string().default('{"calories":0,"protein":0,"carbs":0,"fat":0}'),
    healthScore: z.number().default(0),
    imageUrl: z.string().nullable().optional(),
    mealSlot: z.string().nullable().optional(),
    createdAt: z.string().optional(),
  })).default([]),
  logs: z.array(z.object({
    type: z.string(),
    title: z.string().nullable().optional(),
    macros: z.string().nullable().optional(),
    waterMl: z.number().nullable().optional(),
    workoutSummary: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    mealSlot: z.string().nullable().optional(),
    timestamp: z.string().optional(),
    corrected: z.boolean().default(false),
  })).default([]),
  favorites: z.array(z.object({
    name: z.string(),
    emoji: z.string().nullable().optional(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    servingSize: z.string().nullable().optional(),
  })).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid import data", details: parsed.error.flatten() }, { status: 400 });
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;

    let imported = { meals: 0, logs: 0, favorites: 0 };

    // Import meals
    for (const meal of d.meals) {
      await db.meal.create({
        data: {
          userId,
          source: meal.source,
          title: meal.title,
          ingredients: meal.ingredients,
          macros: meal.macros,
          healthScore: meal.healthScore,
          imageUrl: meal.imageUrl ?? null,
          mealSlot: meal.mealSlot ?? null,
          createdAt: meal.createdAt ? new Date(meal.createdAt) : new Date(),
        },
      });
      imported.meals++;
    }

    // Import logs
    for (const log of d.logs) {
      await db.log.create({
        data: {
          userId,
          type: log.type,
          title: log.title ?? null,
          macros: log.macros ?? null,
          waterMl: log.waterMl ?? null,
          workoutSummary: log.workoutSummary ?? null,
          imageUrl: log.imageUrl ?? null,
          mealSlot: log.mealSlot ?? null,
          timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
          corrected: log.corrected,
        },
      });
      imported.logs++;
    }

    // Import favorites
    for (const fav of d.favorites) {
      await db.favorite.upsert({
        where: { userId_name: { userId, name: fav.name } },
        update: {
          emoji: fav.emoji,
          calories: fav.calories,
          protein: fav.protein,
          carbs: fav.carbs,
          fat: fav.fat,
          servingSize: fav.servingSize,
        },
        create: { userId, ...fav },
      });
      imported.favorites++;
    }

    return NextResponse.json({ ok: true, imported });
  } catch (e) {
    console.error("[importData] error:", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
