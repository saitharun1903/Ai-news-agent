import React from "react";
import { cn } from "./button";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "accent" | "difficulty";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium transition-colors select-none";
  const variants = {
    default: "bg-[var(--text-primary)] text-white",
    secondary: "bg-[var(--surface-soft)] text-[var(--text-primary)] border border-[var(--border)]",
    outline: "border border-[var(--border)] text-[var(--text-secondary)] bg-white",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20",
    difficulty: "bg-[var(--surface-soft)] text-[var(--text-secondary)] border border-[var(--border)]",
  };

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
