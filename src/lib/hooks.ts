"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface DashboardData {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    goals: { calories: number; protein: number; carbs: number; fat: number };
    weightKg: number | null;
    heightCm: number | null;
    age: number | null;
    sex: string | null;
    activityLevel: string | null;
    goal: string | null;
    onboarded: boolean;
    subscriptionStatus: string;
    streak: number;
  };
  todayHealth: {
    date: string;
    steps: number;
    activeEnergyKcal: number;
    waterMl: number;
    weightKg: number | null;
    workouts: Array<{
      type: string;
      durationMinutes: number;
      intensity: string;
      caloriesBurned: number;
    }>;
  } | null;
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  burned: number;
  netCalories: number;
  dayLogs: Array<{
    id: string;
    type: string;
    mealId: string | null;
    macros: { calories: number; protein: number; carbs: number; fat: number } | null;
    waterMl: number | null;
    workoutSummary: {
      type: string;
      durationMinutes: number;
      intensity: string;
      caloriesBurned: number;
    } | null;
    imageUrl: string | null;
    title: string | null;
    mealSlot: string | null;
    timestamp: string;
    corrected: boolean;
  }>;
  mealsBySlot: {
    breakfast: DashboardData["dayLogs"];
    lunch: DashboardData["dayLogs"];
    dinner: DashboardData["dayLogs"];
    snack: DashboardData["dayLogs"];
  };
  weekHealth: Array<{
    date: string;
    steps: number;
    waterMl: number;
    weightKg: number | null;
    activeEnergyKcal: number;
  }>;
  monthHealth: Array<{
    date: string;
    weightKg: number | null;
    steps: number;
    waterMl: number;
    activeEnergyKcal: number;
  }>;
  macroTrend: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  recentLogs: DashboardData["dayLogs"];
  daysLogged: number;
}

