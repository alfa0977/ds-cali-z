// PATCH /api/updateLog — update a meal log's macros/title (after user edits)
export const dynamic = "force-static";

// Body: { logId, title?, macros?, ingredients? }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  logId: z.string(),
  title: z.string().optional(),
  macros: z
    .object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
    .optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        estimatedWeightGrams: z.number(),
        confidence: z.number(),
        volumeMl: z.number().optional(),
      })
    )
    .optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;

    const log = await db.log.findUnique({ where: { id: d.logId } });
    if (!log || log.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update log
    const logData: Record<string, unknown> = { corrected: true };
    if (d.title) logData.title = d.title;
    if (d.macros) logData.macros = JSON.stringify(d.macros);
    await db.log.update({ where: { id: d.logId }, data: logData });

    // Update meal if linked
    if (log.mealId) {
      const mealData: Record<string, unknown> = {};
      if (d.title) mealData.title = d.title;
      if (d.macros) mealData.macros = JSON.stringify(d.macros);
      if (d.ingredients) mealData.ingredients = JSON.stringify(d.ingredients);
      await db.meal.update({ where: { id: log.mealId }, data: mealData }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[updateLog] error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
