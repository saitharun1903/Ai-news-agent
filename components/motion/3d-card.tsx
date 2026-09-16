"use client";

import React from "react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export function Tilt3DCard({
  children,
  className = "",
  maxTilt = 2.5,
}: Tilt3DCardProps) {
  return (
    <MotionCard3D maxTilt={maxTilt} className={className}>
      {children}
    </MotionCard3D>
  );
}

export { MotionCard3D };
