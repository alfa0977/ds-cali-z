// Demo user helpers. The web sandbox has no real auth, so we use a
// single fixed demo user ("demo") for all operations. Used by API routes
// (server) and the seed script (bun runtime).
import { db } from "@/lib/db";

export const DEMO_USER_ID = "demo";

/** Ensure the demo user exists in the DB; create if missing. */
export async function ensureDemoUser() {
  let user = await db.user.findUnique({ where: { id: DEMO_USER_ID } });
  if (!user) {
    user = await db.user.create({
      data: {
        id: DEMO_USER_ID,
        email: "demo@cal-ai.app",
        displayName: "Alex Carter",
        goals: JSON.stringify({ calories: 2500, protein: 150, carbs: 250, fat: 70 }),
        weightKg: 78,
        heightCm: 178,
        subscriptionStatus: "trialing",
        streak: 15,
      },
    });
  }
  return user;
}

export async function getDemoUserId() {
  await ensureDemoUser();
  return DEMO_USER_ID;
}
