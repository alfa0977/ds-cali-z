// AI Engine — server-only module wrapping z-ai-web-dev-sdk VLM.
// Implements the AI pipeline from docs/AI_PIPELINE.md:
//   image -> multimodal LLM -> strict JSON -> Zod parse -> macro calc.

import "server-only";
import ZAI from "z-ai-web-dev-sdk";
import {
  aiMealAnalysisSchema,
  type AiMealAnalysis,
  type IngredientResult,
  type Macros,
} from "@/lib/contracts";

// Reference object real-world sizes (for scale hints in prompt)
const REFERENCE_SIZES: Record<string, string> = {
  plate: "a standard 10-inch (25 cm) dinner plate",
  fork: "a standard fork (~20 cm)",
  card: "a credit card (8.56 x 5.4 cm)",
  hand: "an adult hand",
};

const PROMPT_TEMPLATE = `You are Cal-AI, a nutritionist vision AI. Analyze the meal in this image and estimate each ingredient with its weight in grams.

Rules:
- Identify distinct ingredients (not the whole dish as one item).
- Estimate weight in grams for each ingredient based on visual portion and the reference object: {referenceObject}.
- If the image is not a meal/food, return an empty ingredients array with healthScore 0.
- Confidence is 0-1 (how sure you are about identification + weight).
- healthScore is 0-100 based on nutritional balance (vegetables, whole foods, lean protein score higher; fried/sugary/processed score lower).
- Respond with ONLY a JSON object, no markdown, no prose.

JSON schema:
{
  "ingredients": [
    { "name": "string", "estimatedWeightGrams": number, "volumeMl": number|null, "confidence": number }
  ],
  "healthScore": number,
  "mealTitle": "string (short, e.g. 'Pancakes with blueberries')",
  "detectedCategory": "Breakfast|Lunch|Dinner|Snack|Beverage"
}`;

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZai() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

/**
 * Parse a possibly-noisy LLM JSON response into the strict schema.
 * Strips markdown fences, extracts the first {...} block, validates with Zod.
 */
export function parseAnalysisResponse(raw: string): AiMealAnalysis {
  let text = raw.trim();
  // strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // extract first balanced JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  const parsed = JSON.parse(text);
  const cleaned: AiMealAnalysis = {
    ingredients: parsed.ingredients.map((ing: IngredientResult) => ({
      name: String(ing.name),
      estimatedWeightGrams: Number(ing.estimatedWeightGrams) || 0,
      volumeMl: ing.volumeMl != null ? Number(ing.volumeMl) : undefined,
      confidence: Math.min(1, Math.max(0, Number(ing.confidence) || 0.5)),
    })),
    healthScore: Math.min(100, Math.max(0, Number(parsed.healthScore) || 0)),
    mealTitle: parsed.mealTitle ? String(parsed.mealTitle) : undefined,
    detectedCategory: parsed.detectedCategory
      ? String(parsed.detectedCategory)
      : undefined,
  };
  return aiMealAnalysisSchema.parse(cleaned);
}

/**
 * Run the VLM meal analysis. Accepts a data URL or http URL.
 * Returns the validated analysis + the raw model text.
 */
export async function analyzeMealImage(opts: {
  image: string;
  referenceObject?: string;
}): Promise<{ analysis: AiMealAnalysis; raw: string }> {
  const ref =
    REFERENCE_SIZES[opts.referenceObject || "plate"] ||
    REFERENCE_SIZES.plate;
  const prompt = PROMPT_TEMPLATE.replace("{referenceObject}", ref);

  const zai = await getZai();
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: opts.image } },
        ],
      },
    ],
    thinking: { type: "disabled" },
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const analysis = parseAnalysisResponse(raw);
  return { analysis, raw };
}

// Per-100g macro estimates for common ingredient categories (kcal/protein/carbs/fat per 100g).
// Used by the macro calculation step when an ingredient is not in the foods DB.
const CATEGORY_MACROS: Record<
  string,
  { calories: number; protein: number; carbs: number; fat: number; density: number }
