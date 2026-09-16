"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Paper } from "@/lib/db/types";
import {
  BookOpen,
  FileText,
  Bookmark,
  Heart,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";
import { VisualImage } from "@/components/visuals/visual-image";

interface PaperOfDayCardProps {
  paper: Paper;
  readingProgress?: number;
}

export function PaperOfDayCard({ paper, readingProgress = 0 }: PaperOfDayCardProps) {
  const [saved, setSaved] = useState(false);
  const [favorited, setFavorited] = useState(false);

  if (!paper) return null;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!saved) {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: paper.id,
            itemType: "paper",
            title: paper.title,
            url: `/reader/${paper.id}`,
            category: paper.primaryCategory,
          }),
        });
        setSaved(true);
      } else {
        await fetch(`/api/bookmarks?itemId=${paper.id}`, { method: "DELETE" });
        setSaved(false);
      }
    } catch {}
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!favorited) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "paper",
            entityId: paper.id,
            title: paper.title,
            url: `/reader/${paper.id}`,
            category: paper.primaryCategory,
            description: paper.whyItMatters || paper.coreContribution || paper.abstract.slice(0, 160),
            metadata: {
              pdfUrl: paper.pdfUrl,
              githubUrl: paper.githubUrl,
              arxivId: paper.arxivId,
            },
          }),
        });
        setFavorited(true);
      } else {
        await fetch(`/api/favorites?entityType=paper&entityId=${paper.id}`, { method: "DELETE" });
        setFavorited(false);
      }
    } catch {}
  };

  return (
    <MotionCard3D
      maxTilt={2}
      translateZ={6}
      className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-7 shadow-sm hover:shadow-card-hover transition-all duration-300 font-sans flex flex-col justify-between overflow-hidden relative group"
    >
      {/* Accent indicator */}
      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[var(--accent)]" />

      <div className="space-y-3.5">
        {/* Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold text-xs border border-[var(--border)]">
              <Sparkles className="h-3 w-3 text-[var(--accent)]" />
              <span>Paper of the Day</span>
            </span>
            <span className="text-[var(--border)]">·</span>
            <span className="font-mono text-xs font-medium text-[var(--text-primary)]">arXiv:{paper.arxivId}</span>
          </div>

          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3 text-[var(--text-muted)]" />
              <span>~{paper.readingTimeMinutes} min</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-soft)] text-[var(--accent)] border border-[var(--border)]">
              {paper.difficulty}
            </span>
          </div>
        </div>

        {/* 2-Column Split: Details + 4:3 Visual Anchor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-3">
            {/* Title */}
            <Link href={`/reader/${paper.id}`}>
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                {paper.title}
              </h3>
            </Link>

            {/* Authors */}
            <p className="text-xs text-[var(--text-secondary)] font-sans truncate">
              By {paper.authors.slice(0, 3).join(", ")}
              {paper.authors.length > 3 && ` +${paper.authors.length - 3} authors`}
            </p>

            {/* Topic Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {paper.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-0.5 rounded-xl text-xs bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Why It Matters Callout */}
            <div className="mt-2 rounded-2xl bg-[var(--surface-soft)] p-3.5 border border-[var(--border)] text-xs space-y-1">
              <div className="font-semibold text-xs text-[var(--accent)] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                Why it matters
              </div>
              <p className="text-[var(--text-primary)] leading-relaxed font-sans line-clamp-3 text-xs">
                {paper.whyItMatters || paper.coreContribution || paper.abstract}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <VisualImage
              entityType="paper"
              entityId={paper.id}
              fallbackTitle={paper.title}
              fallbackTopic={paper.primaryCategory}
              aspectRatio="4:3"
              showBadge={true}
            />
          </div>
        </div>

        {/* Reading Progress Bar (if started) */}
        {readingProgress > 0 && (
          <div className="pt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
              <span>Reading progress</span>
              <span className="font-semibold text-[var(--accent)]">{readingProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${readingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link
          href={`/reader/${paper.id}`}
          className="px-4 py-2 rounded-2xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
        >
          <BookOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span>Read Paper</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {paper.pdfUrl && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-medium flex items-center gap-1 transition-colors bg-white shadow-xs"
              title="Direct 1-click official arXiv PDF"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" />
              <span>PDF ↗</span>
            </a>
          )}

          {paper.githubUrl && (
            <a
              href={paper.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-medium flex items-center gap-1 transition-colors bg-white shadow-xs"
              title="Direct 1-click verified GitHub Repository"
            >
              <span>GitHub ↗</span>
            </a>
          )}

          {/* Reading queue */}
          <button
            onClick={handleSave}
            className={`p-2 rounded-xl border transition-colors shadow-xs ${
              saved
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white"
                : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title={saved ? "Queued in Reading List" : "Add to Reading List"}
          >
            <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
          </button>

          {/* Permanent Favorite */}
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-xl border transition-colors shadow-xs ${
              favorited
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50/50"
            }`}
            title={favorited ? "Saved to Favorites" : "Save to Permanent Favorites"}
          >
            <Heart className={`h-3.5 w-3.5 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
      </div>
    </MotionCard3D>
  );
}
