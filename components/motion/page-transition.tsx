"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  pageVariants,
  reducedPageVariants,
  staggerContainer as defaultStaggerContainer,
  staggerItem as defaultStaggerItem,
} from "@/lib/motion";

// Global in-memory scroll restoration registry for SPA routes
const scrollRegistry = new Map<string, number>();

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const isPopStateRef = useRef(false);
  const prevPathnameRef = useRef<string>(pathname);

  // Track popstate (browser Back / Forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Save previous scroll position before path changes and restore on navigation
  useEffect(() => {
    const prevPath = prevPathnameRef.current;
    if (prevPath && prevPath !== pathname) {
      scrollRegistry.set(prevPath, window.scrollY);
    }

    if (isPopStateRef.current) {
      // Back / Forward navigation: restore saved scroll position
      const savedY = scrollRegistry.get(pathname) ?? 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: "instant" });
      });
      isPopStateRef.current = false;
    } else {
      // Intentional new forward navigation: start at top
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    prevPathnameRef.current = pathname;
  }, [pathname]);

  if (shouldReduceMotion) {
    return (
      <div key={pathname} className="w-full">
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.04,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.02,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={defaultStaggerItem}
      className={className}
    >
      {children}
    </motion.div>
  );
}

