"use client";
import { Home, BarChart3, Settings, Plus } from "lucide-react";
import { useApp, type TabKey } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "progress", label: "Progress", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const { tab, setTab, setModal } = useApp();
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      {/* FAB */}
      <button
        aria-label="Add"
        onClick={() => setModal("add-action")}
        className="absolute right-4 -top-7 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <nav className="border-t border-border bg-card/95 backdrop-blur-xl pb-safe">
        <div className="flex items-stretch justify-around px-2 pt-2">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={active ? 2.5 : 2}
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.12 : 0}
                />
                <span className={cn("text-[11px] font-medium", active && "font-semibold")}>
                  {label}
                </span>
              </button>
            );
          })}
          {/* spacer to balance FAB */}
          <div className="w-16 shrink-0" aria-hidden />
        </div>
      </nav>
    </div>
  );
}
