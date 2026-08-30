"use client";
import { RefreshCw, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

export function PullToRefreshIndicator({
  pullDistance,
  pullProgress,
  isRefreshing,
}: {
  pullDistance: number;
  pullProgress: number;
  isRefreshing: boolean;
}) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
      style={{ top: pullDistance }}
    >
      <motion.div
        animate={{
          scale: isRefreshing ? 1 : pullProgress,
          rotate: isRefreshing ? 360 : 0,
        }}
        transition={{
          rotate: isRefreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.2 },
          scale: { duration: 0.2 },
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-ios"
      >
        {isRefreshing ? (
          <RefreshCw className="h-4 w-4 text-streak" />
        ) : (
          <ArrowDown
            className="h-4 w-4 text-streak"
            style={{ opacity: pullProgress }}
          />
        )}
      </motion.div>
    </div>
  );
}
