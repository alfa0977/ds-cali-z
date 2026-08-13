// Shared TypeScript types — mirrors docs/DATA_MODEL.md
// These are the canonical types used across frontend & backend.

export type SubscriptionStatus = "active" | "trialing" | "expired" | "none";

export interface Macros {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export type Goals = Macros;

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  goals: Goals;
  weightKg: number | null;
  heightCm: number | null;
  subscriptionStatus: SubscriptionStatus;
  revenueCatId: string | null;
  streak: number;
  createdAt: Date;
  lastLoginAt: Date;
}

export type FoodSource = "database" | "user" | "ai";

export interface Food {
  id: string;
  name: string;
  servingSize: string;
  servingWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodSource;
  barcode: string | null;
  densityGramsPerMl: number | null;
  category: string | null;
  emoji: string | null;
  createdBy: string | null;
}

export interface IngredientResult {
  name: string;
  estimatedWeightGrams: number;
  volumeMl?: number;
  confidence: number; // 0-1
}

export type MealSource = "ai" | "manual" | "barcode";

export interface Meal {
  id: string;
  userId: string;
  source: MealSource;
  ingredients: IngredientResult[];
  macros: Macros;
  healthScore: number; // 0-100
  imageUrl: string | null;
  depthMapUrl: string | null;
  title: string | null;
  createdAt: Date;
}

export type LogType = "meal" | "water" | "workout";

export interface WorkoutSummary {
  type: string;
  durationMinutes: number;
  intensity: "low" | "medium" | "high";
  caloriesBurned: number;
}

export interface LogEntry {
  id: string;
  userId: string;
  type: LogType;
  mealId: string | null;
  macros: Macros | null;
  waterMl: number | null;
  workoutSummary: WorkoutSummary | null;
  imageUrl: string | null;
  title: string | null;
  timestamp: Date;
  corrected: boolean;
}

export interface HealthDaily {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  steps: number;
  activeEnergyKcal: number;
  waterMl: number;
  weightKg: number | null;
  workouts: WorkoutSummary[];
  updatedAt: Date;
}

export interface AiAnalysis {
  id: string;
  userId: string;
  rawResponse: unknown;
  correctedResponse: unknown;
  imageUrl: string;
  depthMapUrl: string | null;
  createdAt: Date;
}
