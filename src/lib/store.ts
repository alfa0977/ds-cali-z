"use client";
import { create } from "zustand";

export type TabKey = "home" | "progress" | "settings";
export type ModalKey =
  | null
  | "scanner"
  | "result"
  | "food-db"
  | "add-workout"
  | "add-action"
  | "paywall"
  | "edit-profile"
  | "edit-goals";

interface AppState {
  tab: TabKey;
  modal: ModalKey;
  selectedDate: string;
  lastAnalysis: Record<string, unknown> | null;
  setTab: (t: TabKey) => void;
  setModal: (m: ModalKey) => void;
  setSelectedDate: (d: string) => void;
  setLastAnalysis: (a: Record<string, unknown> | null) => void;
}

export const useApp = create<AppState>((set) => ({
  tab: "home",
  modal: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  lastAnalysis: null,
  setTab: (tab) => set({ tab, modal: null }),
  setModal: (modal) => set({ modal }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLastAnalysis: (lastAnalysis) => set({ lastAnalysis }),
}));
