"use client";

import React from "react";
import Link from "next/link";
import { ArticleGroup, Paper } from "@/lib/db/types";
import { FeaturedStoryCard } from "@/components/cards/featured-story-card";
import { ArrowRight, ExternalLink, ChevronRight, FileText, Newspaper, Github } from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";

interface TodayHeroIntelligenceProps {
  leadStory: ArticleGroup;
  secondaryStories: ArticleGroup[];
  relatedPapers?: Paper[];
  liveSignalCount?: {
    papers: number;
    articles: number;
    repos: number;
  };
}

export function TodayHeroIntelligence({
  leadStory,
  secondaryStories,
  relatedPapers = [],
  liveSignalCount = { papers: 42, articles: 18, repos: 12 },
}: TodayHeroIntelligenceProps) {
  if (!leadStory) return null;

  return (
    <section className="space-y-4 font-sans">
      {/* Visual Header / Micro Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-subtle" />
          <span className="font-semibold text-xs tracking-wide text-[var(--text-primary)] uppercase">
            Featured Story
          </span>
          <span className="text-[var(--border)] text-xs">·</span>
          <span className="text-xs text-[var(--text-secondary)] font-sans hidden sm:inline">
            Verified primary sources and academic preprints
          </span>
        </div>

        <Link
          href="/news"
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-1 font-medium transition-colors"
        >
          <span>All news</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Hero Layout: Featured Story (7 cols) + Overview & Secondary (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Lead Story with 3D depth */}
        <div className="lg:col-span-7 flex flex-col">
          <FeaturedStoryCard story={leadStory} />
        </div>

        {/* Right: Overview + Secondary */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {/* Today Overview Card */}
          <MotionCard3D maxTilt={1.5} translateZ={4} className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs font-sans text-[var(--text-secondary)]">
              <span className="font-bold tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
                Today at a glance
              </span>
              <span className="text-xs text-[var(--text-muted)]">Curated daily</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 text-center font-mono">
              <Link
                href="/research"
                className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] hover:bg-[var(--accent-soft)] transition-colors group"
              >
                <div className="flex items-center justify-center mb-1 text-[var(--accent)]">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="text-base font-extrabold text-[var(--text-primary)]">+{liveSignalCount.papers}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mt-0.5">Preprints</div>
              </Link>

              <Link
                href="/news"
                className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] hover:bg-[var(--accent-soft)] transition-colors group"
              >
                <div className="flex items-center justify-center mb-1 text-[var(--accent)]">
                  <Newspaper className="h-4 w-4" />
                </div>
                <div className="text-base font-extrabold text-[var(--text-primary)]">+{liveSignalCount.articles}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mt-0.5">News</div>
              </Link>

              <Link
                href="/research"
                className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] hover:bg-[var(--accent-soft)] transition-colors group"
              >
                <div className="flex items-center justify-center mb-1 text-[var(--accent)]">
                  <Github className="h-4 w-4" />
                </div>
                <div className="text-base font-extrabold text-[var(--text-primary)]">+{liveSignalCount.repos}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mt-0.5">GitHub</div>
              </Link>
            </div>
          </MotionCard3D>

          {/* Developments Radar */}
          <div className="rounded-3xl border border-[var(--border)] bg-white p-5 font-sans flex-1 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs font-sans text-[var(--text-secondary)]">
              <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
                More from today
              </span>
              <span>{secondaryStories.length} stories</span>
            </div>

            <div className="divide-y divide-[var(--border-subtle)] flex-1 flex flex-col justify-around">
              {secondaryStories.slice(0, 3).map((item) => (
                <div key={item.id} className="py-3 space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-secondary)]">
                    <span className="font-bold uppercase text-[var(--text-primary)]">
                      {item.sources[0]?.sourceName || "Lab"}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span className="text-[var(--accent)] font-semibold">{item.topic}</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-snug line-clamp-2">
                    <a
                      href={item.sources[0]?.url || `#`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--accent)] transition-colors"
                    >
                      {item.title}
                    </a>
                  </h4>

                  <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] line-clamp-1">
                    {item.whyItMatters || item.summary}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                    <a
                      href={item.sources[0]?.url || `#`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--accent)] font-medium"
                    >
                      <span>Direct source</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>

                    <Link
                      href={`/news/${item.id}`}
                      className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 font-semibold"
                    >
                      <span>Details</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
