import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  Calendar,
  History,
  ArrowLeft,
  BookOpen,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZeroClickStoryCard } from "@/components/feed/zero-click-story-card";
import { ZeroClickResearchCard } from "@/components/feed/zero-click-research-card";

export const revalidate = 0; // dynamic

export default async function DailySnapshotPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const snapshot = await db.getDailyFeed(date);

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-6 font-sans">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <History className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Snapshot Not Found for {date}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Snapshots are automatically archived for a rolling 10-day window. This snapshot may have expired or not yet been generated.
          </p>
        </div>
        <Link href="/archive">
          <Button className="gap-2 bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-2xl">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Archive</span>
          </Button>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(snapshot.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Back to Archive Breadcrumb */}
      <div>
        <Link
          href="/archive"
          className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Archive</span>
        </Link>
      </div>

      {/* Snapshot Header */}
      <div className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-sans font-medium border ${
                snapshot.status === "active"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border)]"
                  : "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border)]"
              }`}
            >
              {snapshot.status === "active" ? "Today" : "Archived"}
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Captured: {snapshot.date} ({snapshot.timezone || "Asia/Kolkata"})
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span className="font-semibold text-[var(--text-primary)]">{formattedDate}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {snapshot.title}
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            {snapshot.synthesis || snapshot.summary}
          </p>
        </div>

        {/* Topic Pill List */}
        {snapshot.topicCounts && snapshot.topicCounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-bold">Covered:</span>
            {snapshot.topicCounts.map((tc) => (
              <span
                key={tc.topic}
                className="px-3 py-1 rounded-full bg-[var(--surface-soft)] text-xs font-mono text-[var(--accent)] border border-[var(--border)] font-semibold"
              >
                {tc.topic} ({tc.count})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Snapshot Lead Story */}
      {snapshot.leadStory && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Lead Story of {snapshot.date}</span>
          </div>
          <ZeroClickStoryCard story={snapshot.leadStory} featured={true} />
        </section>
      )}

      {/* Snapshot Grouped Articles */}
      {snapshot.stories && snapshot.stories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-bold">
              <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Lab &amp; Industry Developments ({snapshot.stories.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.stories.map((story) => (
              <ZeroClickStoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}

      {/* Snapshot Research Papers */}
      {snapshot.papers && snapshot.papers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-bold">
              <BookOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Academic Preprints Featured ({snapshot.papers.length})</span>
            </div>
          </div>
          <div className="space-y-4">
            {snapshot.papers.map((paper) => (
              <ZeroClickResearchCard key={paper.id} paper={paper} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
