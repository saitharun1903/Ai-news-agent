import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-white p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto shadow-card ${className}`}
    >
      {Icon && (
        <div className="h-12 w-12 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center mb-4">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
