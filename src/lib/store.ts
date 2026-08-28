"use client";
import { create } from "zustand";

export type TabKey = "home" | "progress" | "settings";
export type ModalKey =
  | null
  | "scanner"
  | "barcode"
  | "result"
  | "food-db"
  | "create-food"
  | "meal-detail"
  | "favorites"
  | "add-workout"
  | "add-action"
  | "paywall"
  | "edit-profile"
  | "edit-goals"
  | "edit-log"
  | "reminders"
  | "share"
  | "challenges"
  | "language"
  | "theme-color"
  | "privacy-data"
  | "quick-log";

export interface QuickLogPayload {
  foodId?: string;
  name: string;
  emoji?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  servingWeightGrams?: number;
  imageUrl?: string;
}

interface AppState {
  tab: TabKey;
  modal: ModalKey;
  selectedDate: string;
  lastAnalysis: Record<string, unknown> | null;
  editingLog: {
    id: string;
    type: string;
    title: string | null;
    macros: { calories: number; protein: number; carbs: number; fat: number } | null;
    mealId: string | null;
    timestamp?: string;
  } | null;
  quickLogPayload: QuickLogPayload | null;
  setTab: (t: TabKey) => void;
  setModal: (m: ModalKey) => void;
  setSelectedDate: (d: string) => void;
  setLastAnalysis: (a: Record<string, unknown> | null) => void;
  setEditingLog: (l: AppState["editingLog"]) => void;
  setQuickLogPayload: (p: QuickLogPayload | null) => void;
}

export const useApp = create<AppState>((set) => ({
  tab: "home",
  modal: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  lastAnalysis: null,
  editingLog: null,
  quickLogPayload: null,
  setTab: (tab) => set({ tab, modal: null }),
  setModal: (modal) => set({ modal }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLastAnalysis: (lastAnalysis) => set({ lastAnalysis }),
  setEditingLog: (editingLog) => set({ editingLog }),
  setQuickLogPayload: (quickLogPayload) => set({ quickLogPayload }),
}));
