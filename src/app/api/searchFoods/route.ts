// GET /api/searchFoods?q=&category=&limit=
// POST /api/searchFoods (same params in body)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchFoodsRequestSchema } from "@/lib/contracts";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 30);
  return runSearch({ q, category, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = searchFoodsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  return runSearch(parsed.data);
}

async function runSearch({
  q,
  category,
  limit,
}: {
  q: string;
  category?: string;
  limit: number;
}) {
  const where: Record<string, unknown> = {};
  if (q.trim()) {
    where.name = { contains: q.trim() };
  }
  if (category && category !== "All") {
    where.category = category;
  }
  const foods = await db.food.findMany({
    where,
    take: limit,
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ foods });
}
