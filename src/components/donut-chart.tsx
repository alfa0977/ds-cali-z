"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** Multi-segment donut chart (SVG) with animated segments + center content. */
export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 16,
  className,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pre-compute segment offsets using reduce (avoids mutation)
  const segmentData = segments.reduce<
    Array<{ seg: DonutSegment; dashLength: number; gap: number; offset: number }>
  >((acc, seg) => {
    const fraction = seg.value / total;
    const dashLength = fraction * circumference;
    const offset = acc.length > 0
      ? acc[acc.length - 1].offset + acc[acc.length - 1].dashLength
      : 0;
    acc.push({ seg, dashLength, gap: circumference - dashLength, offset });
    return acc;
  }, []);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {segmentData.map(({ seg, dashLength, gap, offset }, i) => (
          <motion.circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${gap}`}
            strokeLinecap="butt"
            initial={{ strokeDashoffset: -offset + dashLength, opacity: 0 }}
            animate={{ strokeDashoffset: -offset, opacity: 1 }}
            transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
