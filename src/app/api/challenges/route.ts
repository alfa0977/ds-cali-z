// GET  /api/challenges — list user's challenges (active + completed)
export const dynamic = "force-static";

// POST /api/challenges — join a challenge { type }
// PATCH /api/challenges — update progress (auto-computed) or leave { id?, action: "leave" }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const CHALLENGE_DEFS: Record<string, { targetDays: number; labelFa: string; labelEn: string; descFa: string; descEn: string; emoji: string; rewardFa: string; rewardEn: string }> = {
  water_week: {
    targetDays: 7,
    labelFa: "هفته آبرسانی",
    labelEn: "Hydration Week",
    descFa: "۷ روز پیاپی ۲.۵ لیتر آب بنوشید",
    descEn: "Drink 2.5L water for 7 days straight",
    emoji: "💧",
    rewardFa: "نشان آبرسانی",
    rewardEn: "Hydration Badge",
  },
  protein_boost: {
    targetDays: 5,
    labelFa: "افزایش پروتئین",
    labelEn: "Protein Boost",
    descFa: "۵ روز به هدف پروتئین برسید",
    descEn: "Hit your protein goal 5 days",
    emoji: "💪",
    rewardFa: "نشان پروتئین",
    rewardEn: "Protein Badge",
  },
  step_master: {
    targetDays: 3,
    labelFa: "استاد گام",
    labelEn: "Step Master",
    descFa: "۳ روز به ۱۰هزار گام برسید",
    descEn: "Reach 10K steps 3 days",
    emoji: "🚶",
    rewardFa: "نشان گام",
    rewardEn: "Step Badge",
  },
  clean_eating: {
    targetDays: 7,
    labelFa: "تغذیه سالم",
    labelEn: "Clean Eating",
    descFa: "۷ روز وعده با امتیاز سلامت ۷۰+ ثبت کنید",
    descEn: "Log meals with 70+ health score 7 days",
    emoji: "🥗",
    rewardFa: "نشان تغذیه سالم",
    rewardEn: "Clean Eating Badge",
  },
  streak_warrior: {
    targetDays: 10,
    labelFa: "مبارز استمرار",
    labelEn: "Streak Warrior",
    descFa: "۱۰ روز پیاپی ثبت کنید",
    descEn: "Log meals 10 days in a row",
    emoji: "🔥",
    rewardFa: "نشان استمرار",
    rewardEn: "Streak Badge",
  },
};

export async function GET() {
  const userId = await ensureDemoUser().then((u) => u.id);
  const challenges = await db.challenge.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
  });

  // Auto-update progress based on current data
  const updated = await Promise.all(
    challenges.map(async (c) => {
      if (c.status !== "active") return c;
      const daysCompleted = await computeProgress(c.type, userId, c.joinedAt);
      const target = CHALLENGE_DEFS[c.type]?.targetDays ?? 7;
      const progress = Math.min(100, Math.round((daysCompleted / target) * 100));
      const status = daysCompleted >= target ? "completed" : "active";
      if (progress !== c.progress || status !== c.status) {
        return db.challenge.update({
          where: { id: c.id },
          data: { progress, daysCompleted, status, completedAt: status === "completed" ? new Date() : null },
        });
      }
      return c;
    })
  );

  return NextResponse.json({
    challenges: updated.map((c) => ({
      ...c,
      def: CHALLENGE_DEFS[c.type],
    })),
    available: Object.entries(CHALLENGE_DEFS).map(([type, def]) => ({
      type,
      ...def,
      joined: updated.some((c) => c.type === type && c.status === "active"),
    })),
  });
}

async function computeProgress(type: string, userId: string, since: Date): Promise<number> {
  const sinceDate = since.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  // Get health daily data since joined
  const healthDays = await db.healthDaily.findMany({
    where: { userId, date: { gte: sinceDate, lte: today } },
  });

  // Get meal logs since joined
  const mealLogs = await db.log.findMany({
    where: { userId, type: "meal", timestamp: { gte: since } },
    include: { meal: true },
  });

  const user = await db.user.findUnique({ where: { id: userId } });
  const goals = user?.goals ? JSON.parse(user.goals) : { protein: 150 };

  switch (type) {
    case "water_week":
      return healthDays.filter((h) => h.waterMl >= 2500).length;
    case "protein_boost": {
      // Group meal logs by day, check if protein goal met
      const byDay: Record<string, number> = {};
      for (const log of mealLogs) {
        const day = log.timestamp.toISOString().slice(0, 10);
        if (log.macros) {
          const m = JSON.parse(log.macros);
          byDay[day] = (byDay[day] ?? 0) + (m.protein ?? 0);
        }
      }
      return Object.values(byDay).filter((p) => p >= goals.protein).length;
    }
    case "step_master":
      return healthDays.filter((h) => h.steps >= 10000).length;
    case "clean_eating": {
      // Check meals with health score >= 70
      const byDay: Record<string, boolean> = {};
      for (const log of mealLogs) {
        if (log.meal && log.meal.healthScore >= 70) {
          byDay[log.timestamp.toISOString().slice(0, 10)] = true;
        }
      }
      return Object.keys(byDay).length;
    }
    case "streak_warrior": {
      // Count distinct days with meal logs since joined
      const days = new Set(mealLogs.map((l) => l.timestamp.toISOString().slice(0, 10)));
      return days.size;
    }
    default:
      return 0;
  }
}

const joinSchema = z.object({ type: z.string() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const userId = await ensureDemoUser().then((u) => u.id);
    const type = parsed.data.type;
    if (!CHALLENGE_DEFS[type]) return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });

    // Check if already active
    const existing = await db.challenge.findFirst({ where: { userId, type, status: "active" } });
    if (existing) return NextResponse.json({ challenge: existing, alreadyJoined: true });

    const challenge = await db.challenge.create({
      data: { userId, type, targetDays: CHALLENGE_DEFS[type].targetDays },
    });
    return NextResponse.json({ challenge, def: CHALLENGE_DEFS[type] });
  } catch (e) {
    console.error("[challenges POST]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  action: z.enum(["leave", "update"]).default("leave"),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;

    if (d.action === "leave") {
      const where = d.id
        ? { id: d.id, userId }
        : d.type
        ? { userId_type_status: { userId, type: d.type, status: "active" } }
        : undefined;
      if (!where) return NextResponse.json({ error: "Need id or type" }, { status: 400 });
      // Can't use composite unique easily, so find + update
      const challenge = d.id
        ? await db.challenge.findFirst({ where: { id: d.id, userId } })
        : await db.challenge.findFirst({ where: { userId, type: d.type, status: "active" } });
      if (challenge) {
        await db.challenge.update({ where: { id: challenge.id }, data: { status: "abandoned" } });
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[challenges PATCH]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
