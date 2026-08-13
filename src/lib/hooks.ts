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
    timestamp: string;
    corrected: boolean;
  }>;
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
      corrected?: boolean;
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
