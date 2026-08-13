// POST /api/logWorkout — log a workout
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { logWorkoutRequestSchema } from "@/lib/contracts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = logWorkoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;

    const log = await db.log.create({
      data: {
        userId,
        type: "workout",
        title: d.type,
        workoutSummary: JSON.stringify(d),
        timestamp: new Date(),
      },
    });

    // also add to today's health daily workouts + active energy
    const date = new Date().toISOString().slice(0, 10);
    const existing = await db.healthDaily.findUnique({
      where: { userId_date: { userId, date } },
    });
    const workouts = existing ? JSON.parse(existing.workouts) : [];
    workouts.push(d);
    await db.healthDaily.upsert({
      where: { userId_date: { userId, date } },
      update: {
        workouts: JSON.stringify(workouts),
        activeEnergyKcal: (existing?.activeEnergyKcal ?? 0) + d.caloriesBurned,
      },
      create: {
        userId,
        date,
        workouts: JSON.stringify(workouts),
        activeEnergyKcal: d.caloriesBurned,
      },
    });

    return NextResponse.json({ ok: true, logId: log.id });
  } catch (e) {
    console.error("[logWorkout] error:", e);
    return NextResponse.json({ error: "Failed to log workout" }, { status: 500 });
  }
}
