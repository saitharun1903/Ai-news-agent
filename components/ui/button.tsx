import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "subtle";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50 select-none text-sm";

    const variants = {
      primary: "bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] shadow-sm",
      secondary: "bg-[var(--surface-soft)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] border border-[var(--border)]",
      outline: "border border-[var(--border)] bg-white hover:bg-[var(--surface-soft)] text-[var(--text-primary)]",
      ghost: "hover:bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
      subtle: "bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] border border-[var(--border)]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
