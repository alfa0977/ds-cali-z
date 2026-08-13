"use client";
import { useRef, useState, useCallback } from "react";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
}

/**
 * Pull-to-refresh hook for touch devices.
 * Returns ref to attach to scrollable container, pull distance, and isRefreshing state.
 */
export function usePullToRefresh({ onRefresh, threshold = 70, maxPull = 100 }: PullToRefreshOptions) {
  const ref = useRef<HTMLElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return;
      const el = ref.current;
      if (!el || el.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
    },
    [isRefreshing]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startYRef.current === null || isRefreshing) return;
      const el = ref.current;
      if (!el || el.scrollTop > 0) {
        pullingRef.current = false;
        setPullDistance(0);
        return;
      }
      const deltaY = e.touches[0].clientY - startYRef.current;
      const deltaX = Math.abs(e.touches[0].clientX - (startXRef.current ?? 0));
      // Ignore horizontal swipes
      if (deltaX > 40 && deltaY < 30) {
        return;
      }
      if (deltaY > 0) {
        pullingRef.current = true;
        // Dampen the pull
        const dampened = Math.min(maxPull, deltaY * 0.5);
        setPullDistance(dampened);
      }
    },
    [isRefreshing, maxPull]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pullingRef.current) {
      setPullDistance(0);
      return;
    }
    pullingRef.current = false;
    startYRef.current = null;
    startXRef.current = null;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh]);

  const pullProgress = Math.min(1, pullDistance / threshold);

  return {
    ref,
    pullDistance,
    pullProgress,
    isRefreshing,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
