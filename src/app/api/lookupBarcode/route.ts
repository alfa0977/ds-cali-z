// GET /api/lookupBarcode?code=XXXXXXXX
// Looks up a food product by barcode via Open Food Facts API.
// Returns a normalized food object that can be logged or saved.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing barcode" }, { status: 400 });
  }

  // 1. Check local DB first
  const local = await db.food.findFirst({ where: { barcode: code } });
  if (local) {
    return NextResponse.json({ source: "local", food: local });
  }

  // 2. Query Open Food Facts
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`,
      {
        headers: { "User-Agent": "CalAI/1.0 (web demo)" },
        // cache for repeated lookups
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Lookup service unavailable" }, { status: 502 });
    }
    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: "Product not found", code }, { status: 404 });
    }

    const p = data.product;
    const n = p.nutriments || {};
    // Open Food Facts gives per-100g values; compute per serving
    const servingG = p.serving_quantity ? Number(p.serving_quantity) : 100;
    const ratio = servingG / 100;

    const userId = await ensureDemoUser().then((u) => u.id);
    const food = await db.food.create({
      data: {
        name: p.product_name || "Unknown product",
        servingSize: servingG ? `${servingG}g` : "100g",
        servingWeightGrams: servingG || 100,
        calories: Math.round((Number(n["energy-kcal_100g"]) || Number(n.energy_100g) / 4.184 || 0) * ratio),
        protein: Math.round((Number(n.proteins_100g) || 0) * ratio * 10) / 10,
        carbs: Math.round((Number(n.carbohydrates_100g) || 0) * ratio * 10) / 10,
        fat: Math.round((Number(n.fat_100g) || 0) * ratio * 10) / 10,
        source: "database",
        barcode: code,
        category: p.categories_tags?.[0]?.replace("en:", "") ?? null,
        emoji: "📦",
        createdBy: userId,
      },
    });

    return NextResponse.json({ source: "openfoodfacts", food });
  } catch (e) {
    console.error("[lookupBarcode] error:", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
