"use client";
import { useApp } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { HomeDashboard } from "@/features/dashboard/home-dashboard";
import { AddActionSheet } from "@/features/dashboard/add-action-sheet";
import { ScannerSheet } from "@/features/scanner/scanner-sheet";
import { AddWorkoutSheet } from "@/features/scanner/add-workout-sheet";
import { FoodDatabaseSheet } from "@/features/food-database/food-database-sheet";
import { ProgressDashboard } from "@/features/progress/progress-dashboard";
import { SettingsScreen } from "@/features/settings/settings-screen";
import { PaywallSheet } from "@/features/paywall/paywall-sheet";
import { EditProfileSheet, EditGoalsSheet } from "@/features/settings/edit-sheets";
import { useEffect } from "react";

export default function Home() {
  const { tab, modal, setModal } = useApp();

  // Close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModal(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setModal]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="phone-frame bg-background flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto thin-scrollbar pt-2 pb-28">
          {tab === "home" && <HomeDashboard />}
          {tab === "progress" && <ProgressDashboard />}
          {tab === "settings" && <SettingsScreen />}
        </main>

        {/* Bottom nav + FAB */}
        <BottomNav />

        {/* Modals — full-screen overlays within the phone frame */}
        {modal && (
          <div className="absolute inset-0 z-50 animate-in fade-in duration-200">
            {modal === "add-action" && <AddActionSheet />}
            {modal === "scanner" && <ScannerSheet />}
            {modal === "food-db" && <FoodDatabaseSheet />}
            {modal === "add-workout" && <AddWorkoutSheet />}
            {modal === "paywall" && <PaywallSheet />}
            {modal === "edit-profile" && <EditProfileSheet />}
            {modal === "edit-goals" && <EditGoalsSheet />}
          </div>
        )}
      </div>
    </div>
  );
}
