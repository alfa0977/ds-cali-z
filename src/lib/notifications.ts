// Browser notification utility — request permission, schedule, and show notifications.
// Used by the reminders feature.

export type NotificationPermission = "default" | "granted" | "denied";

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8D%8E%3C/text%3E%3C/svg%3E",
      badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8D%8E%3C/text%3E%3C/svg%3E",
      ...options,
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
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
    showNotification(title, { body });
  }, delay);
}

// Reminder presets
export const REMINDER_PRESETS = [
  { id: "breakfast", label: "Log breakfast", time: "08:00", icon: "🌅", body: "Start your day right — log your breakfast!" },
  { id: "lunch", label: "Log lunch", time: "12:30", icon: "☀️", body: "Don't forget to log your lunch!" },
  { id: "dinner", label: "Log dinner", time: "19:00", icon: "🌙", body: "Track your evening meal!" },
  { id: "water", label: "Drink water", time: "Every 2h", icon: "💧", body: "Time to drink a glass of water 💧" },
] as const;
