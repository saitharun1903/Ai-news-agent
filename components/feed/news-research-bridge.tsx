"use client";

import React from "react";
import Link from "next/link";
import { ArticleGroup, Paper } from "@/lib/db/types";
import {
  ArrowRight,
  BookOpen,
  Newspaper,
  FileText,
  ExternalLink,
  ArrowRightLeft,
} from "lucide-react";

interface NewsResearchBridgeProps {
  newsStory: ArticleGroup;
  connectedPapers: Paper[];
}

export function NewsResearchBridge({
  newsStory,
  connectedPapers,
}: NewsResearchBridgeProps) {
  if (!newsStory || !connectedPapers || connectedPapers.length === 0) return null;

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-7 transition-all duration-300 font-sans shadow-sm">
      {/* Header Pill */}
      <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs font-sans">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold tracking-wide border border-[var(--border)]">
            <ArrowRightLeft className="h-3 w-3 text-[var(--accent)]" />
            <span>Related research</span>
          </div>
          <span className="text-[var(--border)] hidden sm:inline">·</span>
          <span className="text-[var(--text-secondary)] text-xs hidden sm:inline">
            Academic preprints related to this story
          </span>
        </div>

        <Link
          href={`/research?topic=${encodeURIComponent(newsStory.topic)}`}
          className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold"
        >
          <span>View related papers</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: The Industry Story */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-sans text-[var(--text-secondary)]">
            <Newspaper className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              {newsStory.sources[0]?.sourceName || "Story"}
            </span>
            <span className="text-[var(--border)]">·</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface-soft)] text-[var(--accent)] font-medium border border-[var(--border)]">
              {newsStory.topic}
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-snug">
            {newsStory.title}
          </h4>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {newsStory.summary}
          </p>

          {newsStory.whyItMatters && (
            <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] text-xs space-y-1">
              <span className="font-semibold text-xs text-[var(--accent)] block mb-0.5">
                Why it matters
              </span>
              <p className="text-[var(--text-primary)] leading-relaxed font-sans font-medium">
                {newsStory.whyItMatters}
              </p>
            </div>
          )}

          {newsStory.sources[0]?.url && (
            <div className="pt-1">
              <a
                href={newsStory.sources[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] font-semibold transition-colors"
              >
                <span>Read source announcement</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Right: The Grounded Academic Preprints */}
        <div className="lg:col-span-6 space-y-3.5 pt-4 lg:pt-0 lg:border-l border-[var(--border-subtle)] lg:pl-6">
          <div className="flex items-center justify-between text-xs font-sans text-[var(--text-secondary)] pb-1">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
              Related preprints ({connectedPapers.length})
            </span>
            <span className="text-xs text-[var(--text-muted)]">Open access</span>
          </div>

          <div className="space-y-2.5">
            {connectedPapers.slice(0, 3).map((paper) => (
              <div
                key={paper.id}
                className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/reader/${paper.id}`}
                    className="text-xs sm:text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors leading-snug line-clamp-1"
                  >
                    {paper.title}
                  </Link>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 font-medium">
                    {paper.readingTimeMinutes}m
                  </span>
                </div>

                <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-1 font-sans">
                  {paper.whyItMatters || paper.coreContribution || paper.abstract}
                </p>

                <div className="mt-3 flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                    arXiv:{paper.arxivId} · {paper.primaryCategory}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {paper.pdfUrl && (
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl border border-[var(--border)] text-[10px] font-mono text-[var(--text-primary)] hover:border-[var(--accent)] flex items-center gap-1 bg-white shadow-xs font-semibold"
                        title="Direct arXiv PDF"
                      >
                        <FileText className="h-2.5 w-2.5 text-rose-500" />
                        <span>PDF ↗</span>
                      </a>
                    )}
                    <Link
                      href={`/reader/${paper.id}`}
                      className="px-3 py-1 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] text-[10px] font-bold transition-all shadow-xs"
                    >
                      Read
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
