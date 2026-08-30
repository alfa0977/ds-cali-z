"use client";
import { cn } from "@/lib/utils";

/**
 * DS-Cali logo — a modern, delicate mark.
 * A stylized leaf/ calorie-drop hybrid in a rounded square with gradient.
 */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center rounded-[28%] bg-gradient-to-br from-streak via-amber-400 to-protein shadow-sm", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stylized "D" formed by a leaf + drop shape */}
        <path
          d="M8 6 L8 26 C16 26 22 20 22 12 C22 9 21 7 19 6 L8 6 Z"
          fill="white"
          fillOpacity="0.95"
        />
        <path
          d="M14 10 C14 16 18 20 22 20"
          stroke="var(--streak)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="13" cy="14" r="1.5" fill="var(--streak)" />
      </svg>
    </div>
  );
}

/** Wordmark: logo + app name */
export function LogoWordmark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo size={size} />
    </div>
  );
}
