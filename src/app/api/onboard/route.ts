// POST /api/onboard — complete user profile + compute goals using Mifflin-St Jeor.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { onboardRequestSchema } from "@/lib/contracts";

export const runtime = "nodejs";

// Mifflin-St Jeor BMR
function computeBMR(sex: string, weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = onboardRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const userId = await ensureDemoUser().then((u) => u.id);

    const bmr = computeBMR(d.sex, d.weightKg, d.heightCm, d.age);
    const tdee = bmr * (ACTIVITY_FACTORS[d.activityLevel] ?? 1.2);

    // Adjust for goal
    let calories = tdee;
    if (d.goal === "lose") calories = tdee - 500; // ~0.5kg/week deficit
    else if (d.goal === "gain") calories = tdee + 400;

    // Macro split: 30% protein, 40% carbs, 30% fat (balanced)
    const protein = Math.round((calories * 0.3) / 4);
    const carbs = Math.round((calories * 0.4) / 4);
    const fat = Math.round((calories * 0.3) / 9);
    const goals = {
      calories: Math.round(calories),
      protein,
      carbs,
      fat,
    };

    const user = await db.user.update({
      where: { id: userId },
      data: {
        displayName: d.displayName,
        sex: d.sex,
        age: d.age,
        heightCm: d.heightCm,
        weightKg: d.weightKg,
        activityLevel: d.activityLevel,
        goal: d.goal,
        goals: JSON.stringify(goals),
        onboarded: true,
      },
    });

    return NextResponse.json({ ok: true, user: { ...user, goals }, goals });
  } catch (e) {
    console.error("[onboard] error:", e);
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}
