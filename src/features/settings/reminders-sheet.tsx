"use client";
import { useState, useEffect } from "react";
import { X, Bell, Clock, Droplets, Sun, Moon, Utensils, BellRing } from "lucide-react";
import { useApp } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  type NotificationPermission,
} from "@/lib/notifications";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/date-utils";

interface Reminder {
  id: string;
  labelKey: "logBreakfast" | "logLunch" | "logDinner" | "drinkWater";
  descKey: "startYourDayRight" | "dontForgetMiddayMeals" | "trackYourEveningMeal" | "stayHydratedEvery2h";
  time: string;
  icon: typeof Bell;
  color: string;
  enabled: boolean;
}

const STORAGE_KEY = "calai_reminders";

export function RemindersSheet() {
  const { setModal } = useApp();
  const { locale, t } = useI18n();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: "breakfast", labelKey: "logBreakfast", descKey: "startYourDayRight", time: "08:00", icon: Sun, color: "var(--carbs)", enabled: true },
    { id: "lunch", labelKey: "logLunch", descKey: "dontForgetMiddayMeals", time: "12:30", icon: Utensils, color: "var(--protein)", enabled: true },
    { id: "dinner", labelKey: "logDinner", descKey: "trackYourEveningMeal", time: "19:00", icon: Moon, color: "var(--fats)", enabled: false },
    { id: "water", labelKey: "drinkWater", descKey: "stayHydratedEvery2h", time: locale === "fa" ? "هر ۲ ساعت" : "Every 2h", icon: Droplets, color: "var(--water)", enabled: true },
  ]);

  // Load saved state + permission
  useEffect(() => {
    const perm = getNotificationPermission();
    const timer = setTimeout(() => {
      setPermission(perm);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setReminders((prev) => prev.map((r) => ({ ...r, enabled: parsed[r.id] ?? r.enabled })));
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function toggle(id: string) {
    setReminders((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      return next;
    });
  }

  async function enableNotifications() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      showNotification(t("remindersEnabledTitle"), { body: t("remindersEnabledBody") });
      toast.success(t("notificationsEnabledToast"));
    } else {
      toast.error(t("notificationPermissionDenied"));
    }
  }

  function testNotification() {
    showNotification(t("testReminderTitle"), { body: t("testReminderBody") });
    toast.success(t("testNotificationSent"));
  }

  function save() {
    const enabledCount = reminders.filter((r) => r.enabled).length;
    try {
      const state: Record<string, boolean> = {};
      reminders.forEach((r) => { state[r.id] = r.enabled; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    toast.success(t("remindersSavedDesc").replace("{0}", formatNumber(enabledCount, locale)));
    setModal(null);
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <Bell className="h-4 w-4" />
          {t("reminders")}
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        {/* permission status */}
        {permission !== "granted" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex items-center gap-3 rounded-2xl bg-streak/10 p-3"
          >
            <BellRing className="h-5 w-5 shrink-0 text-streak" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-streak">{t("enableNotifications")}</div>
              <div className="text-xs text-muted-foreground">{t("getGentleNudges")}</div>
            </div>
            <Button size="sm" className="rounded-full" onClick={enableNotifications}>
              {t("enable")}
            </Button>
          </motion.div>
        )}

        {permission === "granted" && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            {t("notificationsEnabled")}
            <button onClick={testNotification} className="ml-auto font-medium underline">
              {t("test")}
            </button>
          </div>
        )}

        <p className="mb-3 text-xs text-muted-foreground">
          {t("gentleNudgesDesc")}
        </p>

        <div className="space-y-2">
          {reminders.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-ios"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${r.color} 15%, transparent)` }}
              >
                <r.icon className="h-5 w-5" style={{ color: r.color }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{t(r.labelKey)}</div>
                <div className="text-xs text-muted-foreground">{t(r.descKey)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground tabular-nums">{r.time}</span>
                <Switch checked={r.enabled} onCheckedChange={() => toggle(r.id)} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">
            💡 <span className="font-medium">{t("tipLabel")}</span> {t("remindersTip")}
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-3 pb-safe">
        <Button className="w-full rounded-full py-3" size="lg" onClick={save}>
          {t("saveReminders")}
        </Button>
      </div>
    </div>
  );
}
