// Multi-engine AI meal analysis system.
// Supports multiple AI providers so the user can choose which one to use (or add their own API key).
// Engines:
//   1. "heuristic" — offline, no API key needed (default; recognizes sample meals + generic estimate)
//   2. "openai"    — OpenAI Vision API (user provides API key)
//   3. "gemini"    — Google Gemini API (user provides API key)
//   4. "remote"    — calls a remote Z-AI VLM service (configurable URL, e.g. mini-services/ai-vlm-service)
//
// All engines return the same shape: { ingredients, macros, healthScore, mealTitle, detectedCategory }

export type AiEngineKey = "heuristic" | "openai" | "gemini" | "remote";

export interface AiEngineConfig {
  key: AiEngineKey;
  label: string;
  labelFa: string;
  description: string;
  descriptionFa: string;
  requiresApiKey: boolean;
  requiresUrl: boolean;
  icon: string;
}

export const AI_ENGINES: AiEngineConfig[] = [
  {
    key: "heuristic",
    label: "Heuristic (offline)",
    labelFa: "اکتشافی (آفلاین)",
    description: "No API key needed. Recognizes sample meals and gives a generic estimate for other foods.",
    descriptionFa: "نیاز به کلید API ندارد. غذاهای نمونه را تشخیص می‌دهد و برای بقیه تخمین عمومی می‌دهد.",
    requiresApiKey: false,
    requiresUrl: false,
    icon: "🤖",
  },
  {
    key: "openai",
    label: "OpenAI Vision (GPT-4o)",
    labelFa: "OpenAI Vision (GPT-4o)",
    description: "Uses OpenAI's GPT-4o vision model. Requires an API key from platform.openai.com.",
    descriptionFa: "از مدل GPT-4o شرکت OpenAI استفاده می‌کند. نیاز به کلید API از platform.openai.com دارد.",
    requiresApiKey: true,
    requiresUrl: false,
    icon: "🟢",
  },
  {
    key: "gemini",
    label: "Google Gemini",
    labelFa: "گوگل جمینای",
    description: "Uses Google's Gemini 1.5 Flash vision model. Requires an API key from aistudio.google.com.",
    descriptionFa: "از مدل Gemini 1.5 Flash گوگل استفاده می‌کند. نیاز به کلید API از aistudio.google.com دارد.",
    requiresApiKey: true,
    requiresUrl: false,
    icon: "🔵",
  },
  {
    key: "remote",
    label: "Remote Z-AI service",
    labelFa: "سرویس Z-AI ریموت",
    description: "Calls a remote server running the Z-AI VLM SDK. Requires a server URL.",
    descriptionFa: "به یک سرور ریموت که Z-AI VLM SDK را اجرا می‌کند متصل می‌شود. نیاز به آدرس سرور دارد.",
    requiresApiKey: false,
    requiresUrl: true,
    icon: "🌐",
  },
];

export interface AiSettings {
  engine: AiEngineKey;
  openaiApiKey: string;
  geminiApiKey: string;
  remoteUrl: string;
}

const STORAGE_KEY = "ds-cali-ai-settings";

export function getAiSettings(): AiSettings {
  if (typeof window === "undefined") {
    return { engine: "heuristic", openaiApiKey: "", geminiApiKey: "", remoteUrl: "" };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AiSettings>;
      return {
        engine: parsed.engine ?? "heuristic",
        openaiApiKey: parsed.openaiApiKey ?? "",
        geminiApiKey: parsed.geminiApiKey ?? "",
        remoteUrl: parsed.remoteUrl ?? "",
      };
    }
  } catch {}
  return { engine: "heuristic", openaiApiKey: "", geminiApiKey: "", remoteUrl: "" };
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export interface AnalysisResult {
  ingredients: Array<{ name: string; estimatedWeightGrams: number; confidence: number; volumeMl?: number }>;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  healthScore: number;
  mealTitle: string | null;
  detectedCategory: string | null;
}

const PROMPT = `You are Cal-AI, a nutritionist vision AI. Analyze the meal in this image and estimate each ingredient with its weight in grams.

Rules:
- Identify distinct ingredients (not the whole dish as one item).
- Estimate weight in grams for each ingredient based on visual portion.
- If the image is not a meal/food, return an empty ingredients array with healthScore 0.
- Confidence is 0-1 (how sure you are about identification + weight).
- healthScore is 0-100 based on nutritional balance (vegetables, whole foods, lean protein score higher; fried/sugary/processed score lower).
- Respond with ONLY a JSON object, no markdown, no prose.

JSON schema:
{
  "ingredients": [
    { "name": "string", "estimatedWeightGrams": number, "confidence": number }
  ],
  "healthScore": number,
  "mealTitle": "string (short, e.g. 'Pancakes with blueberries')",
  "detectedCategory": "Breakfast|Lunch|Dinner|Snack|Beverage"
}`;

