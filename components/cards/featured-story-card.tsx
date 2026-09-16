"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ExternalLink,
  Heart,
  Share2,
  Check,
  Layers,
  ArrowRight,
} from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";
import { VisualImage } from "@/components/visuals/visual-image";
import { ArticleGroup } from "@/lib/db/types";

interface FeaturedStoryCardProps {
  story: ArticleGroup;
  onFavoriteToggle?: (isFav: boolean) => void;
}

export function FeaturedStoryCard({ story, onFavoriteToggle }: FeaturedStoryCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const primarySource = story.sources?.[0];

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isFavorited;
    setIsFavorited(nextState);

    try {
      if (nextState) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "article",
            entityId: story.id,
            title: story.title,
            category: story.topic,
            url: primarySource?.url || `/news/${story.id}`,
            description: story.summary,
            metadata: {
              sourceName: primarySource?.sourceName || "AI Lab",
              sourceCount: story.sources?.length || 1,
            },
          }),
        });
      } else {
        await fetch(`/api/favorites?entityType=article&entityId=${story.id}`, {
          method: "DELETE",
        });
      }
      if (onFavoriteToggle) onFavoriteToggle(nextState);
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = primarySource?.url || window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [hasVisual, setHasVisual] = useState(true);

  return (
    <MotionCard3D
      maxTilt={2.5}
      translateZ={8}
      className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8 shadow-sm hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group"
    >
      <div className="relative z-10 space-y-4">
        {/* Layer 1: Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--border)] text-[var(--accent)] font-semibold text-xs tracking-wide">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] font-medium text-xs">
              {story.topic}
            </span>
            {story.sources?.length > 1 && (
              <span className="text-xs text-[var(--text-muted)]">
                {story.sources.length} sources
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Save to Permanent Favorites */}
            <button
              onClick={handleFavoriteClick}
              className={`p-2 rounded-xl border transition-all ${
                isFavorited
                  ? "bg-red-50 border-red-200 text-red-600 shadow-xs"
                  : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-red-500 hover:border-red-200 hover:bg-red-50/50"
              }`}
              title={isFavorited ? "Remove from Favorites" : "Save to Permanent Favorites"}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
            </button>

            {/* Share Link */}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
              title="Copy share link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Split Grid for Visual + Headline/Summary OR Typography-first full width */}
        <div className={`grid grid-cols-1 ${hasVisual ? "lg:grid-cols-12" : ""} gap-5 items-start`}>
          <div className={`${hasVisual ? "lg:col-span-7" : "w-full"} space-y-3.5`}>
            {/* Layer 2: Headline */}
            <h2 className="text-xl sm:text-2xl lg:text-[24px] font-semibold tracking-tight text-[var(--text-primary)] leading-snug">
              {primarySource ? (
                <a
                  href={primarySource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  {story.title}
                </a>
              ) : (
                story.title
              )}
            </h2>

            {/* Layer 3: Context Summary */}
            <p className="text-sm sm:text-[15px] text-[var(--text-secondary)] leading-relaxed">
              {story.summary}
            </p>

            {/* Layer 4: Why It Matters Callout */}
            {story.whyItMatters && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 text-xs space-y-1">
                <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  Why it matters
                </div>
                <p className="text-[var(--text-primary)] font-medium leading-relaxed text-xs">
                  {story.whyItMatters}
                </p>
              </div>
            )}
          </div>

          {hasVisual && (
            <div className="lg:col-span-5">
              <VisualImage
                entityType="group"
                entityId={story.id}
                fallbackTitle={story.title}
                fallbackTopic={story.topic}
                aspectRatio="16:9"
                showBadge={true}
                priority={true}
                onUnavailable={() => setHasVisual(false)}
              />
            </div>
          )}
        </div>

        {/* Layer 5: Action Bar & Corroborated Outlets */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] text-xs font-sans">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--text-muted)] font-medium">Sources:</span>
            {story.sources?.map((s, idx) => (
              <a
                key={idx}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] font-medium transition-all inline-flex items-center gap-1 text-xs"
              >
                <span>{s.sourceName}</span>
                <ExternalLink className="h-2.5 w-2.5 text-[var(--text-muted)]" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/news/${story.id}`}
              className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] font-semibold transition-colors px-2 py-1 text-xs"
            >
              <span>View story</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </MotionCard3D>
  );
}
