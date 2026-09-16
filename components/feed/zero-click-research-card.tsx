"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Paper } from "@/lib/db/types";
import {
  FileText,
  Github,
  Globe,
  Bookmark,
  Heart,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  Database,
  Link2,
} from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";
import { VisualImage } from "@/components/visuals/visual-image";

interface ZeroClickResearchCardProps {
  paper: Paper;
  featured?: boolean;
}

export function ZeroClickResearchCard({ paper, featured = false }: ZeroClickResearchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  if (!paper) return null;

  const pubYear = paper.publishedAt
    ? new Date(paper.publishedAt).getFullYear()
    : new Date().getFullYear();

  const authorString =
    paper.authors && paper.authors.length > 3
      ? `${paper.authors.slice(0, 3).join(", ")} et al.`
      : paper.authors?.join(", ") || "arXiv AI Researchers";

  const difficultyColors = {
    Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
    Advanced: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!bookmarked) {
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
        setBookmarked(true);
      } else {
        await fetch(`/api/bookmarks?itemId=${paper.id}`, { method: "DELETE" });
        setBookmarked(false);
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
      className={`rounded-3xl border bg-white p-5 sm:p-6 transition-all duration-300 font-sans group ${
        featured
          ? "border-[var(--accent)] shadow-card-hover"
          : "border-[var(--border)] hover:border-[var(--accent)] shadow-sm hover:shadow-card-hover"
      }`}
    >
      {/* 1. Header Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)] text-xs font-sans text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text-primary)] px-2.5 py-0.5 rounded-full bg-[var(--surface-soft)] border border-[var(--border)]">
            {paper.primaryCategory}
          </span>
          <span className="text-[var(--border)]">·</span>
          <span className="font-mono text-xs font-medium text-[var(--text-primary)]">arXiv:{paper.arxivId}</span>
          <span className="text-[var(--border)]">·</span>
          <span>{pubYear}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
              difficultyColors[paper.difficulty] || difficultyColors.Intermediate
            }`}
          >
            {paper.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <Clock className="h-3 w-3 text-[var(--text-muted)]" />
            {paper.readingTimeMinutes || 12}m
          </span>
          {paper.citationCount > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              {paper.citationCount} citations
            </span>
          )}
        </div>
      </div>

      {/* Visual Anchor for Featured Paper */}
      {featured && (
        <div className="mt-3.5">
          <VisualImage
            entityType="paper"
            entityId={paper.id}
            fallbackTitle={paper.title}
            fallbackTopic={paper.primaryCategory}
            aspectRatio="3:2"
            className="max-h-44"
          />
        </div>
      )}

      {/* 2. Paper Title */}
      <h3
        className={`mt-3.5 font-semibold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug ${
          featured ? "text-lg sm:text-xl" : "text-base sm:text-lg"
        }`}
      >
        <Link href={`/reader/${paper.id}`} className="hover:underline">
          {paper.title}
        </Link>
      </h3>

      {/* 3. Authors */}
      <div className="mt-1 text-xs text-[var(--text-secondary)] font-sans truncate">
        {authorString}
      </div>

      {/* 4. Why This Paper Matters Box */}
      <div className="mt-3 rounded-2xl bg-[var(--surface-soft)] p-3.5 border border-[var(--border)] text-xs space-y-1">
        <span className="font-semibold text-xs text-[var(--accent)] flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-[var(--accent)]" />
          Why it matters
        </span>
        <p className="text-[var(--text-primary)] leading-relaxed font-sans text-xs">
          {paper.whyItMatters || paper.coreContribution || paper.abstract.slice(0, 180) + "..."}
        </p>
      </div>

      {/* 5. Direct 1-Click Action Bar */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Primary Action: Read in Reader */}
          <Link
            href={`/reader/${paper.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] text-xs font-semibold transition-all shadow-xs"
          >
            <BookOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Read Paper</span>
          </Link>

          {/* Direct Outbound PDF Button */}
          {paper.pdfUrl && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-medium transition-colors bg-white shadow-xs"
              title="Open arXiv PDF in new tab"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" />
              <span>PDF ↗</span>
            </a>
          )}

          {/* Direct Outbound GitHub Button */}
          {paper.githubUrl && (
            <a
              href={paper.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-medium transition-colors bg-white shadow-xs"
              title="Open verified GitHub repository"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Code ↗</span>
            </a>
          )}

          {/* Direct Project Website Button */}
          {paper.projectUrl && (
            <a
              href={paper.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-medium transition-colors bg-white shadow-xs"
              title="Open verified project page"
            >
              <Globe className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Project ↗</span>
            </a>
          )}

          {/* Direct Dataset Button */}
          {paper.datasetUrl && (
            <a
              href={paper.datasetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-medium transition-colors bg-white shadow-xs"
              title="Open verified dataset"
            >
              <Database className="h-3.5 w-3.5 text-amber-600" />
              <span>Dataset ↗</span>
            </a>
          )}

          {/* Direct DOI Button */}
          {paper.doiUrl && (
            <a
              href={paper.doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-medium transition-colors bg-white shadow-xs"
              title="Open official DOI publication"
            >
              <Link2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>DOI ↗</span>
            </a>
          )}

          {/* Reading Queue Toggle */}
          <button
            onClick={handleBookmark}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              bookmarked
                ? "bg-[var(--text-primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
            }`}
            title={bookmarked ? "Queued in Reading List" : "Add to Reading List Queue"}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
            <span>{bookmarked ? "Queued" : "Queue"}</span>
          </button>

          {/* Permanent Favorite Heart Toggle */}
          <button
            onClick={handleFavorite}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              favorited
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50/50"
            }`}
            title={favorited ? "Saved in Permanent Favorites" : "Save to Permanent Favorites"}
          >
            <Heart className={`h-3.5 w-3.5 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
            <span>{favorited ? "Saved" : "Favorite"}</span>
          </button>
        </div>

        {/* Methodology / Abstract Inline Accordion Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-semibold"
        >
          <span>{expanded ? "Hide details" : "Method & Details"}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* 6. Inline Expanded Deep-Dive */}
      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[var(--border)] space-y-3 text-xs">
          {paper.coreContribution && (
            <div>
              <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-[var(--accent)] block mb-1">
                Core Contribution
              </span>
              <p className="text-[var(--text-primary)] leading-relaxed font-sans">
                {paper.coreContribution}
              </p>
            </div>
          )}

          {paper.method && (
            <div>
              <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-[var(--accent)] block mb-1">
                Methodology
              </span>
              <p className="text-[var(--text-primary)] leading-relaxed font-sans">
                {paper.method}
              </p>
            </div>
          )}

          {paper.limitations && (
            <div>
              <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-amber-700 block mb-1">
                Known Limitations
              </span>
              <p className="text-[var(--text-primary)] leading-relaxed font-sans">
                {paper.limitations}
              </p>
            </div>
          )}

          {paper.abstract && (
            <div>
              <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-[var(--text-secondary)] block mb-1">
                Full Abstract
              </span>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed font-sans">
                {paper.abstract}
              </p>
            </div>
          )}
        </div>
      )}
    </MotionCard3D>
  );
}
