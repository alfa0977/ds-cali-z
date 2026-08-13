// JSON helpers for Prisma SQLite (which has no native JSON/array type).
import type { Macros, IngredientResult, WorkoutSummary } from "@/lib/contracts/types";

export function parseMacros(s: string | null | undefined): Macros {
  if (!s) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  try {
    return JSON.parse(s) as Macros;
  } catch {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
}

export function parseIngredients(s: string | null | undefined): IngredientResult[] {
  if (!s) return [];
  try {
    return JSON.parse(s) as IngredientResult[];
  } catch {
    return [];
  }
}

export function parseWorkouts(s: string | null | undefined): WorkoutSummary[] {
  if (!s) return [];
  try {
    return JSON.parse(s) as WorkoutSummary[];
  } catch {
    return [];
  }
}

export function stringifyJson(v: unknown): string {
  return JSON.stringify(v);
}
