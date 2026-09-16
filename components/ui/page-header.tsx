import React from 'react';

interface PageHeaderProps {
  tag?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  tag,
  title,
  description,
  action,
  badge,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[var(--border)] ${className}`}>
      <div className="space-y-1">
        {(tag || badge) && (
          <div className="flex items-center gap-2 mb-1">
            {tag && (
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                {tag}
              </span>
            )}
            {badge}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
