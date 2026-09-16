"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Flame,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Bookmark,
  Calendar,
  Layers,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AnalyticsSummary {
  currentStreak: number;
  longestStreak: number;
  papersRead: number;
  totalReadingMinutes: number;
  totalReadingSeconds: number;
  totalReadingFormatted: string;
  notesCount: number;
  favoritesCount: number;
  queuedPapersCount: number;
  dailyGoalMinutes: number;
  weeklyChangeMinutes: number;
  weeklyChangePapers: number;
  userTimezone: string;
  isNewUser: boolean;
  observations: string[];
}

interface DayReadingSummary {
  date: string;
  day: string;
  dayOfWeek: number;
  minutes: number;
  seconds: number;
  papersCompleted: number;
  metGoal: boolean;
  qualifiesForStreak: boolean;
}

interface TopicAffinityItem {
  topicId: string;
  topicName: string;
  interactionCount: number;
  percentage: number;
}

interface HeatmapDay {
  date: string;
  dayOfWeek: number;
  minutes: number;
  papersCompleted: number;
  level: 0 | 1 | 2 | 3;
}

export default function InsightsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [weekly, setWeekly] = useState<DayReadingSummary[]>([]);
  const [topics, setTopics] = useState<TopicAffinityItem[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalUpdating, setGoalUpdating] = useState(false);

  // Tooltip hover state for weekly bars & heatmap cells
  const [hoveredWeeklyDay, setHoveredWeeklyDay] = useState<DayReadingSummary | null>(null);
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<HeatmapDay | null>(null);

  const fetchAllData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [sumRes, weekRes, topRes, heatRes] = await Promise.all([
        fetch("/api/insights/summary"),
        fetch("/api/insights/weekly"),
        fetch("/api/insights/topics"),
        fetch("/api/insights/heatmap"),
      ]);

      if (!sumRes.ok || !weekRes.ok || !topRes.ok || !heatRes.ok) {
        throw new Error("Failed to load analytics data from server.");
      }

      const [sumData, weekData, topData, heatData] = await Promise.all([
        sumRes.json(),
        weekRes.json(),
        topRes.json(),
        heatRes.json(),
      ]);

      setSummary(sumData);
      setWeekly(weekData);
      setTopics(topData);
      setHeatmap(heatData);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading insights.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSetDailyGoal = async (minutes: number) => {
    if (!summary || summary.dailyGoalMinutes === minutes || goalUpdating) return;
    setGoalUpdating(true);

    // Optimistic update
    setSummary((prev) => (prev ? { ...prev, dailyGoalMinutes: minutes } : null));

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyGoalMinutes: minutes }),
      });
      if (!res.ok) throw new Error("Failed to save daily goal.");

      // Refresh weekly activity to recompute metGoal states
      const weekRes = await fetch("/api/insights/weekly");
      if (weekRes.ok) {
        const updatedWeekly = await weekRes.json();
        setWeekly(updatedWeekly);
      }
    } catch {
      // Revert if error
      fetchAllData();
    } finally {
      setGoalUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 animate-pulse font-sans">
        {/* Header Skeleton */}
        <div className="space-y-3 pb-6 border-b border-[var(--border)]">
          <div className="h-4 w-36 bg-[var(--surface-soft)] rounded-lg" />
          <div className="h-8 w-72 bg-[var(--surface-soft)] rounded-xl" />
          <div className="h-4 w-96 bg-[var(--surface-soft)] rounded-lg" />
        </div>

        {/* 6 KPI Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)]" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)]" />
          <div className="h-72 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4 font-sans">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Failed to Load Insights</h2>
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
        <Button onClick={() => fetchAllData()} className="bg-[var(--text-primary)] hover:bg-[var(--accent)] text-white">
          Retry Loading
        </Button>
      </div>
    );
  }

  const isZeroState = summary && summary.totalReadingMinutes === 0 && summary.notesCount === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Grounded Reading Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Research Velocity
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            100% data-driven metrics calculated directly from verified reader sessions, preprints read, and technical notes.
          </p>
        </div>

        {/* Header Right: Daily Goal Pill Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[var(--surface-soft)] border border-[var(--border)] rounded-xl p-1 text-xs">
            <span className="text-[11px] font-medium text-[var(--text-muted)] px-2">Daily Goal:</span>
            {[15, 25, 40, 60].map((mins) => {
              const active = summary?.dailyGoalMinutes === mins;
              return (
                <button
                  key={mins}
                  onClick={() => handleSetDailyGoal(mins)}
                  disabled={goalUpdating}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    active
                      ? "bg-[var(--text-primary)] text-white shadow-xs font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white"
                  }`}
                >
                  {mins}m
                </button>
              );
            })}
          </div>

          <button
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors shadow-xs"
            title="Refresh analytics data"
          >
            <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[var(--accent)]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Zero State Notification Banner (if empty activity) */}
      {isZeroState && (
        <div className="rounded-2xl border border-dashed border-[var(--accent)]/40 bg-[var(--surface-soft)]/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--accent)]" />
              <span>Ready to start your research habit?</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-xl">
              You don&apos;t have any active reading sessions yet today. Open today&apos;s featured preprint in the AI Reader to automatically track your reading velocity, calculate your streak, and map topic affinity.
            </p>
          </div>
          <Link href="/research">
            <Button size="sm" className="bg-[var(--text-primary)] hover:bg-[var(--accent)] text-white text-xs gap-1.5 shrink-0 shadow-xs">
              <span>Explore Research Papers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* 6 Primary 3D KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* 1. Current Streak */}
        <MotionCard3D className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-semibold text-[11px]">Current Streak</span>
              <Flame
                className={`h-4 w-4 ${
                  (summary?.currentStreak || 0) > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"
                }`}
              />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {summary?.currentStreak || 0} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">days</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
            {(summary?.currentStreak || 0) > 0 ? "Active today" : "Read paper to start"}
          </div>
        </MotionCard3D>

        {/* 2. Longest Streak */}
        <MotionCard3D className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-semibold text-[11px]">Best Streak</span>
              <Award className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {summary?.longestStreak || 0} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">days</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
            All-time verified best
          </div>
        </MotionCard3D>

        {/* 3. Papers Read */}
        <MotionCard3D className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-semibold text-[11px]">Completed</span>
              <BookOpen className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {summary?.papersRead || 0}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
            Verified preprints
          </div>
        </MotionCard3D>

        {/* 4. Total Reading Time */}
        <MotionCard3D className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-semibold text-[11px]">Total Time</span>
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {summary?.totalReadingFormatted || "0m"}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
            From active reader
          </div>
        </MotionCard3D>

        {/* 5. Notes Count */}
        <MotionCard3D className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-semibold text-[11px]">Notes</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {summary?.notesCount || 0}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
            Synthesized insights
          </div>
        </MotionCard3D>

        {/* 6. Queued Bookmarks */}
        <MotionCard3D className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
              <span className="font-semibold text-[11px]">Queue</span>
              <Bookmark className="h-4 w-4 text-slate-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {summary?.queuedPapersCount || 0}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
            Preprints to read
          </div>
        </MotionCard3D>
      </div>

      {/* Row: Weekly Velocity Chart + Topic Affinity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Consistency Chart */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Weekly Consistency
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Active reader minutes over the past 7 days.
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-xs bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-primary)]">
                Goal: {summary?.dailyGoalMinutes || 25}m/day
              </Badge>
            </div>

            {/* Dynamic Bar Chart with Tooltips */}
            <div className="pt-6 grid grid-cols-7 gap-3 sm:gap-4 items-end h-48 relative">
              {weekly.map((dayItem) => {
                const mins = dayItem.minutes;
                const maxTarget = Math.max(summary?.dailyGoalMinutes || 25, 45);
                const heightPercent = Math.min(100, Math.max(mins > 0 ? 10 : 3, Math.round((mins / maxTarget) * 100)));
                const metGoal = mins >= (summary?.dailyGoalMinutes || 25);
                const isHovered = hoveredWeeklyDay?.date === dayItem.date;

                return (
                  <div
                    key={dayItem.date}
                    className="flex flex-col items-center gap-2 h-full justify-end relative group cursor-pointer"
                    onMouseEnter={() => setHoveredWeeklyDay(dayItem)}
                    onMouseLeave={() => setHoveredWeeklyDay(null)}
                  >
                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-14 z-20 px-2.5 py-1.5 rounded-xl bg-[var(--text-primary)] text-white text-[11px] shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <div className="font-semibold">{dayItem.day} · {dayItem.date}</div>
                        <div className="text-[10px] text-[var(--accent)]">
                          {mins} min · {dayItem.papersCompleted} completed
                          {metGoal && " · Goal met ✓"}
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{mins}m</span>
                    <div className="w-full max-w-[40px] bg-[var(--surface-soft)] rounded-t-xl h-32 flex items-end overflow-hidden p-1 border border-[var(--border)] transition-all group-hover:border-[var(--accent)]">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${
                          metGoal
                            ? "bg-emerald-500"
                            : mins > 0
                            ? "bg-[var(--text-primary)]"
                            : "bg-slate-200"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-muted)]">{dayItem.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Goal Met
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--text-primary)]" /> Reading
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" /> Inactive
              </span>
            </div>
            <span className="text-[11px] font-medium">Timezone: {summary?.userTimezone || "Asia/Kolkata"}</span>
          </div>
        </section>

        {/* Topic Focus Area Affinity */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Focus Area Affinity
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Normalized distribution across 8 canonical AI disciplines.
                </p>
              </div>
              <Link href="/research" className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-0.5">
                <span>Browse</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {topics.length > 0 ? (
              <div className="space-y-3 pt-3">
                {topics.slice(0, 6).map((item) => (
                  <Link
                    key={item.topicId}
                    href={`/research?topic=${item.topicId}`}
                    className="block group"
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        {item.topicName}
                      </span>
                      <span className="text-[var(--text-muted)] font-mono text-[11px]">
                        {item.interactionCount} pts ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--surface-soft)] overflow-hidden border border-[var(--border)]">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 group-hover:bg-[var(--text-primary)]"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center space-y-2 mt-4">
                <p className="text-xs text-[var(--text-muted)]">
                  No topic interactions recorded yet. As you open preprints and record notes, your disciplinary affinity will populate automatically.
                </p>
                <Link href="/research" className="inline-block">
                  <Button size="sm" variant="outline" className="text-xs border-[var(--border)] mt-2">
                    Browse Research Papers
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
            Weighted by paper completions, active minutes, bookmarks, and technical notes.
          </div>
        </section>
      </div>

      {/* GitHub-Style 90-Day Reading Heatmap */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              90-Day Reading Activity Heatmap
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Daily reading volume across the last 13 weeks.
            </p>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="text-[11px]">Less</span>
            <span className="h-3 w-3 rounded-xs bg-[var(--border-subtle)] border border-slate-200" title="0 min" />
            <span className="h-3 w-3 rounded-xs bg-[var(--accent-soft)] border border-teal-200" title="1-14 min" />
            <span className="h-3 w-3 rounded-xs bg-[var(--accent-soft)] border border-teal-300" title="15-29 min" />
            <span className="h-3 w-3 rounded-xs bg-[var(--accent)] border border-teal-700" title="30+ min" />
            <span className="text-[11px]">More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pt-2 pb-2">
          <div className="min-w-[680px]">
            {/* Grid Container */}
            <div className="flex gap-1 relative">
              {/* Day of week labels */}
              <div className="flex flex-col justify-between text-[9px] font-mono text-[var(--text-muted)] pr-2 py-0.5 select-none">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* 13 Week Columns */}
              <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1">
                {heatmap.map((cell) => {
                  const isHovered = hoveredHeatmapDay?.date === cell.date;

                  let colorClass = "bg-[var(--border-subtle)] border-slate-200";
                  if (cell.level === 1) colorClass = "bg-[var(--accent-soft)] border-teal-200";
                  else if (cell.level === 2) colorClass = "bg-[var(--accent-soft)] border-teal-300";
                  else if (cell.level === 3) colorClass = "bg-[var(--accent)] border-teal-700";

                  return (
                    <div
                      key={cell.date}
                      onMouseEnter={() => setHoveredHeatmapDay(cell)}
                      onMouseLeave={() => setHoveredHeatmapDay(null)}
                      className={`h-3.5 w-3.5 rounded-xs border transition-all cursor-pointer hover:scale-125 relative z-10 ${colorClass}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Floating Tooltip for Active Hovered Cell */}
            {hoveredHeatmapDay && (
              <div className="mt-2 text-xs font-mono text-[var(--text-primary)] bg-[var(--surface-soft)] border border-[var(--border)] rounded-xl px-3 py-1.5 inline-flex items-center gap-3">
                <span className="font-semibold">{hoveredHeatmapDay.date}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span>{hoveredHeatmapDay.minutes} minutes read</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--accent)] font-semibold">
                  {hoveredHeatmapDay.papersCompleted} papers completed
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dynamic Behavioral Observations */}
      {summary && summary.observations && summary.observations.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-gradient-to-r from-white to-[var(--surface-soft)] p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <span>Habit Observations</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.observations.map((obs, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-white p-3 text-xs text-[var(--text-primary)]"
              >
                <TrendingUp className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{obs}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
