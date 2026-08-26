// GET  /api/users — list all users
export const dynamic = "force-static";

// POST /api/users — create a new user { displayName, email }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      subscriptionStatus: true,
      streak: true,
      onboarded: true,
      createdAt: true,
      goals: true,
    },
  });
  return NextResponse.json({ users });
}

const createSchema = z.object({
  displayName: z.string().min(1),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { displayName, email } = parsed.data;
    const user = await db.user.create({
      data: {
        email: email || `${displayName.toLowerCase().replace(/\s+/g, "")}@ds-cali.app`,
        displayName,
        goals: JSON.stringify({ calories: 2500, protein: 150, carbs: 250, fat: 70 }),
        subscriptionStatus: "trialing",
        streak: 0,
        onboarded: false,
      },
    });
    return NextResponse.json({ user });
  } catch (e) {
    console.error("[users POST]", e);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// DELETE /api/users?id=USER_ID — delete a user
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (id === "demo") return NextResponse.json({ error: "Cannot delete demo user" }, { status: 403 });

  // Delete all related data
  await db.log.deleteMany({ where: { userId: id } });
  await db.meal.deleteMany({ where: { userId: id } });
  await db.healthDaily.deleteMany({ where: { userId: id } });
  await db.aiAnalysis.deleteMany({ where: { userId: id } });
  await db.favorite.deleteMany({ where: { userId: id } });
  await db.challenge.deleteMany({ where: { userId: id } });
  await db.food.deleteMany({ where: { createdBy: id } });
  await db.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
