// GET /api/favorites — list user's favorite foods
export const dynamic = "force-static";

// POST /api/favorites — add a favorite { foodId?, name, emoji?, calories, protein, carbs, fat, servingSize? }
// DELETE /api/favorites?id=FAV_ID — remove a favorite
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  const userId = await ensureDemoUser().then((u) => u.id);
  const favorites = await db.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ favorites });
}

const createSchema = z.object({
  foodId: z.string().optional(),
  name: z.string().min(1),
  emoji: z.string().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  servingSize: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;
    const fav = await db.favorite.upsert({
      where: { userId_name: { userId, name: d.name } },
      update: {
        foodId: d.foodId,
        emoji: d.emoji,
        calories: d.calories,
        protein: d.protein,
        carbs: d.carbs,
        fat: d.fat,
        servingSize: d.servingSize,
      },
      create: { userId, ...d },
    });
    return NextResponse.json({ ok: true, favorite: fav });
  } catch (e) {
    console.error("[favorites POST] error:", e);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const userId = await ensureDemoUser().then((u) => u.id);
  await db.favorite.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
