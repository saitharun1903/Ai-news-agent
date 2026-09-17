import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { AnalyticsService } from "@/lib/analytics";
import { TodayBriefingView, QuickTopicItem } from "@/components/today/today-briefing-view";
import { TodayRefreshButton } from "@/components/today/today-refresh-button";
import {
  getLunorBusinessDate,
  formatLunorDate,
  formatLunorTime,
  LUNOR_DEFAULT_TIMEZONE,
} from "@/lib/date";
import { getEffectiveUserId } from "@/lib/supabase/server";
import { Clock, ArrowRight, Sparkles, Flame } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60; // 1-minute revalidation

export default async function TodayPage() {
  const timezone = LUNOR_DEFAULT_TIMEZONE;
  const todayDate = getLunorBusinessDate(new Date(), timezone);
  const userId = await getEffectiveUserId();

  // 1. Fetch today's immutable daily snapshot strictly for today's IST business date
  const [feed, profile] = await Promise.all([
    db.getDailyFeed(todayDate, timezone),
    db.getUserProfile(userId),
  ]);

  const analytics = await AnalyticsService.getSummary(profile.id);

  // 2. If today's edition is not yet generated, display the clear pending state
  // CRITICAL: NEVER silently fall back to yesterday's content under today's date!
  if (!feed || (!feed.leadStory && (!feed.stories || feed.stories.length === 0))) {
    const yesterdayDate = getLunorBusinessDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      timezone
    );
    const todayFormatted = formatLunorDate(todayDate, timezone);
    const yesterdayFormatted = formatLunorDate(yesterdayDate, timezone);

    return (
      <div className="max-w-[1240px] mx-auto font-sans pb-16 space-y-10">
        {/* Header */}
        <header className="space-y-2 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider text-amber-600">
                Today · Preparing
              </span>
              <span className="text-[var(--border)]">·</span>
              <span className="font-medium text-[var(--text-primary)]">{todayFormatted}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 font-mono text-[11px] text-amber-700">
              Midnight Roll In Progress
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
            Today&apos;s AI & Software
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
            Curated daily briefing of high-impact industry developments and essential computer science research.
          </p>
        </header>

        {/* Daily Reading Habit Tracker */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Flame className={`h-5 w-5 ${analytics.currentStreak > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--text-primary)] font-mono">
                  {analytics.currentStreak} {analytics.currentStreak === 1 ? "day" : "days"} streak
                </span>
                {analytics.todayQualified ? (
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Goal Met Today
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">
                    {Math.max(0, (profile.dailyGoalMinutes || 25) - (analytics.todayMinutes || 0))}m remaining today
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Daily habit goal: {analytics.todayMinutes || 0} / {profile.dailyGoalMinutes || 25} min
              </p>
            </div>
          </div>
        </div>

        {/* Preparation State Card */}
        <div className="rounded-3xl border border-[var(--border)] bg-white p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="h-7 w-7 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Today&apos;s Edition is Being Prepared
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              The daily dispatch for <strong className="text-[var(--text-primary)]">{todayFormatted}</strong> is undergoing multi-source ingestion, clustering, and AI synthesis for the Asia/Kolkata publication window.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <TodayRefreshButton />
            <Link
              href={`/archive/${yesterdayDate}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <span>View {yesterdayFormatted} Edition</span>
              <ArrowRight className="h-4 w-4 text-[var(--text-secondary)]" />
            </Link>
          </div>

          <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Automatic generation triggers daily at 12:00 AM Asia/Kolkata</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Today's feed is ready - Format explicit IST date and timestamp
  const dateFormatted = formatLunorDate(feed.date, timezone);
  const lastUpdatedText = formatLunorTime(feed.generatedAt, timezone);

  const leadStory = feed.leadStory || feed.stories[0];
  const supportingStories = feed.leadStory
    ? feed.stories.filter((s) => s.id !== feed.leadStory?.id).slice(0, 4)
    : feed.stories.slice(1, 5);

  const papersPool = feed.paperOfDay
    ? [feed.paperOfDay, ...feed.papers.filter((p) => p.id !== feed.paperOfDay?.id)]
    : feed.papers;
  const recommendedPapers = papersPool.slice(0, 4);

  const quickTopics: QuickTopicItem[] = [
    { name: "Agents", slug: "agents" },
    { name: "Systems", slug: "systems" },
    { name: "Security", slug: "security" },
    { name: "Software Engineering", slug: "softwareengineering" },
    { name: "Databases", slug: "databases" },
  ];

  return (
    <TodayBriefingView
      leadStory={leadStory}
      supportingStories={supportingStories}
      recommendedPapers={recommendedPapers}
      quickTopics={quickTopics}
      lastUpdatedText={lastUpdatedText}
      dateFormatted={dateFormatted}
      streak={analytics.currentStreak}
      dailyGoalMinutes={profile.dailyGoalMinutes || 25}
      todayMinutes={analytics.todayMinutes || 0}
      todayQualified={analytics.todayQualified}
    />
  );
}
