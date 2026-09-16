"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";

// Global in-memory scroll restoration registry for SPA routes
const scrollRegistry = new Map<string, number>();

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const isPopStateRef = useRef(false);
  const prevPathnameRef = useRef<string>(pathname);
  const [animClass, setAnimClass] = useState("page-enter-mobile");

  // Determine responsive motion class on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateClass = () => {
        const width = window.innerWidth;
        if (width < 768) {
          setAnimClass("page-enter-mobile");
        } else if (width < 1024) {
          setAnimClass("page-enter-tablet");
        } else {
          setAnimClass("page-enter-desktop");
        }
      };
      updateClass();
      window.addEventListener("resize", updateClass, { passive: true });
      return () => window.removeEventListener("resize", updateClass);
    }
  }, []);

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
      const savedY = scrollRegistry.get(pathname) ?? 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: "instant" });
      });
      isPopStateRef.current = false;
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    prevPathnameRef.current = pathname;
  }, [pathname]);

  // If prefers-reduced-motion is requested: immediate static render
  if (shouldReduceMotion) {
    return (
      <div key={pathname} className="w-full">
        {children}
      </div>
    );
  }

  return (
    <div key={pathname} className={`w-full ${animClass}`}>
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
