// PATCH /api/updateUser — update profile / goals / weight / height
export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { updateUserRequestSchema } from "@/lib/contracts";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateUserRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const userId = await ensureDemoUser().then((u) => u.id);
    const d = parsed.data;

    const data: Record<string, unknown> = {};
    if (d.displayName !== undefined) data.displayName = d.displayName;
    if (d.weightKg !== undefined) data.weightKg = d.weightKg;
    if (d.heightCm !== undefined) data.heightCm = d.heightCm;
    if (d.goals !== undefined) data.goals = JSON.stringify(d.goals);

    const user = await db.user.update({ where: { id: userId }, data });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error("[updateUser] error:", e);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
