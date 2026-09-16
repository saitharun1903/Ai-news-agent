"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArticleGroup, Paper } from "@/lib/db/types";
import {
  ExternalLink,
  Bookmark,
  Heart,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  ArrowRight,
} from "lucide-react";

interface ExpandableStoryRowProps {
  story: ArticleGroup;
  index: number;
  relatedPapers?: Paper[];
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

export function ExpandableStoryRow({
  story,
  index,
  relatedPapers = [],
}: ExpandableStoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  if (!story) return null;

  const leadSource = story.sources[0]?.sourceName || "Lab Dispatch";
  const sourceUrl = story.sources[0]?.url || "#";
  const timeFormatted = timeAgo(story.publishedAt);
  const num = index.toString().padStart(2, "0");

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    e.stopPropagation();
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
    <div
      className={`border rounded-3xl transition-all duration-300 font-sans ${
        expanded
          ? "border-[var(--accent)] bg-[var(--surface-soft)] shadow-card-hover"
          : "border-[var(--border)] bg-white hover:border-[var(--accent)] shadow-sm hover:shadow-card-hover"
      }`}
    >
      {/* Clickable Row Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-5 sm:p-6 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] shrink-0">
            <span className="font-extrabold text-[var(--accent)]">{num}</span>
            <span className="text-[var(--border)]">·</span>
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              {leadSource}
            </span>
            <span className="text-[var(--border)]">·</span>
            <span className="text-[var(--text-muted)]">{timeFormatted}</span>
            <span className="text-[var(--border)]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-soft)] text-[10px] uppercase font-semibold text-[var(--accent)] border border-[var(--border)]">
              {story.topic}
            </span>
          </div>

          {/* Headline & context */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-[var(--text-primary)] truncate hover:text-[var(--accent)] transition-colors">
              {story.title}
            </h4>
            {!expanded && (
              <p className="text-xs text-[var(--text-secondary)] truncate font-sans mt-0.5">
                {story.whyItMatters || story.summary}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Quick outbound link & chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"
            title="Open original source"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="p-1 text-[var(--text-muted)]">
            {expanded ? <ChevronUp className="h-4 w-4 text-[var(--accent)]" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Intelligence Body */}
      {expanded && (
        <div className="px-6 pb-6 pt-1 border-t border-[var(--border-subtle)] space-y-3.5">
          {/* Full concise summary */}
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {story.summary}
          </p>

          {/* Why It Matters Callout */}
          {story.whyItMatters && (
            <div className="rounded-2xl bg-white p-4 border border-[var(--border)] text-xs space-y-1">
              <span className="font-semibold text-xs text-[var(--accent)] block mb-0.5">
                Why it matters
              </span>
              <p className="text-[var(--text-primary)] leading-relaxed font-sans font-medium">
                {story.whyItMatters}
              </p>
            </div>
          )}

          {/* Sources List */}
          {story.sources.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-sans text-[var(--text-secondary)] pt-1">
              <span className="text-xs text-[var(--text-muted)] font-semibold">Sources:</span>
              {story.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[var(--border)] text-xs text-[var(--text-primary)] hover:text-[var(--accent)] font-medium flex items-center gap-1 transition-colors shadow-xs"
                >
                  <span>{s.sourceName}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ))}
            </div>
          )}

          {/* Related Research Inline */}
          {relatedPapers.length > 0 && (
            <div className="pt-2.5 border-t border-[var(--border-subtle)] space-y-2">
              <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" />
                <span>Related research ({relatedPapers.length})</span>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {relatedPapers.map((paper) => (
                  <div key={paper.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--text-primary)] truncate">
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
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-xl border border-[var(--border)] text-[10px] font-mono text-[var(--text-primary)] hover:border-[var(--accent)] flex items-center gap-1 bg-white shadow-xs font-semibold"
                        >
                          <FileText className="h-2.5 w-2.5 text-rose-500" />
                          <span>PDF ↗</span>
                        </a>
                      )}
                      <Link
                        href={`/reader/${paper.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] text-[11px] font-bold transition-colors shadow-xs"
                      >
                        Read
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-bold text-[var(--text-primary)] hover:text-[var(--accent)] font-mono"
              >
                <span>Open original</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                onClick={handleBookmark}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-[11px] transition-colors ${
                  bookmarked ? "bg-[var(--text-primary)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                }`}
                title={bookmarked ? "Queued in Reading List" : "Add to Reading List Queue"}
              >
                <Bookmark className={`h-3 w-3 ${bookmarked ? "fill-current" : ""}`} />
                <span>{bookmarked ? "Queued" : "Queue"}</span>
              </button>

              <button
                onClick={handleFavorite}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-[11px] transition-colors ${
                  favorited ? "bg-rose-50 text-rose-600 border border-rose-200" : "text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50/50"
                }`}
                title={favorited ? "Saved in Permanent Favorites" : "Save to Permanent Favorites"}
              >
                <Heart className={`h-3 w-3 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{favorited ? "Saved" : "Favorite"}</span>
              </button>
            </div>

            <Link
              href={`/news/${story.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-mono text-[var(--accent)] hover:underline font-bold"
            >
              <span>Deep-dive</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
