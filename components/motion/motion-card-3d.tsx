"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

interface MotionCard3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees, default: 2.5
  translateZ?: number; // px, default: 6
  glowEffect?: boolean;
}

export function MotionCard3D({
  children,
  className = "",
  maxTilt = 2.5,
  translateZ = 6,
  glowEffect = true,
  ...props
}: MotionCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Motion values normalized between -0.5 and 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for rotation
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);
  const z = useSpring(useTransform(mouseX, [-0.5, 0, 0.5], [translateZ, translateZ * 1.5, translateZ]), springConfig);

  // State for radial shine highlight position
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    mouseX.set(x - 0.5);
    mouseY.set(y - 0.5);

    if (glowEffect) {
      setGlarePos({
        x: Math.round(x * 100),
        y: Math.round(y * 100),
        opacity: 0.12,
      });
    }
  };

  const handleMouseLeave = () => {
    if (shouldReduceMotion) return;
    mouseX.set(0);
    mouseY.set(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className="perspective-1000">
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
          translateZ,
          transition: { duration: 0.2 },
        }}
        className={`relative transition-shadow duration-300 ${className}`}
        {...(props as any)}
      >
        {/* Subtle dynamic directional highlight */}
        {glowEffect && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-10"
            style={{
              background: `radial-gradient(circle 320px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.4), transparent 70%)`,
            }}
          />
        )}
        <div style={{ transform: "translateZ(1px)" }}>{children}</div>
      </motion.div>
    </div>
  );
}
