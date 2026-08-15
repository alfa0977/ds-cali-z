"use client";
import { Home, BarChart3, Settings, Plus } from "lucide-react";
import { useApp, type TabKey } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const TABS: { key: TabKey; labelKey: "home" | "progress" | "settings"; icon: typeof Home }[] = [
  { key: "home", labelKey: "home", icon: Home },
  { key: "progress", labelKey: "progress", icon: BarChart3 },
  { key: "settings", labelKey: "settings", icon: Settings },
];

export function BottomNav() {
  const { tab, setTab, setModal } = useApp();
  const { t } = useI18n();
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      <nav className="glass border-t border-border pb-safe">
        <div className="flex items-stretch justify-around px-2 pt-2">
          {/* Left tabs */}
          <div className="flex flex-1 justify-around">
            {TABS.slice(0, 2).map(({ key, labelKey, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="relative flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors"
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
                    {t(labelKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Center FAB — bigger, truly floating above nav */}
          <div className="flex w-20 shrink-0 justify-center">
            <motion.button
              aria-label="Add"
              onClick={() => setModal("add-action")}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08 }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
              className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-streak text-white shadow-fab ring-4 ring-background"
            >
              <Plus className="h-8 w-8" strokeWidth={3} />
            </motion.button>
          </div>

          {/* Right tab */}
          <div className="flex flex-1 justify-around">
            {TABS.slice(2).map(({ key, labelKey, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="relative flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors"
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
                    {t(labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
