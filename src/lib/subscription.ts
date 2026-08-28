// Subscription tier system — controls free vs premium features.
// Used by components to gate features (e.g., unlimited AI scans, advanced analytics).

export type SubscriptionTier = "free" | "premium";

export interface SubscriptionConfig {
  tier: SubscriptionTier;
  // Feature flags
  maxAiScansPerDay: number; // -1 = unlimited
  maxFoodLogsPerDay: number; // -1 = unlimited
  advancedAnalytics: boolean;
  customThemes: boolean;
  exportData: boolean;
  challenges: boolean;
  mealPlanning: boolean;
}

const FREE_TIER: SubscriptionConfig = {
  tier: "free",
  maxAiScansPerDay: 5,
  maxFoodLogsPerDay: -1, // unlimited food logging
  advancedAnalytics: false,
  customThemes: false, // only orange + green for free
  exportData: true,
  challenges: true,
  mealPlanning: false,
};

const PREMIUM_TIER: SubscriptionConfig = {
  tier: "premium",
  maxAiScansPerDay: -1, // unlimited
  maxFoodLogsPerDay: -1,
  advancedAnalytics: true,
  customThemes: true,
  exportData: true,
  challenges: true,
  mealPlanning: true,
};

const STORAGE_KEY = "ds-cali-subscription";

export function getSubscriptionConfig(): SubscriptionConfig {
  if (typeof window === "undefined") return FREE_TIER;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { tier: SubscriptionTier; trialEndDate?: string };
      if (parsed.tier === "premium") {
        // Check if trial has expired
        if (parsed.trialEndDate) {
          const endDate = new Date(parsed.trialEndDate);
          if (endDate < new Date()) {
            // Trial expired → revert to free
            saveSubscriptionTier("free");
            return FREE_TIER;
          }
        }
        return PREMIUM_TIER;
      }
    }
  } catch {}
  return FREE_TIER;
}

export function getSubscriptionTier(): SubscriptionTier {
  return getSubscriptionConfig().tier;
}

export function saveSubscriptionTier(tier: SubscriptionTier, trialDays: number = 7): void {
  try {
    const data: { tier: SubscriptionTier; trialEndDate?: string } = { tier };
    if (tier === "premium" && trialDays > 0) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + trialDays);
      data.trialEndDate = endDate.toISOString();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function startPremiumTrial(days: number = 7): void {
  saveSubscriptionTier("premium", days);
}

export function cancelPremium(): void {
  saveSubscriptionTier("free");
}

/** Count today's AI scans from IndexedDB (for free-tier limit enforcement). */
export async function getTodaysAiScanCount(): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    // Check if we're in static mode (IndexedDB)
    const { isStaticMode } = await import("@/lib/env");
    if (!isStaticMode()) {
      // Web mode: use a simple localStorage counter
      const key = `ds-cali-ai-scans-${new Date().toISOString().slice(0, 10)}`;
      return Number(localStorage.getItem(key) ?? "0");
    }
    // APK mode: count meals logged today with source "ai"
    const { openDB } = await import("idb");
    const db = await openDB("ds-cali-db", 1);
    const logs = await db.getAll("logs");
    const today = new Date().toISOString().slice(0, 10);
    return logs.filter((l: { type: string; timestamp: string }) =>
      l.type === "meal" && l.timestamp.slice(0, 10) === today
    ).length;
  } catch {
    return 0;
  }
}

export function incrementAiScanCount(): void {
  if (typeof window === "undefined") return;
  const key = `ds-cali-ai-scans-${new Date().toISOString().slice(0, 10)}`;
  const current = Number(localStorage.getItem(key) ?? "0");
  localStorage.setItem(key, String(current + 1));
}

export function canScanMeal(): { allowed: boolean; reason?: string; remaining?: number } {
  const config = getSubscriptionConfig();
  if (config.maxAiScansPerDay === -1) return { allowed: true };
  // Note: actual count is checked at scan time; this is a synchronous pre-check
  return { allowed: true, remaining: config.maxAiScansPerDay };
}

export async function canScanMealAsync(): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const config = getSubscriptionConfig();
  if (config.maxAiScansPerDay === -1) return { allowed: true, remaining: -1 };
  const used = await getTodaysAiScanCount();
  const remaining = Math.max(0, config.maxAiScansPerDay - used);
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: "You've reached your daily AI scan limit. Upgrade to Premium for unlimited scans.",
      remaining: 0,
    };
  }
  return { allowed: true, remaining };
}
