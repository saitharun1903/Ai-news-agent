"use client";

import React from "react";
import Link from "next/link";
import { Flame, Clock, BookOpen, ArrowRight } from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";

interface WeekDayItem {
  day: string;
  date: string;
  hasRead: boolean;
  minutes: number;
}

interface ReadingHabitCardProps {
  streakDays: number;
  weekDays: WeekDayItem[];
  papersRead: number;
  totalMinutes: number;
}

export function ReadingHabitCard({
  streakDays,
  weekDays,
  papersRead,
  totalMinutes,
}: ReadingHabitCardProps) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <MotionCard3D
      maxTilt={1.5}
      translateZ={5}
      className="rounded-3xl border border-[var(--border)] bg-white p-6 flex flex-col justify-between shadow-sm hover:shadow-card-hover transition-all duration-300 font-sans group"
    >
      <div>
        {/* Header: Streak */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
              <Flame className="h-5 w-5 fill-amber-500 text-amber-500 animate-pulse" />
            </div>
            <div>
              <div className="text-base font-semibold text-[var(--text-primary)] leading-none">
                {streakDays} Day Streak
              </div>
              <span className="text-xs text-[var(--text-secondary)] font-normal">Active daily research habit</span>
            </div>
          </div>

          <Link
            href="/insights"
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-1 transition-colors"
          >
            <span>Insights</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Week Activity Dots */}
        <div className="mt-4 pt-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Weekly Activity
          </div>
          <div className="grid grid-cols-7 gap-1 text-center font-sans">
            {weekDays.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">{d.day}</span>
                <span
                  className={`text-lg leading-none ${
                    d.hasRead
                      ? "text-emerald-500"
                      : "text-slate-200"
                  }`}
                  title={`${d.day}: ${d.minutes} min`}
                >
                  {d.hasRead ? "●" : "○"}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {d.minutes > 0 ? `${d.minutes}m` : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="mt-5 p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--accent)]" />
            <span className="font-semibold text-[var(--text-primary)]">{papersRead}</span>
            <span>preprints finished</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--accent)]" />
            <span className="font-semibold text-[var(--text-primary)]">{timeFormatted}</span>
            <span>total read</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="mt-5 pt-3.5 border-t border-[var(--border-subtle)]">
        <Link
          href="/insights"
          className="w-full py-2.5 px-3.5 rounded-2xl border border-[var(--border)] hover:bg-[var(--surface-soft)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>View Detailed Reading Insights</span>
          <ArrowRight className="h-3.5 w-3.5 text-[var(--accent)]" />
        </Link>
      </div>
    </MotionCard3D>
  );
}
