// DELETE /api/deleteLog?id=LOG_ID — delete a log entry (and its meal if meal-type)
export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const userId = await ensureDemoUser().then((u) => u.id);

  const log = await db.log.findUnique({ where: { id } });
  if (!log || log.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If it's a meal log, delete the meal too
  if (log.mealId) {
    await db.meal.delete({ where: { id: log.mealId } }).catch(() => {});
  }
  await db.log.delete({ where: { id } });

  // Decrement streak if it was today? Keep streak simple — don't decrement.
  return NextResponse.json({ ok: true });
}
