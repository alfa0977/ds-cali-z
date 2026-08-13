"use client";
import { useApp } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { HomeDashboard } from "@/features/dashboard/home-dashboard";
import { AddActionSheet } from "@/features/dashboard/add-action-sheet";
import { ScannerSheet } from "@/features/scanner/scanner-sheet";
import { BarcodeScannerSheet } from "@/features/scanner/barcode-scanner-sheet";
import { AddWorkoutSheet } from "@/features/scanner/add-workout-sheet";
import { EditLogSheet } from "@/features/scanner/edit-log-sheet";
import { FoodDatabaseSheet } from "@/features/food-database/food-database-sheet";
import { CreateFoodSheet } from "@/features/food-database/create-food-sheet";
import { ProgressDashboard } from "@/features/progress/progress-dashboard";
import { SettingsScreen } from "@/features/settings/settings-screen";
import { PaywallSheet } from "@/features/paywall/paywall-sheet";
import { EditProfileSheet, EditGoalsSheet } from "@/features/settings/edit-sheets";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";
import { MealDetailSheet } from "@/features/scanner/meal-detail-sheet";
import { FavoritesSheet } from "@/features/dashboard/favorites-sheet";
import { GoalCelebration } from "@/features/dashboard/goal-celebration";
import { RemindersSheet } from "@/features/settings/reminders-sheet";
import { ShareSheet } from "@/features/settings/share-sheet";
import { PullToRefreshIndicator } from "@/components/pull-to-refresh-indicator";
import { usePullToRefresh } from "@/lib/use-pull-to-refresh";
import { PageTransition, SheetWrapper } from "@/components/motion";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useDashboard, useFavorites } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const { tab, modal, setModal, setEditingLog } = useApp();
  const { data, isLoading } = useDashboard();
  const qc = useQueryClient();
  const mainRef = useRef<HTMLElement>(null);

  const { ref: ptrRef, pullDistance, pullProgress, isRefreshing, touchHandlers } = usePullToRefresh({
    onRefresh: async () => {
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModal(null);
        setEditingLog(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setModal, setEditingLog]);

  // Show onboarding if user hasn't completed it
  if (!isLoading && data && !data.user.onboarded) {
    return <OnboardingFlow />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GoalCelebration />
      <div className="phone-frame bg-background flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Scrollable content with pull-to-refresh */}
        <main
          ref={ptrRef}
          className="relative flex-1 overflow-y-auto thin-scrollbar pt-2 pb-28"
          {...touchHandlers}
        >
          <PullToRefreshIndicator
            pullDistance={pullDistance}
            pullProgress={pullProgress}
            isRefreshing={isRefreshing}
          />
          <AnimatePresence mode="wait">
            {tab === "home" && (
              <PageTransition key="home" k="home">
                <HomeDashboard />
              </PageTransition>
            )}
            {tab === "progress" && (
              <PageTransition key="progress" k="progress">
                <ProgressDashboard />
              </PageTransition>
            )}
            {tab === "settings" && (
              <PageTransition key="settings" k="settings">
                <SettingsScreen />
              </PageTransition>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom nav + FAB */}
        <BottomNav />

        {/* Modals — full-screen overlays within the phone frame */}
        <AnimatePresence>
          {modal && (
            <SheetWrapper key={modal}>
              {modal === "add-action" && <AddActionSheet />}
              {modal === "scanner" && <ScannerSheet />}
              {modal === "barcode" && <BarcodeScannerSheet />}
              {modal === "food-db" && <FoodDatabaseSheet />}
              {modal === "create-food" && <CreateFoodSheet />}
              {modal === "meal-detail" && <MealDetailSheet />}
              {modal === "favorites" && <FavoritesSheet />}
              {modal === "add-workout" && <AddWorkoutSheet />}
              {modal === "paywall" && <PaywallSheet />}
              {modal === "edit-profile" && <EditProfileSheet />}
              {modal === "edit-goals" && <EditGoalsSheet />}
              {modal === "edit-log" && <EditLogSheet />}
              {modal === "reminders" && <RemindersSheet />}
              {modal === "share" && <ShareSheet />}
            </SheetWrapper>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
