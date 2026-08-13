"use client";
import { Flame } from "lucide-react";
import { useDashboard } from "@/lib/hooks";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
  const { data } = useDashboard();
  const streak = data?.user.streak ?? 0;
  return (
    <header className="flex items-center justify-between px-5 pt-3 pb-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🍎</span>
        <h1 className="text-[22px] font-bold tracking-tight">CalAI</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
          <Flame className="h-4 w-4 text-streak" fill="currentColor" />
          <span className="text-sm font-bold tabular-nums">{streak}</span>
        </div>
      </div>
    </header>
  );
}
