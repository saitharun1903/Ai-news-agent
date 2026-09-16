"use client";

import React, { useState, useEffect } from "react";
import { UserProfile } from "@/lib/db/types";
import { siteConfig } from "@/config/site";
import {
  User,
  Bell,
  Sliders,
  BookOpen,
  ShieldCheck,
  Check,
  Download,
  Flame,
  Award,
  Clock,
  Globe,
  Sparkles,
  Layers,
  Calendar,
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";

interface SettingsAnalytics {
  currentStreak?: number;
  longestStreak?: number;
  papersRead?: number;
  todayMinutes?: number;
  todayRemainingMinutes?: number;
  todayProgressPct?: number;
  todayQualified?: boolean;
  totalReadingMinutes?: number;
  totalReadingFormatted?: string;
  userTimezone?: string;
}

interface SettingsViewProps {
  initialProfile: UserProfile;
  initialAnalytics?: SettingsAnalytics;
}

const COMMON_TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT, UTC-5)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT, UTC-6)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT, UTC-7)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT, UTC-8)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST, UTC+0)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST, UTC+1)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST, UTC+1)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST, UTC+9)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT, UTC+10)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

export function SettingsView({ initialProfile, initialAnalytics }: SettingsViewProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [analytics, setAnalytics] = useState<SettingsAnalytics | undefined>(initialAnalytics);
  const [previousProfile, setPreviousProfile] = useState<UserProfile>(initialProfile);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [browserPermission, setBrowserPermission] = useState<string>("default");

  // Check browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
      } catch {}
    }
  };

  const memberSinceFormatted = React.useMemo(() => {
    if (!profile.createdAt) return "September 2026";
    try {
      const d = new Date(profile.createdAt);
      if (isNaN(d.getTime())) return "September 2026";
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return "September 2026";
    }
  }, [profile.createdAt]);

  const initials = React.useMemo(() => {
    const name = profile.name?.trim() || "Lunor Reader";
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [profile.name]);

  const toggleTopic = (slug: string) => {
    const exists = profile.interestedTopics.includes(slug);
    const updated = exists
      ? profile.interestedTopics.filter((t) => t !== slug)
      : [...profile.interestedTopics, slug];
    setProfile({ ...profile, interestedTopics: updated });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    // Store snapshot for optimistic rollback
    const rollbackSnapshot = { ...profile };
    setPreviousProfile(rollbackSnapshot);

    try {
      // 1. Update preferences via validated API
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyGoalMinutes: Number(profile.dailyGoalMinutes) || 25,
          technicalDepth: profile.difficultyPreference,
          interestedTopics: profile.interestedTopics,
          timezone: profile.timezone || "Asia/Kolkata",
          morningBriefingTime: profile.morningBriefingTime || "08:30",
          weekendDigestEnabled: profile.weekendNotificationsEnabled,
          desktopNotificationsEnabled: profile.desktopNotificationsEnabled,
          soundEnabled: profile.soundEnabled,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Couldn't save your preferences.");
      }

      // Also persist user name/email/bio if changed
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          timezone: profile.timezone,
          dailyGoalMinutes: Number(profile.dailyGoalMinutes) || 25,
          difficultyPreference: profile.difficultyPreference,
          interestedTopics: profile.interestedTopics,
          morningBriefingTime: profile.morningBriefingTime,
          desktopNotificationsEnabled: profile.desktopNotificationsEnabled,
          weekendNotificationsEnabled: profile.weekendNotificationsEnabled,
          soundEnabled: profile.soundEnabled,
        }),
      });

      // Refresh analytics in background to keep daily goal / timezone calculations in sync
      fetch("/api/insights/summary")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setAnalytics(data);
        })
        .catch(() => {});

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      // Roll back to previous snapshot
      setProfile(rollbackSnapshot);
      setErrorMessage(err.message || "Couldn't save your preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lunor-archive-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage("Complete reading archive exported successfully");
      setTimeout(() => setExportMessage(""), 3500);
    } catch (err) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "lunor-profile.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setExportMessage("Profile data exported successfully");
      setTimeout(() => setExportMessage(""), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const streakVal = profile.readingStreak ?? analytics?.currentStreak ?? 0;
  const longestVal = profile.longestStreak ?? analytics?.longestStreak ?? 0;
  const papersVal = profile.papersReadCount ?? analytics?.papersRead ?? 0;
  const todayMins = analytics?.todayMinutes ?? 0;
  const dailyGoal = Number(profile.dailyGoalMinutes) || 25;
  const progressPct = Math.min(100, Math.round((todayMins / dailyGoal) * 100));
  const isGoalMetToday = todayMins >= dailyGoal || (analytics?.todayQualified && todayMins >= dailyGoal);

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-16">
      {/* 1. Profile Header Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* User Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-xs select-none">
                {initials}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"
                title="Active member"
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                  {profile.name || "Sai Tharun Reddy"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active member
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span>{profile.email || "sai@lunor.co.in"}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pt-0.5">
                {profile.bio || "AI Systems & Deep Learning Preprints"}
              </p>
            </div>
          </div>

          {/* Quick Meta Details */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-col gap-2 pt-3 sm:pt-0 sm:pl-6 sm:border-l border-[var(--border)] text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Member Since
              </span>
              <span className="font-medium text-[var(--text-primary)] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" />
                {memberSinceFormatted}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Timezone
              </span>
              <span className="font-medium text-[var(--text-primary)] flex items-center gap-1 font-mono text-[11px]">
                <Globe className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                {profile.timezone || "Asia/Kolkata"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real Verified Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Current Streak */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Current Streak</span>
            <Flame
              className={`h-4 w-4 ${
                streakVal > 0 ? "text-amber-500 fill-amber-500 animate-pulse-subtle" : "text-slate-300"
              }`}
            />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {streakVal} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">days</span>
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
              {isGoalMetToday ? (
                <span className="text-emerald-600 font-medium">Goal completed today</span>
              ) : streakVal > 0 ? (
                `${Math.max(0, dailyGoal - todayMins)}m needed today`
              ) : (
                `Read ${dailyGoal}m today to start`
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Longest Streak */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Best Streak</span>
            <Award className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {longestVal} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">days</span>
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
              All-time personal record
            </div>
          </div>
        </div>

        {/* Card 3: Papers Read */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Papers Read</span>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {papersVal}
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate">
              Completed preprints
            </div>
          </div>
        </div>

        {/* Card 4: Today's Reading Goal Progress */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Today&apos;s Reading</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {todayMins} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">/ {dailyGoal}m</span>
            </div>
            <div className="mt-2">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGoalMetToday ? "bg-emerald-500" : "bg-[var(--accent)]"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-1">
                <span>{progressPct}% goal</span>
                {isGoalMetToday && <span className="text-emerald-600 font-semibold">Met</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Toast Feedback */}
      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 flex items-center gap-2 shadow-xs transition-all">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">Preferences saved and synchronized successfully</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-start justify-between gap-3 shadow-xs transition-all">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-red-700 mt-0.5">Your changes were not applied to the database.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {exportMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 flex items-center gap-2 shadow-xs transition-all">
          <Check className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="font-medium">{exportMessage}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 3. Personal Account Information */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <User className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-medium text-[var(--text-primary)] block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your full name"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-2xs"
              />
            </div>

            <div>
              <label className="font-medium text-[var(--text-primary)] block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="name@domain.com"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-2xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-medium text-[var(--text-primary)] block mb-1.5">
                Bio / Research Focus
              </label>
              <input
                type="text"
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="e.g. AI Systems & Deep Learning Preprints"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-2xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-medium text-[var(--text-primary)] block mb-1.5">
                Local Timezone (Streak &amp; Daily Reset Window)
              </label>
              <select
                value={profile.timezone || "Asia/Kolkata"}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-2xs"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                Daily reading streaks and snapshots evaluate strictly against your local midnight calendar boundary.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Reading Preferences */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <BookOpen className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Reading Preferences &amp; Goals
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Daily Goal */}
            <div>
              <label className="font-medium text-[var(--text-primary)] block mb-2">
                Daily Reading Goal (Streak Threshold)
              </label>
              <div className="flex items-center gap-2">
                {[15, 25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setProfile({ ...profile, dailyGoalMinutes: mins })}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      Number(profile.dailyGoalMinutes) === mins
                        ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-2xs"
                        : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                You must accumulate at least this duration in an active day to qualify for a streak.
              </p>
            </div>

            {/* Technical Depth */}
            <div>
              <label className="font-medium text-[var(--text-primary)] block mb-2">
                Technical Depth Preference
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "accessible", label: "Introductory" },
                  { id: "intermediate", label: "Balanced" },
                  { id: "rigorous", label: "Advanced" },
                  { id: "all", label: "All preprints" },
                ].map((opt) => {
                  const currentNorm = (profile.difficultyPreference || "intermediate").toLowerCase();
                  const isSelected =
                    currentNorm === opt.id ||
                    (opt.id === "accessible" && currentNorm === "beginner") ||
                    (opt.id === "rigorous" && currentNorm === "advanced");

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProfile({ ...profile, difficultyPreference: opt.id as any })}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-2xs"
                          : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                Steers recommended preprints, Paper of the Day, and AI executive summaries.
              </p>
            </div>
          </div>

          {/* Topics */}
          <div className="pt-2">
            <label className="font-medium text-xs text-[var(--text-primary)] block mb-2">
              Curated Research Topics (Prioritizes Recommended &amp; For You Feeds)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {siteConfig.topics.map((t) => {
                const selected = profile.interestedTopics.includes(t.slug);
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => toggleTopic(t.slug)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all border ${
                      selected
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30 font-semibold shadow-2xs"
                        : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-slate-300"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              General research browsing remains open to all topics, but personalized recommendation tabs will prioritize these selections.
            </p>
          </div>
        </section>

        {/* 5. Notifications & Daily Briefings */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <Bell className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Notifications &amp; Daily Briefing
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-medium text-[var(--text-primary)] block mb-1">
                Morning Briefing Time
              </label>
              <input
                type="time"
                value={profile.morningBriefingTime || "08:30"}
                onChange={(e) => setProfile({ ...profile, morningBriefingTime: e.target.value })}
                className="rounded-xl border border-[var(--border)] bg-white px-3.5 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-2xs"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Prepares fresh research briefings for your morning routine at your configured time.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.desktopNotificationsEnabled}
                    onChange={(e) =>
                      setProfile({ ...profile, desktopNotificationsEnabled: e.target.checked })
                    }
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] h-4 w-4"
                  />
                  <span className="font-medium text-[var(--text-primary)] text-xs">
                    Desktop notification alerts
                  </span>
                </label>

                {/* Browser permission status indicator */}
                {profile.desktopNotificationsEnabled && (
                  <div className="mt-2 pl-6">
                    {browserPermission === "granted" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Check className="h-3 w-3 text-emerald-600" />
                        Browser notification permission granted
                      </span>
                    ) : browserPermission === "denied" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        Blocked by browser. Enable notifications in site settings.
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={requestBrowserPermission}
                        className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] font-medium underline"
                      >
                        Grant browser permission for alerts &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.weekendNotificationsEnabled}
                  onChange={(e) =>
                    setProfile({ ...profile, weekendNotificationsEnabled: e.target.checked })
                  }
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] h-4 w-4"
                />
                <span className="font-medium text-[var(--text-primary)] text-xs">
                  Include weekend research digests (Sat &amp; Sun)
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* 6. Account & Data Management */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Data Portability &amp; Archive
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-medium text-[var(--text-primary)]">Export Full Account Archive</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Download a clean JSON archive of your reading sessions, notes, saved papers, and profile statistics.
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--surface-soft)] text-xs font-medium text-[var(--text-primary)] transition-colors shadow-2xs disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              )}
              <span>Export Archive JSON</span>
            </button>
          </div>
        </section>

        {/* 7. Connected Ingestion Providers (Subdued) */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-3 opacity-80">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <Layers className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Connected Research Services
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { name: "arXiv API", desc: "cs.AI, cs.LG, cs.CL, cs.CV preprints" },
              { name: "Semantic Scholar API", desc: "Citations and TLDR summaries" },
              { name: "Crossref DOI Registry", desc: "Canonical metadata resolution" },
              { name: "GitHub REST API", desc: "Open-source repository sync" },
            ].map((p) => (
              <div
                key={p.name}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-medium text-[var(--text-secondary)] text-[11px] block">{p.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] block">{p.desc}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Online
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Action Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving preferences...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Save preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
