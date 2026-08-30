// Notification utility — delegates to Capacitor LocalNotifications in APK mode,
// and uses the web Notification API on browser.
// Used by the reminders feature.

import {
  getNativeNotificationPermission,
  requestNativeNotificationPermission,
  showNativeNotification,
  type NativePermission,
} from "@/lib/native-bridge";

export type NotificationPermission = "default" | "granted" | "denied";

function map(p: NativePermission): NotificationPermission {
  if (p === "granted") return "granted";
  if (p === "denied") return "denied";
  return "default";
}

export function getNotificationPermission(): NotificationPermission {
  // The native call is async, but this function is sync for legacy reasons.
  // We return the cached browser value immediately; the reminders sheet also
  // calls the async version on mount via useEffect.
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return (Notification.permission as NotificationPermission) ?? "default";
}

export async function getNotificationPermissionAsync(): Promise<NotificationPermission> {
  return map(await getNativeNotificationPermission());
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return map(await requestNativeNotificationPermission());
}

export function showNotification(title: string, options?: NotificationOptions) {
  // Fire-and-forget — the native bridge handles both Capacitor and web.
  void showNativeNotification(title, options?.body);
}

// Schedule a notification at a specific time (HH:MM format)
// Returns a timeout ID that can be cleared.
export function scheduleNotification(
  time: string,
  title: string,
  body: string
): number | null {
  if (typeof window === "undefined") return null;
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  const delay = scheduled.getTime() - now.getTime();
  return window.setTimeout(() => {
    void showNativeNotification(title, body);
  }, delay);
}

// Reminder presets
export const REMINDER_PRESETS = [
  { id: "breakfast", label: "Log breakfast", time: "08:00", icon: "🌅", body: "Start your day right — log your breakfast!" },
  { id: "lunch", label: "Log lunch", time: "12:30", icon: "☀️", body: "Don't forget to log your lunch!" },
  { id: "dinner", label: "Log dinner", time: "19:00", icon: "🌙", body: "Track your evening meal!" },
  { id: "water", label: "Drink water", time: "Every 2h", icon: "💧", body: "Time to drink a glass of water 💧" },
] as const;
