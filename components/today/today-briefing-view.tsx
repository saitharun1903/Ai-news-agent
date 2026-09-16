"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArticleGroup, Paper } from "@/lib/db/types";
import { FeaturedStoryCard } from "@/components/cards/featured-story-card";
import {
  Sparkles,
  ExternalLink,
  BookOpen,
  FileText,
  Github,
  Heart,
  Clock,
  ArrowRight,
  ChevronRight,
  Share2,
  Check,
} from "lucide-react";

export interface QuickTopicItem {
  name: string;
  slug: string;
  count?: number;
}

interface TodayBriefingViewProps {
  leadStory: ArticleGroup;
  supportingStories: ArticleGroup[];
  recommendedPapers: Paper[];
  quickTopics: QuickTopicItem[];
  lastUpdatedText: string;
  dateFormatted: string;
}

export function TodayBriefingView({
  leadStory,
  supportingStories,
  recommendedPapers,
  quickTopics,
  lastUpdatedText,
  dateFormatted,
}: TodayBriefingViewProps) {
  const [favoritedMap, setFavoritedMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleFavorite = async (
    entityType: "article" | "paper",
    entityId: string,
    title: string,
    category: string,
    url: string,
    description: string
  ) => {
    const isFav = !!favoritedMap[entityId];
    setFavoritedMap((prev) => ({ ...prev, [entityId]: !isFav }));

    try {
      if (!isFav) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType,
            entityId,
            title,
            category,
            url,
            description,
          }),
        });
      } else {
        await fetch(`/api/favorites?entityType=${entityType}&entityId=${entityId}`, {
          method: "DELETE",
        });
      }
    } catch (err) {
      console.error("Favorite toggle failed", err);
    }
  };

  const handleShare = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-12 max-w-[1240px] mx-auto font-sans pb-10">
      {/* 1. TOP HEADER (Date, Title, Live Status) */}
      <header className="space-y-2 pb-6 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-subtle" />
            <span className="font-semibold uppercase tracking-wider text-[var(--accent)]">
              Today
            </span>
            <span className="text-[var(--border)]">·</span>
            <span className="font-medium text-[var(--text-primary)]">{dateFormatted}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-soft)] border border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)]">
            {lastUpdatedText}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
          Today&apos;s AI & Software
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
          Curated daily briefing of high-impact industry developments and essential computer science research.
        </p>
      </header>

      {/* 2. FEATURED STORY (1 Story) */}
      <section aria-label="Featured Story">
        <FeaturedStoryCard story={leadStory} />
      </section>

      {/* 3. MORE FROM TODAY (3-5 Supporting Stories) */}
      {supportingStories.length > 0 && (
        <section aria-label="More from Today" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              More from Today
            </h2>
            <Link
              href="/news"
              className="text-xs text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Explore all news</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportingStories.map((story) => {
              const primarySource = story.sources?.[0];
              const isFav = !!favoritedMap[story.id];

              return (
                <article
                  key={story.id}
                  className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-2xs hover:shadow-card hover:border-[var(--accent)]/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Metadata */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-soft)] text-[var(--text-primary)] font-medium text-[11px] border border-[var(--border)]">
                          {story.topic}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-[var(--text-secondary)] text-[11px]">
                          {primarySource?.sourceName || "Lab Wire"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          toggleFavorite(
                            "article",
                            story.id,
                            story.title,
                            story.topic,
                            primarySource?.url || `/news/${story.id}`,
                            story.summary
                          )
                        }
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        title={isFav ? "Saved" : "Save"}
                        aria-label="Save story"
                      >
                        <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                    </div>

                    {/* Headline */}
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent)] transition-colors">
                      {primarySource ? (
                        <a href={primarySource.url} target="_blank" rel="noopener noreferrer">
                          {story.title}
                        </a>
                      ) : (
                        story.title
                      )}
                    </h3>

                    {/* One-Line Summary */}
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>

                  {/* Footer link */}
                  <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    {primarySource && (
                      <a
                        href={primarySource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] inline-flex items-center gap-1 font-medium transition-colors"
                      >
                        <span>Source</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <Link
                      href={`/news/${story.id}`}
                      className="text-[var(--accent)] hover:underline font-medium ml-auto"
                    >
                      Read story →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. RESEARCH TO READ (2-4 Recommended Papers) */}
      {recommendedPapers.length > 0 && (
        <section aria-label="Research to Read" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Research to Read
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Key computing preprints selected for architectural relevance and impact.
              </p>
            </div>
            <Link
              href="/research"
              className="text-xs text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Explore all papers</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPapers.map((paper) => {
              const isFav = !!favoritedMap[paper.id];
              const authorText =
                paper.authors && paper.authors.length > 0
                  ? paper.authors.slice(0, 2).join(", ") + (paper.authors.length > 2 ? " et al." : "")
                  : "Consortium";

              return (
                <article
                  key={paper.id}
                  className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs hover:shadow-card hover:border-[var(--accent)]/40 transition-all flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header Tags */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold text-xs border border-[var(--border)]">
                          {paper.primaryCategory}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-soft)] text-[var(--text-muted)] font-mono text-[11px] border border-[var(--border)] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {paper.readingTimeMinutes} min
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleFavorite(
                            "paper",
                            paper.id,
                            paper.title,
                            paper.primaryCategory,
                            `/research/${paper.id}`,
                            paper.abstract
                          )
                        }
                        className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-200 transition-colors"
                        title={isFav ? "Saved to Favorites" : "Save Paper"}
                        aria-label="Save paper"
                      >
                        <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent)] transition-colors">
                      <Link href={`/research/${paper.id}`}>{paper.title}</Link>
                    </h3>

                    {/* Authors */}
                    <div className="text-xs text-[var(--text-muted)] font-medium">
                      {authorText}
                    </div>

                    {/* Why It Matters Callout */}
                    {paper.whyItMatters && (
                      <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-secondary)] leading-relaxed">
                        <strong className="text-[var(--accent)] font-semibold">Why it matters: </strong>
                        <span>{paper.whyItMatters}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Bar (PDF, GitHub, Reader) */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {paper.pdfUrl && (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] font-medium transition-all inline-flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          <span>PDF</span>
                        </a>
                      )}
                      {paper.githubUrl && (
                        <a
                          href={paper.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] font-medium transition-all inline-flex items-center gap-1"
                        >
                          <Github className="h-3 w-3" />
                          <span>Code</span>
                        </a>
                      )}
                    </div>

                    <Link
                      href={`/research/${paper.id}`}
                      className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Read paper</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. QUICK TOPICS (3-5 Discipline Links Only) */}
      <section aria-label="Quick Topics" className="space-y-3 pt-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Quick Topics
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quickTopics.map((t) => (
            <Link
              key={t.slug}
              href={`/topics/${t.slug}`}
              className="px-3 py-1.5 rounded-full bg-white border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-soft)] text-xs text-[var(--text-primary)] font-medium transition-all shadow-2xs"
            >
              {t.name}
            </Link>
          ))}
          <Link
            href="/topics"
            className="px-3 py-1.5 rounded-full bg-[var(--surface-soft)] text-xs text-[var(--accent)] font-medium hover:underline inline-flex items-center gap-1"
          >
            <span>All topics</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* 6. BOTTOM BANNER */}
      <footer className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
        <div>
          <span>Finished with today&apos;s briefing? Explore trending topics, community signals, and open source code.</span>
        </div>
        <Link
          href="/news"
          className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] font-semibold transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <span>View all today&apos;s coverage</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </footer>
    </div>
  );
}
