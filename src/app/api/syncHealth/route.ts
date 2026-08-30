// POST /api/syncHealth — upsert a day's aggregated health data
export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { syncHealthRequestSchema } from "@/lib/contracts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = syncHealthRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;

    const existing = await db.healthDaily.findUnique({
      where: { userId_date: { userId, date: d.date } },
    });

    const data = {
      steps: d.steps ?? existing?.steps ?? 0,
      activeEnergyKcal: d.activeEnergyKcal ?? existing?.activeEnergyKcal ?? 0,
      waterMl: d.waterMl ?? existing?.waterMl ?? 0,
      weightKg: d.weightKg ?? existing?.weightKg ?? null,
      workouts: JSON.stringify(d.workouts ?? (existing ? JSON.parse(existing.workouts) : [])),
    };

    const record = await db.healthDaily.upsert({
      where: { userId_date: { userId, date: d.date } },
      update: data,
      create: { userId, date: d.date, ...data },
    });

    return NextResponse.json({ ok: true, record });
  } catch (e) {
    console.error("[syncHealth] error:", e);
    return NextResponse.json({ error: "Failed to sync health" }, { status: 500 });
  }
}
