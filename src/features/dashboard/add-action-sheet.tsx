"use client";
import { X, Camera, Search, Dumbbell, Barcode } from "lucide-react";
import { useApp } from "@/lib/store";

const ACTIONS = [
  { key: "scanner", label: "Scan meal", desc: "AI-powered food recognition", icon: Camera, color: "var(--streak)" },
  { key: "barcode", label: "Barcode scan", desc: "Look up packaged foods", icon: Barcode, color: "var(--water)" },
  { key: "food-db", label: "Search foods", desc: "Browse the food database", icon: Search, color: "var(--success)" },
  { key: "add-workout", label: "Log workout", desc: "Track your exercise", icon: Dumbbell, color: "var(--protein)" },
] as const;

export function AddActionSheet() {
  const { setModal } = useApp();
  return (
    <div className="flex h-full flex-col justify-end bg-black/40" onClick={() => setModal(null)}>
      <div
        className="rounded-t-3xl bg-background px-4 pb-safe pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Add to today</h2>
          <button onClick={() => setModal(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 pb-4">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => setModal(a.key)}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 shadow-ios transition-transform active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${a.color} 15%, transparent)` }}>
                <a.icon className="h-5 w-5" style={{ color: a.color }} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
