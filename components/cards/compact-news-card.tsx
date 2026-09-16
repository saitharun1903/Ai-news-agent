"use client";

import React from "react";
import Link from "next/link";
import { ArticleGroup } from "@/lib/db/types";
import { ArrowRight, Clock, ExternalLink } from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";

interface CompactNewsCardProps {
  story: ArticleGroup;
  index?: number;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function CompactNewsCard({ story, index }: CompactNewsCardProps) {
  if (!story) return null;

  const leadSource = story.sources[0]?.sourceName || "AI Lab";
  const formattedTime = timeAgo(story.publishedAt);
  const num = index !== undefined ? (index + 1).toString().padStart(2, "0") : null;

  return (
    <MotionCard3D
      maxTilt={1.5}
      translateZ={4}
      className="rounded-3xl border border-[var(--border)] bg-white p-5 flex flex-col justify-between shadow-sm hover:shadow-card-hover transition-all duration-300 font-sans group"
    >
      <div>
        {/* Source & Time */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] pb-2.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 truncate">
            {num && (
              <span className="font-bold text-[var(--accent)]">{num}</span>
            )}
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)] truncate">
              {leadSource}
            </span>
          </div>
          <span className="shrink-0 text-[var(--text-muted)]">{formattedTime}</span>
        </div>

        {/* Headline */}
        <Link href={`/news/${story.id}`}>
          <h3 className="mt-3 text-sm sm:text-base font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
            {story.title}
          </h3>
        </Link>

        {/* Small Summary */}
        <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {story.summary}
        </p>
      </div>

      {/* Footer: Topic & Link */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-[var(--surface-soft)] text-[var(--accent)] border border-[var(--border)]">
          {story.topic}
        </span>

        <Link
          href={`/news/${story.id}`}
          className="flex items-center gap-1 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors font-semibold"
        >
          <span>Read</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </MotionCard3D>
  );
}
