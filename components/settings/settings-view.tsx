"use client";

import React, { useState } from "react";
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
  Layers,
} from "lucide-react";

interface SettingsViewProps {
  initialProfile: UserProfile;
}

export function SettingsView({ initialProfile }: SettingsViewProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const toggleTopic = (slug: string) => {
    const exists = profile.interestedTopics.includes(slug);
    const updated = exists
      ? profile.interestedTopics.filter((t) => t !== slug)
      : [...profile.interestedTopics, slug];
    setProfile({ ...profile, interestedTopics: updated });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          morningBriefingTime: profile.morningBriefingTime,
          dailyGoalMinutes: profile.dailyGoalMinutes,
          difficultyPreference: profile.difficultyPreference,
          desktopNotificationsEnabled: profile.desktopNotificationsEnabled,
          weekendNotificationsEnabled: profile.weekendNotificationsEnabled,
          soundEnabled: profile.soundEnabled,
          interestedTopics: profile.interestedTopics,
        }),
      });
      const updated = await res.json();
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "researchpulse-profile.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportMessage("Reading history exported successfully");
    setTimeout(() => setExportMessage(""), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* 1. Profile Header */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-xl shadow-xs">
            RP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                {profile.name || "ResearchPulse Reader"}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
                Active Member
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Personalized intelligence feed &bull; Connected to arXiv, Crossref &amp; Semantic Scholar
            </p>
          </div>
        </div>

        {/* Header Stats */}
        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-[var(--border)] pt-3 sm:pt-0 sm:pl-6 text-xs">
          <div>
            <div className="text-lg font-bold text-[var(--text-primary)] font-mono">
              {profile.papersReadCount || 0}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Papers read</div>
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--accent)] font-mono flex items-center gap-1">
              <Flame className="h-4 w-4 fill-[var(--accent)]" />
              {profile.readingStreak || 0}d
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Reading streak</div>
          </div>
        </div>
      </div>

      {/* Save Toast Feedback */}
      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 flex items-center gap-2 shadow-xs transition-all">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">Preferences saved successfully</span>
        </div>
      )}

      {exportMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 flex items-center gap-2 shadow-xs transition-all">
          <Check className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="font-medium">{exportMessage}</span>
        </div>
      )}

      {/* 2. Reading Preferences */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <BookOpen className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Reading Preferences
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-medium text-[var(--text-primary)] block mb-1.5">
              Daily Reading Goal
            </label>
            <div className="flex items-center gap-2">
              {[15, 25, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setProfile({ ...profile, dailyGoalMinutes: mins })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    profile.dailyGoalMinutes === mins
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-2xs"
                      : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  {mins} min/day
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-medium text-[var(--text-primary)] block mb-1.5">
              Technical Depth
            </label>
            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "All preprints" },
                { id: "accessible", label: "Introductory" },
                { id: "rigorous", label: "Advanced" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, difficultyPreference: opt.id as any })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    profile.difficultyPreference === opt.id
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-2xs"
                      : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="font-medium text-xs text-[var(--text-primary)] block mb-2">
            Topics of Interest
          </label>
          <div className="flex flex-wrap gap-1.5">
            {siteConfig.topics.map((t) => {
              const selected = profile.interestedTopics.includes(t.slug);
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleTopic(t.slug)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    selected
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30 font-semibold"
                      : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-slate-300"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Notifications & Daily Briefing */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <Bell className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Notifications &amp; Briefings
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-medium text-[var(--text-primary)] block mb-1">
              Morning Briefing Time
            </label>
            <input
              type="time"
              value={profile.morningBriefingTime}
              onChange={(e) => setProfile({ ...profile, morningBriefingTime: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-2xs"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Triggers the daily briefing summary in your local timezone ({profile.timezone || "UTC"}).
            </p>
          </div>

          <div className="space-y-3 pt-1">
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
                Include weekend research digests
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Integrations */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <Layers className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Connected Data Providers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { name: "arXiv API", desc: "cs.AI, cs.LG, cs.CL, cs.CV, cs.SE preprints", status: "Connected" },
            { name: "Semantic Scholar API", desc: "Academic citations, authors, and TLDR summaries", status: "Connected" },
            { name: "Crossref DOI Registry", desc: "Canonical DOI metadata resolution", status: "Connected" },
            { name: "GitHub REST API", desc: "Open source repository stars, licenses, and releases", status: "Connected" },
          ].map((provider) => (
            <div
              key={provider.name}
              className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] flex items-start justify-between gap-2"
            >
              <div>
                <div className="font-semibold text-[var(--text-primary)] text-xs">
                  {provider.name}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {provider.desc}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {provider.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Account & Data Management */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Account &amp; Data
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-medium text-[var(--text-primary)]">Export Your Reading History</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Download a complete JSON snapshot of your reading activity, goals, and saved topics.
            </div>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--surface-soft)] text-xs font-medium text-[var(--text-primary)] transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <span>Export JSON</span>
          </button>
        </div>
      </section>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <span>Saving changes...</span>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Save preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