function parseJsonResponse(raw: string): AnalysisResult {
  let text = raw.trim();
  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Extract first balanced JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  const parsed = JSON.parse(text);
  return {
    ingredients: (parsed.ingredients ?? []).map((ing: { name?: string; estimatedWeightGrams?: number; confidence?: number }) => ({
      name: String(ing.name ?? "Unknown"),
      estimatedWeightGrams: Number(ing.estimatedWeightGrams) || 0,
      confidence: Math.min(1, Math.max(0, Number(ing.confidence) || 0.5)),
    })),
    macros: calculateMacrosFromIngredients(parsed.ingredients ?? []),
    healthScore: Math.min(100, Math.max(0, Number(parsed.healthScore) || 0)),
    mealTitle: parsed.mealTitle ? String(parsed.mealTitle) : null,
    detectedCategory: parsed.detectedCategory ? String(parsed.detectedCategory) : null,
  };
}

// Per-100g macro estimates for common ingredient categories.
const CATEGORY_MACROS: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  beef: { calories: 250, protein: 26, carbs: 0, fat: 17 },
  pork: { calories: 242, protein: 27, carbs: 0, fat: 14 },
  fish: { calories: 206, protein: 22, carbs: 0, fat: 12 },
  salmon: { calories: 208, protein: 20, carbs: 0, fat: 13 },
  egg: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  tofu: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  shrimp: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  cheese: { calories: 402, protein: 25, carbs: 1.3, fat: 33 },
  milk: { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
  yogurt: { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  butter: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  cream: { calories: 340, protein: 2.8, carbs: 3, fat: 36 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  pasta: { calories: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  oat: { calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  pancake: { calories: 227, protein: 6, carbs: 28, fat: 10 },
  noodle: { calories: 138, protein: 5, carbs: 25, fat: 2 },
  salad: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  spinach: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  lettuce: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  avocado: { calories: 160, protein: 2, carbs: 9, fat: 15 },
  broccoli: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  carrot: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  onion: { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  blueberry: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  strawberry: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  orange: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  oil: { calories: 884, protein: 0, carbs: 0, fat: 100 },
  syrup: { calories: 322, protein: 0, carbs: 83, fat: 0 },
  honey: { calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  sugar: { calories: 387, protein: 0, carbs: 100, fat: 0 },
  peanutbutter: { calories: 588, protein: 25, carbs: 20, fat: 50 },
  sauce: { calories: 100, protein: 1, carbs: 20, fat: 1 },
  coffee: { calories: 1, protein: 0.1, carbs: 0, fat: 0 },
  juice: { calories: 45, protein: 0.5, carbs: 11, fat: 0.1 },
  default: { calories: 200, protein: 8, carbs: 25, fat: 8 },
};

function matchCategory(name: string): keyof typeof CATEGORY_MACROS {
  const n = name.toLowerCase().replace(/\s+/g, "");
  for (const key of Object.keys(CATEGORY_MACROS)) {
    if (n.includes(key)) return key as keyof typeof CATEGORY_MACROS;
  }
  return "default";
}

function calculateMacrosFromIngredients(ingredients: Array<{ name: string; estimatedWeightGrams: number }>): { calories: number; protein: number; carbs: number; fat: number } {
  let calories = 0, protein = 0, carbs = 0, fat = 0;
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

// ============ HEURISTIC ENGINE ============

interface SampleMealDef {
  match: string;
  title: string;
  ingredients: Array<{ name: string; estimatedWeightGrams: number; confidence: number }>;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  healthScore: number;
  detectedCategory: string;
}

const SAMPLE_MEAL_DEFS: SampleMealDef[] = [
  {
    match: "pancake",
    title: "Pancakes with blueberries",
    ingredients: [
      { name: "Pancake", estimatedWeightGrams: 180, confidence: 0.9 },
      { name: "Blueberries", estimatedWeightGrams: 40, confidence: 0.85 },
      { name: "Maple syrup", estimatedWeightGrams: 20, confidence: 0.7 },
    ],
    macros: { calories: 520, protein: 9, carbs: 88, fat: 14 },
    healthScore: 60,
    detectedCategory: "Breakfast",
  },
  {
    match: "salad",
    title: "Garden salad with dressing",
    ingredients: [
      { name: "Mixed greens", estimatedWeightGrams: 120, confidence: 0.92 },
      { name: "Tomato", estimatedWeightGrams: 60, confidence: 0.85 },
      { name: "Cucumber", estimatedWeightGrams: 50, confidence: 0.8 },
      { name: "Olive oil dressing", estimatedWeightGrams: 15, confidence: 0.7 },
    ],
    macros: { calories: 180, protein: 4, carbs: 14, fat: 12 },
    healthScore: 88,
    detectedCategory: "Lunch",
  },
  {
    match: "burger",
    title: "Cheeseburger",
    ingredients: [
      { name: "Beef patty", estimatedWeightGrams: 150, confidence: 0.95 },
      { name: "Cheese", estimatedWeightGrams: 25, confidence: 0.85 },
      { name: "Burger bun", estimatedWeightGrams: 60, confidence: 0.9 },
      { name: "Lettuce", estimatedWeightGrams: 10, confidence: 0.6 },
    ],
    macros: { calories: 540, protein: 30, carbs: 38, fat: 32 },
    healthScore: 45,
    detectedCategory: "Lunch",
  },
  {
    match: "sushi",
    title: "Sushi platter",
    ingredients: [
      { name: "Sushi rice", estimatedWeightGrams: 140, confidence: 0.9 },
      { name: "Salmon nigiri", estimatedWeightGrams: 50, confidence: 0.85 },
      { name: "Nori", estimatedWeightGrams: 5, confidence: 0.7 },
    ],
    macros: { calories: 350, protein: 16, carbs: 60, fat: 6 },
    healthScore: 72,
    detectedCategory: "Dinner",
  },
];

const GENERIC_MEAL: SampleMealDef = {
  match: "",
  title: "Mixed meal",
  ingredients: [
    { name: "Mixed protein", estimatedWeightGrams: 120, confidence: 0.5 },
    { name: "Mixed vegetables", estimatedWeightGrams: 100, confidence: 0.5 },
    { name: "Mixed carbs", estimatedWeightGrams: 90, confidence: 0.5 },
  ],
  macros: { calories: 480, protein: 28, carbs: 45, fat: 18 },
  healthScore: 65,
  detectedCategory: "Meal",
};

async function analyzeHeuristic(image: string): Promise<AnalysisResult> {
  await new Promise((r) => setTimeout(r, 600));
  const lower = String(image || "").toLowerCase();
  const match = SAMPLE_MEAL_DEFS.find((s) => lower.includes(s.match));
  const def = match ?? GENERIC_MEAL;
  return {
    ingredients: def.ingredients,
    macros: def.macros,
    healthScore: def.healthScore,
    mealTitle: def.title,
    detectedCategory: def.detectedCategory,
  };
}

// ============ OPENAI VISION ENGINE ============

async function analyzeOpenAI(image: string, apiKey: string): Promise<AnalysisResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 800,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${e.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  return parseJsonResponse(raw);
}

// ============ GOOGLE GEMINI ENGINE ============

async function analyzeGemini(image: string, apiKey: string): Promise<AnalysisResult> {
  const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
  const inlineData = base64Match
    ? { mimeType: `image/${base64Match[1]}`, data: base64Match[2] }
    : null;

  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          ...(inlineData ? [{ inline_data: inlineData }] : [{ text: "Image URL: " + image }]),
        ],
      },
    ],
    generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${e.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseJsonResponse(raw);
}

// ============ REMOTE Z-AI ENGINE ============

async function analyzeRemote(image: string, serviceUrl: string): Promise<AnalysisResult> {
  const res = await fetch(serviceUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Remote service error: ${e.error ?? res.statusText}`);
  }
  const data = await res.json();
  if (data.ingredients) return data as AnalysisResult;
  if (typeof data.raw === "string") return parseJsonResponse(data.raw);
  if (typeof data === "string") return parseJsonResponse(data);
  throw new Error("Remote service returned unexpected format");
}

// ============ MAIN ENTRY POINT ============

export async function analyzeMealWithEngine(image: string, settings?: AiSettings): Promise<AnalysisResult> {
  const s = settings ?? getAiSettings();
  try {
    switch (s.engine) {
      case "openai":
        if (!s.openaiApiKey) throw new Error("OpenAI API key not configured");
        return await analyzeOpenAI(image, s.openaiApiKey);
      case "gemini":
        if (!s.geminiApiKey) throw new Error("Gemini API key not configured");
        return await analyzeGemini(image, s.geminiApiKey);
      case "remote":
        if (!s.remoteUrl) throw new Error("Remote service URL not configured");
        return await analyzeRemote(image, s.remoteUrl);
      case "heuristic":
      default:
        return await analyzeHeuristic(image);
    }
  } catch (e) {
    console.error(`[AI engine: ${s.engine}] failed, falling back to heuristic:`, e);
    // Fallback to heuristic if the configured engine fails
    if (s.engine !== "heuristic") {
      return await analyzeHeuristic(image);
    }
    throw e;
  }
}
