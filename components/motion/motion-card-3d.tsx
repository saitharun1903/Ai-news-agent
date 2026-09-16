"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

interface MotionCard3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees, default: 1.5
  translateZ?: number; // px, default: 4
  glowEffect?: boolean;
}

export function MotionCard3D({
  children,
  className = "",
  maxTilt = 1.5,
  translateZ = 4,
  glowEffect = false,
  ...props
}: MotionCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      setCanHover(mq.matches && window.innerWidth >= 768);
      const handler = (e: MediaQueryListEvent) => setCanHover(e.matches && window.innerWidth >= 768);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  // Motion values normalized between -0.5 and 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for subtle rotation (no aggressive perspective)
  const springConfig = { damping: 26, stiffness: 280, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover || shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    mouseX.set(x - 0.5);
    mouseY.set(y - 0.5);
  };

  const handleMouseLeave = () => {
    if (!canHover || shouldReduceMotion) return;
    mouseX.set(0);
    mouseY.set(0);
  };

  // If on mobile / touch screen or prefers-reduced-motion: zero overhead static render with tap feedback
  if (!canHover || shouldReduceMotion) {
    return (
      <div
        className={`relative transition-all duration-200 active:scale-[0.99] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="perspective-800">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{
          y: -2,
          transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
        }}
        className={`relative transition-shadow duration-200 ${className}`}
        {...(props as any)}
      >
        <div style={{ transform: `translateZ(${translateZ}px)` }}>{children}</div>
      </motion.div>
    </div>
  );
}

