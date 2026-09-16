"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, ArrowRight, Radio } from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";

export interface LiveTimelineItem {
  id: string;
  timeFormatted: string;
  categoryLabel: string;
  title: string;
  sourceName: string;
  url: string;
  isOutbound?: boolean;
}

interface LiveTimelineRailProps {
  items: LiveTimelineItem[];
  lastUpdatedText?: string;
}

export function LiveTimelineRail({
  items,
  lastUpdatedText = "Live",
}: LiveTimelineRailProps) {
  if (!items || items.length === 0) return null;

  return (
    <MotionCard3D
      maxTilt={1.5}
      translateZ={4}
      className="rounded-3xl border border-[var(--border)] bg-white p-6 font-sans flex flex-col justify-between shadow-sm hover:shadow-card-hover transition-all duration-300"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span className="font-semibold text-xs tracking-wide uppercase text-[var(--text-primary)]">
              Latest updates
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {lastUpdatedText}
          </span>
        </div>

        {/* Timeline Items */}
        <div className="mt-4 relative border-l border-[var(--border)] ml-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="relative pl-5 group">
              {/* Timeline Node */}
              <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white group-hover:bg-[var(--accent)] group-hover:scale-125 transition-all" />

              <div className="flex items-center gap-2 text-xs font-sans text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--text-primary)]">
                  {item.timeFormatted}
                </span>
                <span className="text-[var(--border)]">·</span>
                <span className="text-[var(--accent)] font-semibold">
                  {item.categoryLabel}
                </span>
                <span className="text-[var(--border)]">·</span>
                <span className="uppercase text-xs text-[var(--text-muted)]">{item.sourceName}</span>
              </div>

              <div className="mt-1">
                {item.isOutbound ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 inline-flex items-center gap-1"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </a>
                ) : (
                  <Link
                    href={item.url}
                    className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link to full updates */}
      <div className="mt-5 pt-3.5 border-t border-[var(--border-subtle)]">
        <Link
          href="/news"
          className="w-full py-2.5 px-3.5 rounded-2xl border border-[var(--border)] hover:bg-[var(--surface-soft)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between transition-colors"
        >
          <span>View all updates</span>
          <ArrowRight className="h-3.5 w-3.5 text-[var(--accent)]" />
        </Link>
      </div>
    </MotionCard3D>
  );
}
