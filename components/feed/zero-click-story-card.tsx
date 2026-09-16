"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArticleGroup, Paper } from "@/lib/db/types";
import {
  ExternalLink,
  Bookmark,
  Heart,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

interface ZeroClickStoryCardProps {
  story: ArticleGroup;
  relatedPapers?: Paper[];
  featured?: boolean;
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

export function ZeroClickStoryCard({
  story,
  relatedPapers = [],
  featured = false,
}: ZeroClickStoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  if (!story) return null;

  const leadSource = story.sources[0]?.sourceName || "AI Lab Dispatch";
  const sourceUrl = story.sources[0]?.url || "#";
  const formattedTime = timeAgo(story.publishedAt);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (!bookmarked) {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: story.id,
            itemType: "article",
            title: story.title,
            url: `/news/${story.id}`,
            category: story.topic,
          }),
        });
        setBookmarked(true);
      } else {
        await fetch(`/api/bookmarks?itemId=${story.id}`, { method: "DELETE" });
        setBookmarked(false);
      }
    } catch {}
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (!favorited) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "article",
            entityId: story.id,
            title: story.title,
            url: `/news/${story.id}`,
            category: story.topic,
            description: story.summary,
          }),
        });
        setFavorited(true);
      } else {
        await fetch(`/api/favorites?entityType=article&entityId=${story.id}`, { method: "DELETE" });
        setFavorited(false);
      }
    } catch {}
  };

  return (
    <article
      className={`rounded-2xl border bg-white p-5 transition-all duration-200 font-sans group ${
        featured
          ? "border-[var(--accent)] shadow-card-hover hover:border-[var(--accent)]"
          : "border-[var(--border)] hover:border-[var(--accent)] hover:shadow-sm"
      }`}
    >
      {/* 1. Header: Source, Time, Category */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--surface-soft)] text-xs font-mono text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
            {leadSource}
          </span>
          <span className="text-slate-300">·</span>
          <span>{formattedTime}</span>
          <span className="text-slate-300">·</span>
          <span className="px-2 py-0.5 rounded-md bg-[var(--surface-soft)] text-[10px] font-medium uppercase text-[var(--text-primary)] border border-[var(--border)]">
            {story.topic}
          </span>
        </div>

        {story.sources.length > 1 && (
          <span className="text-[11px] text-[var(--text-secondary)] font-sans">
            Corroborated by {story.sources.length} outlets
          </span>
        )}
      </div>

      {/* 2. Headline */}
      <h3
        className={`mt-3 font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug ${
          featured ? "text-lg sm:text-xl" : "text-base sm:text-lg"
        }`}
      >
        <Link href={`/news/${story.id}`} className="hover:underline">
          {story.title}
        </Link>
      </h3>

      {/* 3. What happened */}
      <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
        {story.summary}
      </p>

      {/* 4. Why it matters */}
      {story.whyItMatters && (
        <div className="mt-3 rounded-xl bg-[var(--accent-soft)] p-3 border border-[var(--accent)] text-xs">
          <span className="font-semibold text-xs text-[var(--accent)] block mb-0.5">
            Why it matters:
          </span>
          <p className="text-[var(--text-primary)] leading-relaxed font-sans">
            {story.whyItMatters}
          </p>
        </div>
      )}

      {/* 5. Inline Actions & Secondary Expansion */}
      <div className="mt-4 pt-3 border-t border-[var(--surface-soft)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
          >
            <span>Open original</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Reading list bookmark */}
          <button
            onClick={handleBookmark}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
              bookmarked
                ? "bg-[var(--text-primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
            }`}
            title={bookmarked ? "Queued in Reading List" : "Add to Reading List"}
          >
            <Bookmark className={`h-3 w-3 ${bookmarked ? "fill-current" : ""}`} />
            <span>{bookmarked ? "Queued" : "Queue"}</span>
          </button>

          {/* Permanent Favorite heart */}
          <button
            onClick={handleFavorite}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
              favorited
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50/50"
            }`}
            title={favorited ? "Saved in Permanent Favorites" : "Save to Permanent Favorites"}
          >
            <Heart className={`h-3 w-3 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
            <span>{favorited ? "Favorited" : "Favorite"}</span>
          </button>
        </div>

        {/* Related research accordion toggle */}
        {relatedPapers.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs font-mono text-[var(--accent)] hover:underline font-medium"
          >
            <BookOpen className="h-3 w-3" />
            <span>{relatedPapers.length} related preprints</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* 6. Inline Expanded Related Research Papers */}
      {expanded && relatedPapers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
            Underlying Academic Research
          </div>
          <div className="divide-y divide-[var(--surface-soft)]">
            {relatedPapers.map((paper) => (
              <div key={paper.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] truncate">
                    {paper.title}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate">
                    {paper.authors.slice(0, 2).join(", ")} · {paper.primaryCategory} · {paper.readingTimeMinutes}m
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg border border-[var(--border)] text-[11px] font-mono text-[var(--text-primary)] hover:border-[var(--accent)] flex items-center gap-1 bg-white"
                      title="Direct arXiv PDF"
                    >
                      <FileText className="h-3 w-3 text-rose-500" />
                      <span>PDF</span>
                    </a>
                  )}
                  <Link
                    href={`/reader/${paper.id}`}
                    className="px-3 py-1 rounded-lg bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)] text-[11px] font-medium transition-colors"
                  >
                    Read
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
