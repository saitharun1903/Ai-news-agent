"use client";

import React from "react";
import Image from "next/image";

export interface LunorLogoProps {
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "full";
  className?: string;
  ariaLabel?: string;
  showWordmark?: boolean;
}

const SIZE_MAP: Record<string, number> = {
  xs: 20,
  sm: 26,
  md: 32,
  lg: 42,
  xl: 56,
};

export function LunorLogo({
  size = "md",
  variant = "icon",
  className = "",
  ariaLabel = "Lunor logo",
  showWordmark,
}: LunorLogoProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 32;
  const isFull = variant === "full" || showWordmark === true;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      <div
        className="relative shrink-0 flex items-center justify-center overflow-hidden rounded-xl"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src="/lunor-icon.png"
          alt="Lunor Logo"
          width={pixelSize * 2}
          height={pixelSize * 2}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {isFull && (
        <span className="font-bold text-[15px] tracking-tight text-[var(--text-primary)] font-sans">
          Lunor
        </span>
      )}
    </div>
  );
}

export default LunorLogo;
