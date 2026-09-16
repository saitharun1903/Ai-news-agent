import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  Calendar,
  History,
  ArrowRight,
  BookOpen,
  FileText,
  Sparkles,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { getLunorBusinessDate, formatLunorDate, LUNOR_DEFAULT_TIMEZONE } from "@/lib/date";

export const revalidate = 0; // dynamic

export default async function ArchivePage() {
  const feeds = await db.getDailyFeeds(10);
  const todayDate = getLunorBusinessDate(new Date(), LUNOR_DEFAULT_TIMEZONE);
  const yesterdayDate = getLunorBusinessDate(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
    LUNOR_DEFAULT_TIMEZONE
  );

  const getRelativeDayLabel = (feedDate: string, index: number) => {
    if (feedDate === todayDate) {
      return { label: "TODAY", color: "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border)] font-bold" };
    }
    if (feedDate === yesterdayDate) {
      return { label: "YESTERDAY", color: "bg-blue-50 text-blue-700 border-blue-200 font-semibold" };
    }
    return { label: `DAY -${index + 1}`, color: "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border)] font-medium" };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-[var(--accent)] mb-1 font-semibold">
          <History className="h-3.5 w-3.5" />
          <span>Daily Archive</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              Daily Archive
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Revisit complete daily archives preserved across the rolling 10-day history.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-sans text-[var(--accent)] bg-[var(--surface-soft)] px-3.5 py-1.5 rounded-2xl border border-[var(--border)] shrink-0 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>10-day history</span>
          </div>
        </div>
      </div>

      {/* Persistence Policy Explainer Box */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-xs text-[var(--text-primary)] shadow-card">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-[var(--text-primary)] text-sm">
              Architecture Guarantee: Rolling History &amp; Permanent Retention
            </h4>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Lunor maintains a rolling 10-day window for complete daily dispatches. Snapshots older than 10 days are pruned automatically.
              <strong className="text-[var(--text-primary)]"> However, items you save to Favorites, your Reading List, and your personal Notes remain permanently stored in your account and are never removed.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Snapshot Feed Timeline */}
      {feeds.length > 0 ? (
        <div className="space-y-4">
          {feeds.map((feed, idx) => {
            const rel = getRelativeDayLabel(feed.date, idx);
            const formattedDate = formatLunorDate(feed.date, LUNOR_DEFAULT_TIMEZONE);

            return (
              <div
                key={feed.id}
                className="group relative rounded-3xl border border-[var(--border)] bg-white p-6 transition-all duration-300 hover:border-[var(--accent)] hover:shadow-card-hover"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono border ${rel.color}`}
                    >
                      {rel.label}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-primary)] font-bold">
                      {feed.date}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5 bg-[var(--surface-soft)] px-2.5 py-1 rounded-xl border border-[var(--border)]">
                      <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <strong className="text-[var(--text-primary)]">{feed.stories?.length || 0}</strong> stories
                    </span>
                    <span className="flex items-center gap-1.5 bg-[var(--surface-soft)] px-2.5 py-1 rounded-xl border border-[var(--border)]">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                      <strong className="text-[var(--text-primary)]">{feed.papers?.length || 0}</strong> preprints
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                  <div className="lg:col-span-3 space-y-2">
                    <h3 className="text-lg font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      <Link href={`/archive/${feed.date}`} className="hover:underline">
                        {feed.title}
                      </Link>
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {feed.synthesis || feed.summary}
                    </p>

                    {/* Topic Tags */}
                    {feed.topicCounts && feed.topicCounts.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {feed.topicCounts.slice(0, 4).map((tc) => (
                          <span
                            key={tc.topic}
                            className="px-2.5 py-0.5 rounded-full bg-[var(--surface-soft)] text-[11px] font-mono text-[var(--accent)] border border-[var(--border)] font-semibold"
                          >
                            {tc.topic} ({tc.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex lg:justify-end">
                    <Link href={`/archive/${feed.date}`} className="w-full lg:w-auto">
                      <Button
                        size="sm"
                        className="w-full lg:w-auto gap-2 bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] font-semibold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs"
                      >
                        <span>View Snapshot</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--accent)]">
            <History className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Archive is building
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              Daily snapshots are created automatically every midnight. Check back after the next scheduled ingestion!
            </p>
          </div>
          <Link href="/">
            <Button size="sm" className="gap-2 text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent)] rounded-2xl">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Explore Today's Dispatch</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
