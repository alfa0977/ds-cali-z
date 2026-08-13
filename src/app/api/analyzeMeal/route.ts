// POST /api/analyzeMeal
// Accepts an image (data URL or http URL), runs VLM analysis, computes macros,
// stores the raw + corrected analysis, and returns the result card payload.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/auth";
import { analyzeMealImage, calculateMacros } from "@/lib/ai-engine";
import { analyzeMealRequestSchema } from "@/lib/contracts";
import { parseMacros } from "@/lib/json";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = analyzeMealRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const userId = await ensureDemoUser().then((u) => u.id);

    // Run the AI vision analysis
    const { analysis, raw } = await analyzeMealImage({
      image: parsed.data.image,
      referenceObject: parsed.data.referenceObject,
    });

    // Compute macros from ingredients using the category macro table
    const macros = calculateMacros(analysis.ingredients);

    // Persist the analysis
    const aiAnalysis = await db.aiAnalysis.create({
      data: {
        userId,
        rawResponse: raw,
        correctedResponse: JSON.stringify({ ...analysis, macros }),
        imageUrl: parsed.data.image,
      },
    });

    return NextResponse.json({
      analysisId: aiAnalysis.id,
      ingredients: analysis.ingredients,
      macros,
      healthScore: analysis.healthScore,
      mealTitle: analysis.mealTitle ?? null,
      detectedCategory: analysis.detectedCategory ?? null,
      imageUrl: parsed.data.image,
    });
  } catch (e) {
    console.error("[analyzeMeal] error:", e);
    const msg = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Helper exported for other routes
export { parseMacros };
