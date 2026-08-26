// POST /api/switchUser — switch the active user by setting a cookie
export const dynamic = "force-static";

// Body: { userId }
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Set a cookie that auth.ts will read
    const res = NextResponse.json({ ok: true, user: { id: user.id, displayName: user.displayName } });
    res.cookies.set("ds-cali-user-id", userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    console.error("[switchUser]", e);
    return NextResponse.json({ error: "Failed to switch user" }, { status: 500 });
  }
}