export function useDashboard(date?: string) {
  return useQuery({
    queryKey: ["dashboard", date],
    queryFn: async () => {
      const params = date ? `?date=${date}` : "";
      const res = await fetch(`/api/getUserDashboard${params}`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      return (await res.json()) as DashboardData;
    },
  });
}

export function useAnalyzeMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (image: string) => {
      const res = await fetch("/api/analyzeMeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Analysis failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Meal analyzed!");
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useLogMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      source?: string;
      ingredients: Array<{ name: string; estimatedWeightGrams: number; confidence: number; volumeMl?: number }>;
      macros: { calories: number; protein: number; carbs: number; fat: number };
      healthScore: number;
      imageUrl?: string;
      title?: string;
      mealSlot?: string;
      corrected?: boolean;
      timestamp?: string;
    }) => {
      const res = await fetch("/api/logMeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log meal");
      return res.json();
    },
    onSuccess: () => toast.success("Meal logged"),
    onError: () => toast.error("Failed to log meal"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useSearchFoods() {
  return useQuery({
    queryKey: ["foods", "all"],
    queryFn: async () => {
      const res = await fetch(`/api/searchFoods?limit=60`);
      if (!res.ok) throw new Error("Failed to load foods");
      const data = await res.json();
      return data.foods as Array<{
        id: string;
        name: string;
        servingSize: string;
        servingWeightGrams: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        category: string | null;
        emoji: string | null;
        source: string;
      }>;
    },
  });
}

export function useLogFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { foodId?: string; manualFood?: Record<string, unknown>; servings?: number }) => {
      const res = await fetch("/api/logFood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log food");
      return res.json();
    },
    onSuccess: () => toast.success("Food logged"),
    onError: () => toast.error("Failed to log food"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useLogWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deltaMl: number) => {
      const res = await fetch("/api/logWater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deltaMl }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useLogWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: string;
      durationMinutes: number;
      intensity: "low" | "medium" | "high";
      caloriesBurned: number;
    }) => {
      const res = await fetch("/api/logWorkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => toast.success("Workout logged"),
    onError: () => toast.error("Failed to log workout"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      displayName?: string;
      goals?: { calories: number; protein: number; carbs: number; fat: number };
      weightKg?: number;
      heightCm?: number;
    }) => {
      const res = await fetch("/api/updateUser", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => toast.success("Profile updated"),
    onError: () => toast.error("Failed to update profile"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useLookupBarcode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`/api/lookupBarcode?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Product not found");
      }
      return res.json();
    },
    onSuccess: () => toast.success("Product found!"),
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useDeleteLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/deleteLog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => toast.success("Entry deleted"),
    onError: () => toast.error("Failed to delete"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useUpdateLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      logId: string;
      title?: string;
      macros?: { calories: number; protein: number; carbs: number; fat: number };
      ingredients?: Array<{ name: string; estimatedWeightGrams: number; confidence: number; volumeMl?: number }>;
    }) => {
      const res = await fetch("/api/updateLog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => toast.success("Entry updated"),
    onError: () => toast.error("Failed to update"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useOnboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      displayName: string;
      sex: "male" | "female" | "other";
      age: number;
      heightCm: number;
      weightKg: number;
      activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
      goal: "lose" | "maintain" | "gain";
      targetWeightKg?: number;
    }) => {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Onboarding failed");
      return res.json();
    },
    onSuccess: () => toast.success("Welcome to CalAI! 🎉"),
    onError: () => toast.error("Failed to complete onboarding"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export interface Favorite {
  id: string;
  name: string;
  emoji: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string | null;
  foodId: string | null;
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites");
      if (!res.ok) throw new Error("Failed to load favorites");
      const data = await res.json();
      return data.favorites as Favorite[];
    },
  });
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      foodId?: string;
      name: string;
      emoji?: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      servingSize?: string;
    }) => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add favorite");
      return res.json();
    },
    onSuccess: () => toast.success("Added to favorites"),
    onError: () => toast.error("Failed to add favorite"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/favorites?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      return res.json();
    },
    onSuccess: () => toast.success("Removed from favorites"),
    onError: () => toast.error("Failed to remove"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}

export function useMealDetail(id?: string) {
  return useQuery({
    queryKey: ["meal", id],
    queryFn: async () => {
      const res = await fetch(`/api/mealDetail?id=${id}`);
      if (!res.ok) throw new Error("Failed to load meal");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useImportData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch("/api/importData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: (data) => toast.success(`Imported ${data.imported?.meals ?? 0} meals, ${data.imported?.logs ?? 0} logs`),
    onError: () => toast.error("Failed to import data"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

/** Upload a meal image (data URL) to /download/meal-images and return the public path. */
export async function uploadMealImage(image: string): Promise<string> {
  // If it's already an http URL, no need to upload
  if (image.startsWith("http")) return image;
  // If it's a data URL, upload it
  if (image.startsWith("data:image")) {
    try {
      const res = await fetch("/api/uploadImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) {
      console.error("Image upload failed:", e);
    }
  }
  return image;
}

export interface MealSuggestion {
  id: string;
  name: string;
  emoji: string | null;
  category: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  score: number;
  foodId?: string;
}

export function useMealSuggestions(slot?: string) {
  return useQuery({
    queryKey: ["mealSuggestions", slot],
    queryFn: async () => {
      const params = slot ? `?slot=${slot}` : "";
      const res = await fetch(`/api/mealSuggestions${params}`);
      if (!res.ok) throw new Error("Failed to load suggestions");
      return res.json();
    },
  });
}

export interface ChallengeData {
  challenges: Array<{
    id: string;
    type: string;
    status: string;
    progress: number;
    daysCompleted: number;
    targetDays: number;
    joinedAt: string;
    completedAt: string | null;
    def: {
      targetDays: number;
      labelFa: string;
      labelEn: string;
      descFa: string;
      descEn: string;
      emoji: string;
      rewardFa: string;
      rewardEn: string;
    };
  }>;
  available: Array<{
    type: string;
    targetDays: number;
    labelFa: string;
    labelEn: string;
    descFa: string;
    descEn: string;
    emoji: string;
    rewardFa: string;
    rewardEn: string;
    joined: boolean;
  }>;
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const res = await fetch("/api/challenges");
      if (!res.ok) throw new Error("Failed to load challenges");
      return res.json() as Promise<ChallengeData>;
    },
  });
}

export function useJoinChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (type: string) => {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useLeaveChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id?: string; type?: string }) => {
      const res = await fetch("/api/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action: "leave" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}
