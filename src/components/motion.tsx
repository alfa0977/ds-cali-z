"use client";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// Tab page transition
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({ children, k }: { children: ReactNode; k: string }) {
  return (
    <motion.div
      key={k}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Card tap feedback
export function TapCard({
  children,
  className,
  onClick,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: onClick ? 0.97 : 1 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Sheet slide-up
export const sheetVariants: Variants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};

export function SheetWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={sheetVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", damping: 30, stiffness: 320 }}
      className="absolute inset-0 z-50 bg-background"
    >
      {children}
    </motion.div>
  );
}

// Stagger container for lists
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: { transition: { staggerChildren: 0.05 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
