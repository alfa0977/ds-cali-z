// POST /api/logWater — adjust today's (or given date's) water intake by delta
export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { logWaterRequestSchema } from "@/lib/contracts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = logWaterRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const date = parsed.data.date ?? new Date().toISOString().slice(0, 10);

    const existing = await db.healthDaily.findUnique({
      where: { userId_date: { userId, date } },
    });
    const current = existing?.waterMl ?? 0;
    const next = Math.max(0, current + parsed.data.deltaMl);

    await db.healthDaily.upsert({
      where: { userId_date: { userId, date } },
      update: { waterMl: next },
      create: { userId, date, waterMl: next },
    });

    // also create a water log entry
    await db.log.create({
      data: {
        userId,
        type: "water",
        waterMl: parsed.data.deltaMl,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ ok: true, waterMl: next });
  } catch (e) {
    console.error("[logWater] error:", e);
    return NextResponse.json({ error: "Failed to log water" }, { status: 500 });
  }
}
