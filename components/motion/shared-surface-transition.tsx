"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SharedSurfaceTransitionProps {
  layoutId: string;
  children: React.ReactNode;
  className?: string;
}

export function SharedSurfaceTransition({
  layoutId,
  children,
  className = "",
}: SharedSurfaceTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  if (shouldReduceMotion || isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layoutId={layoutId}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 30,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
