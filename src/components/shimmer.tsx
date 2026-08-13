"use client";
import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-foreground/8 to-transparent" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 px-4 py-2">
      <div className="flex gap-2">
        <Shimmer className="h-8 w-20 rounded-full" />
        <Shimmer className="h-8 w-24 rounded-full" />
      </div>
      <Shimmer className="h-40 rounded-3xl" />
      <div className="grid grid-cols-3 gap-2">
        <Shimmer className="h-28 rounded-2xl" />
        <Shimmer className="h-28 rounded-2xl" />
        <Shimmer className="h-28 rounded-2xl" />
      </div>
      <Shimmer className="h-24 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Shimmer className="h-36 rounded-2xl" />
        <Shimmer className="h-36 rounded-2xl" />
      </div>
      <Shimmer className="h-20 rounded-2xl" />
    </div>
  );
}
