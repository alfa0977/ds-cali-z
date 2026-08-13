// Zod schemas for all API request/response validation.
import { z } from "zod";

export const mealSlotSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const macrosSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

export const goalsSchema = macrosSchema;

export const ingredientResultSchema = z.object({
  name: z.string().min(1),
  estimatedWeightGrams: z.number().min(0),
  volumeMl: z.number().min(0).optional(),
  confidence: z.number().min(0).max(1),
});

// AI vision model output schema
export const aiMealAnalysisSchema = z.object({
  ingredients: z.array(ingredientResultSchema).min(1),
  healthScore: z.number().min(0).max(100),
  mealTitle: z.string().optional(),
  detectedCategory: z.string().optional(), // e.g. Breakfast, Lunch
});

export type AiMealAnalysis = z.infer<typeof aiMealAnalysisSchema>;

// ---- API request bodies ----

export const analyzeMealRequestSchema = z.object({
  image: z.string().min(1), // data URL or http URL
  referenceObject: z.string().default("plate"),
});

export const logMealRequestSchema = z.object({
  source: z.enum(["ai", "manual", "barcode"]).default("ai"),
  ingredients: z.array(ingredientResultSchema),
  macros: macrosSchema,
  healthScore: z.number().min(0).max(100),
  imageUrl: z.string().optional(),
  title: z.string().optional(),
  mealSlot: mealSlotSchema.optional(),
  corrected: z.boolean().default(false),
});

export const searchFoodsRequestSchema = z.object({
  q: z.string().default(""),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(30),
});

export const logFoodRequestSchema = z.object({
  foodId: z.string().optional(),
  servings: z.number().min(0.1).default(1),
  mealSlot: mealSlotSchema.optional(),
  manualFood: z
    .object({
      name: z.string().min(1),
      servingSize: z.string().default("1 serving"),
      servingWeightGrams: z.number().min(0).default(100),
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
      emoji: z.string().optional(),
      category: z.string().optional(),
    })
    .optional(),
  timestamp: z.string().optional(),
});

export const syncHealthRequestSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  steps: z.number().min(0).optional(),
  activeEnergyKcal: z.number().min(0).optional(),
  waterMl: z.number().min(0).optional(),
  weightKg: z.number().min(0).optional(),
  workouts: z
    .array(
      z.object({
        type: z.string(),
        durationMinutes: z.number().min(0),
        intensity: z.enum(["low", "medium", "high"]),
        caloriesBurned: z.number().min(0),
      })
    )
    .optional(),
});

export const logWaterRequestSchema = z.object({
  deltaMl: z.number(),
  date: z.string().optional(),
});

export const getUserDashboardRequestSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

export const updateUserRequestSchema = z.object({
  displayName: z.string().optional(),
  goals: goalsSchema.optional(),
  weightKg: z.number().min(0).optional(),
  heightCm: z.number().min(0).optional(),
  age: z.number().min(1).max(120).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional(),
  goal: z.enum(["lose", "maintain", "gain"]).optional(),
  onboarded: z.boolean().optional(),
});

// Onboarding completes user profile + computes goals
export const onboardRequestSchema = z.object({
  displayName: z.string().min(1),
  sex: z.enum(["male", "female", "other"]),
  age: z.number().min(10).max(120),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  targetWeightKg: z.number().min(30).max(300).optional(),
});

export const logWorkoutRequestSchema = z.object({
  type: z.string().min(1),
  durationMinutes: z.number().min(1),
  intensity: z.enum(["low", "medium", "high"]),
  caloriesBurned: z.number().min(0),
});
