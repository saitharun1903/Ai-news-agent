import React from 'react';

export function LoadingSkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-3 shadow-card animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-[var(--border)]/60" />
        <div className="h-4 w-24 rounded bg-[var(--border)]/40" />
      </div>
      <div className="h-5 w-3/4 rounded bg-[var(--border)]/70" />
      <div className="h-4 w-full rounded bg-[var(--border)]/40" />
      <div className="h-4 w-2/3 rounded bg-[var(--border)]/40" />
      <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
        <div className="h-3 w-20 rounded bg-[var(--border)]/50" />
        <div className="h-3 w-16 rounded bg-[var(--border)]/50" />
      </div>
    </div>
  );
}

export function LoadingSkeletonRow() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 flex items-center justify-between gap-4 animate-pulse">
      <div className="space-y-1.5 flex-1">
        <div className="h-4 w-2/5 rounded bg-[var(--border)]/60" />
        <div className="h-3 w-3/5 rounded bg-[var(--border)]/40" />
      </div>
      <div className="h-6 w-16 rounded bg-[var(--border)]/50" />
    </div>
  );
}
