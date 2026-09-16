import React from "react";
import { cn } from "./button";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[var(--border)]/60", className)}
      {...props}
    />
  );
}