> = {
  // proteins
  chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6, density: 1.05 },
  beef: { calories: 250, protein: 26, carbs: 0, fat: 17, density: 1.05 },
  pork: { calories: 242, protein: 27, carbs: 0, fat: 14, density: 1.05 },
  fish: { calories: 206, protein: 22, carbs: 0, fat: 12, density: 1.0 },
  salmon: { calories: 208, protein: 20, carbs: 0, fat: 13, density: 1.0 },
  egg: { calories: 155, protein: 13, carbs: 1.1, fat: 11, density: 1.03 },
  tofu: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8, density: 0.95 },
  shrimp: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3, density: 1.0 },
  // dairy
  cheese: { calories: 402, protein: 25, carbs: 1.3, fat: 33, density: 0.9 },
  milk: { calories: 42, protein: 3.4, carbs: 5, fat: 1, density: 1.03 },
  yogurt: { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, density: 1.03 },
  butter: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, density: 0.95 },
  cream: { calories: 340, protein: 2.8, carbs: 3, fat: 36, density: 0.99 },
  // carbs / grains
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, density: 0.85 },
  pasta: { calories: 158, protein: 5.8, carbs: 31, fat: 0.9, density: 0.85 },
  bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2, density: 0.5 },
  oat: { calories: 389, protein: 16.9, carbs: 66, fat: 6.9, density: 0.8 },
  potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1, density: 1.05 },
  pancake: { calories: 227, protein: 6, carbs: 28, fat: 10, density: 0.7 },
  noodle: { calories: 138, protein: 5, carbs: 25, fat: 2, density: 0.85 },
  // veg
  salad: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, density: 0.3 },
  spinach: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, density: 0.35 },
  lettuce: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, density: 0.3 },
  tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, density: 0.95 },
  avocado: { calories: 160, protein: 2, carbs: 9, fat: 15, density: 0.96 },
  broccoli: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, density: 0.5 },
  carrot: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, density: 0.9 },
  onion: { calories: 40, protein: 1.1, carbs: 9, fat: 0.1, density: 0.9 },
  // fruit
  apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, density: 0.78 },
  banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, density: 0.94 },
  blueberry: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, density: 0.85 },
  strawberry: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, density: 0.7 },
  orange: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, density: 0.9 },
  // fats / sauces / sweets
  oil: { calories: 884, protein: 0, carbs: 0, fat: 100, density: 0.92 },
  syrup: { calories: 322, protein: 0, carbs: 83, fat: 0, density: 1.33 },
  honey: { calories: 304, protein: 0.3, carbs: 82, fat: 0, density: 1.42 },
  sugar: { calories: 387, protein: 0, carbs: 100, fat: 0, density: 0.85 },
  peanutbutter: { calories: 588, protein: 25, carbs: 20, fat: 50, density: 1.1 },
  sauce: { calories: 100, protein: 1, carbs: 20, fat: 1, density: 1.1 },
  // drinks
  coffee: { calories: 1, protein: 0.1, carbs: 0, fat: 0, density: 1.0 },
  juice: { calories: 45, protein: 0.5, carbs: 11, fat: 0.1, density: 1.05 },
  // generic / fallback
  default: { calories: 200, protein: 8, carbs: 25, fat: 8, density: 0.9 },
};

function matchCategory(name: string): keyof typeof CATEGORY_MACROS {
  const n = name.toLowerCase().replace(/\s+/g, "");
  for (const key of Object.keys(CATEGORY_MACROS)) {
    if (n.includes(key)) return key as keyof typeof CATEGORY_MACROS;
  }
  return "default";
}

/**
 * Calculate macros for a list of ingredients using the category table.
 * Returns total macros.
 */
export function calculateMacros(
  ingredients: IngredientResult[]
): Macros {
  let calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0;
  for (const ing of ingredients) {
    const cat = matchCategory(ing.name);
    const m = CATEGORY_MACROS[cat];
    const grams = ing.estimatedWeightGrams;
    calories += (m.calories * grams) / 100;
    protein += (m.protein * grams) / 100;
    carbs += (m.carbs * grams) / 100;
    fat += (m.fat * grams) / 100;
  }
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

/** Get density (g/ml) for an ingredient name (for volume->weight correction). */
export function getDensity(name: string): number {
  const cat = matchCategory(name);
  return CATEGORY_MACROS[cat].density;
}
