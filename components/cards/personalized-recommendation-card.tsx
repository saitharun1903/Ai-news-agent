"use client";

import React from "react";
import Link from "next/link";
import { Paper } from "@/lib/db/types";
import { Sparkles, BookOpen } from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";

interface PersonalizedRecommendationCardProps {
  paper: Paper;
  becauseYouRead: string;
  rationale?: string;
}

export function PersonalizedRecommendationCard({
  paper,
  becauseYouRead,
  rationale,
}: PersonalizedRecommendationCardProps) {
  if (!paper) return null;

  return (
    <MotionCard3D
      maxTilt={1.5}
      translateZ={5}
      className="rounded-3xl border border-[var(--border)] bg-white p-6 flex flex-col justify-between shadow-sm hover:shadow-card-hover transition-all duration-300 font-sans group"
    >
      <div>
        {/* Attribution: Because you read */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="font-bold uppercase tracking-wider text-[var(--accent)]">
              BECAUSE YOU READ
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--text-primary)] bg-[var(--surface-soft)] px-3 py-1 rounded-full border border-[var(--border)]">
            {becauseYouRead}
          </span>
        </div>

        {/* Target Paper Info */}
        <div className="mt-4 space-y-2">
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">
            RECOMMENDED PREPRINT
          </div>

          <Link href={`/reader/${paper.id}`}>
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug">
              {paper.title}
            </h3>
          </Link>

          <p className="text-xs text-[var(--text-secondary)] font-sans truncate">
            {paper.authors.slice(0, 3).join(", ")} · {paper.primaryCategory} · ~{paper.readingTimeMinutes}m read
          </p>

          {/* Reason */}
          <div className="mt-2.5 rounded-2xl bg-[var(--surface-soft)] p-3.5 text-xs border border-[var(--border)] space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
              Recommendation Rationale
            </div>
            <p className="text-[var(--text-primary)] font-sans leading-relaxed">
              {rationale || paper.coreContribution || "High semantic alignment with your active research trajectory."}
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          arXiv:{paper.arxivId}
        </span>

        <Link
          href={`/reader/${paper.id}`}
          className="px-4 py-2 rounded-2xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
        >
          <BookOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span>Read Paper</span>
        </Link>
      </div>
    </MotionCard3D>
  );
}
