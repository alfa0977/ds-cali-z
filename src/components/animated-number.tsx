"use client";
import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

/** Animated counting number that counts up when scrolled into view. */
export function AnimatedNumber({
  value,
  duration = 0.9,
  decimals = 0,
  className,
  format,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  const text = format
    ? format(display)
    : display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
