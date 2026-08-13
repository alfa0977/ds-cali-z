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
  | "edit-log";

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
  setTab: (t: TabKey) => void;
  setModal: (m: ModalKey) => void;
  setSelectedDate: (d: string) => void;
  setLastAnalysis: (a: Record<string, unknown> | null) => void;
  setEditingLog: (l: AppState["editingLog"]) => void;
}

export const useApp = create<AppState>((set) => ({
  tab: "home",
  modal: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  lastAnalysis: null,
  editingLog: null,
  setTab: (tab) => set({ tab, modal: null }),
  setModal: (modal) => set({ modal }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLastAnalysis: (lastAnalysis) => set({ lastAnalysis }),
  setEditingLog: (editingLog) => set({ editingLog }),
}));
