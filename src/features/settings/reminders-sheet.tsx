"use client";
import { useState } from "react";
import { X, Bell, Clock, Droplets, Sun, Moon, Utensils } from "lucide-react";
import { useApp } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Reminder {
  id: string;
  label: string;
  desc: string;
  time: string;
  icon: typeof Bell;
  color: string;
  enabled: boolean;
}

export function RemindersSheet() {
  const { setModal } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: "breakfast", label: "Log breakfast", desc: "Start your day right", time: "08:00", icon: Sun, color: "var(--carbs)", enabled: true },
    { id: "lunch", label: "Log lunch", desc: "Don't forget midday meals", time: "12:30", icon: Utensils, color: "var(--protein)", enabled: true },
    { id: "dinner", label: "Log dinner", desc: "Track your evening meal", time: "19:00", icon: Moon, color: "var(--fats)", enabled: false },
    { id: "water", label: "Drink water", desc: "Stay hydrated every 2 hours", time: "Every 2h", icon: Droplets, color: "var(--water)", enabled: true },
  ]);

  function toggle(id: string) {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  function save() {
    const enabledCount = reminders.filter((r) => r.enabled).length;
    toast.success(`${enabledCount} reminder${enabledCount !== 1 ? "s" : ""} active`);
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
          Reminders
        </h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 pb-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Get gentle nudges to log your meals and stay on track. Notifications appear in your browser.
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
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
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
            💡 <span className="font-medium">Tip:</span> Enable browser notifications for the best experience. You can change reminder times in a future update.
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-3 pb-safe">
        <Button className="w-full rounded-full py-3" size="lg" onClick={save}>
          Save reminders
        </Button>
      </div>
    </div>
  );
}
