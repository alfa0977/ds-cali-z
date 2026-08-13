"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  color?: string; // CSS color, overrides ring color
  children?: React.ReactNode;
  rounded?: boolean;
  animateFill?: boolean;
}

/** Circular progress ring with optional center content (SVG). */
export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  className,
  trackClassName,
  color = "var(--foreground)",
  children,
  rounded = true,
  animateFill = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted", trackClassName)}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap={rounded ? "round" : "butt"}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animateFill ? offset : offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
