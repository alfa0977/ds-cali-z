"use client";
import { Home, BarChart3, Settings, Plus } from "lucide-react";
import { useApp, type TabKey } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "progress", label: "Progress", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const { tab, setTab, setModal } = useApp();
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      {/* FAB — orange brand color with glow */}
      <motion.button
        aria-label="Add"
        onClick={() => setModal("add-action")}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
        className="absolute right-4 -top-7 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-streak text-white shadow-fab"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </motion.button>

      <nav className="glass border-t border-border pb-safe">
        <div className="flex items-stretch justify-around px-2 pt-2">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors"
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="tab-indicator"
                      className="absolute -top-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-streak"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors",
                      active ? "text-streak" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 2}
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.15 : 0}
                  />
                </motion.div>
                <span
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    active ? "font-semibold text-streak" : "text-muted-foreground"
                  )}
                >
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
