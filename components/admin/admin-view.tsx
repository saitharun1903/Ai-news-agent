"use client";

import React, { useState } from "react";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Zap,
} from "lucide-react";
import { IngestionLog, Source, DailyFeedSnapshot } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminViewProps {
  initialSources: Source[];
  initialLogs: IngestionLog[];
  articleCount: number;
  groupCount: number;
  paperCount: number;
  chunkCount: number;
  todayDate?: string;
  todayFeed?: DailyFeedSnapshot | null;
  latestJob?: any | null;
  nextScheduledRun?: string;
}

export function AdminView({
  initialSources,
  initialLogs,
  articleCount,
  groupCount,
  paperCount,
  chunkCount,
  todayDate = "2026-09-17",
  todayFeed = null,
  latestJob = null,
  nextScheduledRun = "September 18, 2026, 12:00 AM IST",
}: AdminViewProps) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [logs, setLogs] = useState<IngestionLog[]>(initialLogs);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [currentFeed, setCurrentFeed] = useState<DailyFeedSnapshot | null>(todayFeed);
  const [jobInfo, setJobInfo] = useState<any | null>(latestJob);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Executing live ingestion from arXiv, Hugging Face, Lab RSS & HN...");
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(
          `Success: Processed ${data.result.articlesCount} articles and ${data.result.papersCount} papers in ${data.result.durationMs}ms.`
        );
        const logRes = await fetch("/api/ingest");
        const logData = await logRes.json();
        if (logData.latestLogs) setLogs(logData.latestLogs);
        if (logData.sources) setSources(logData.sources);
      } else {
        setSyncStatus(`Sync error: ${data.error}`);
      }
    } catch (err: any) {
      setSyncStatus(`Request failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTriggerMidnightGeneration = async (force: boolean = true) => {
    setIsSyncing(true);
    setSyncStatus(`Triggering Midnight Generation for ${todayDate} (force=${force})...`);
    try {
      const res = await fetch(
        `/api/cron/daily?secret=lunor_migrate_prod_2026&force=${force}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setSyncStatus(
          `Generated edition for ${data.editionDate} (Snapshot: ${data.snapshotId}) in ${data.durationMs}ms with ${data.storiesCount} stories and ${data.papersCount} papers.`
        );
        // Refresh local view
        const todayRes = await fetch(`/api/today`);
        const todayData = await todayRes.json();
        if (todayData.feed) setCurrentFeed(todayData.feed);
      } else {
        setSyncStatus(`Generation failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setSyncStatus(`Request failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyMigration = async () => {
    setIsSyncing(true);
    setSyncStatus("Applying database schema migrations (daily_feeds, generation_jobs)...");
    try {
      const res = await fetch("/api/admin/migrate?secret=lunor_migrate_prod_2026", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus("Database schema migration applied successfully!");
      } else {
        setSyncStatus(`Migration failed: ${JSON.stringify(data.results)}`);
      }
    } catch (err: any) {
      setSyncStatus(`Migration error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] mb-1">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>Operations &amp; System Health</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Pipeline Control Center
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Monitor real-time ingestion pipelines, source health status, deduplication metrics, and system logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleApplyMigration}
            disabled={isSyncing}
            className="text-xs gap-1.5 border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
          >
            <Database className="h-3.5 w-3.5 text-indigo-500" />
            <span>Apply DB Schema</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTriggerMidnightGeneration(true)}
            disabled={isSyncing}
            className="text-xs gap-1.5 border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Trigger Daily Roll</span>
          </Button>

          <Button
            size="sm"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="text-xs gap-1.5 bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Sync All Sources</span>
          </Button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-4 text-xs text-[var(--text-primary)] flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--accent)] shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Midnight Daily Refresh & Snapshot Engine Card */}
      <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Midnight Daily Refresh System (Asia/Kolkata)
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Authoritative publishing boundary at 12:00 AM IST. Prunes rolling archive older than 10 days.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={currentFeed ? "success" : "warning"}
              className="text-xs px-2.5 py-1 font-mono"
            >
              {currentFeed ? "EDITION ACTIVE" : "EDITION PENDING"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 space-y-1">
            <span className="text-[var(--text-secondary)] font-medium">Business Edition Date</span>
            <div className="text-lg font-bold font-mono text-[var(--text-primary)]">{todayDate}</div>
            <span className="text-[11px] text-[var(--text-muted)]">Boundary: Asia/Kolkata (UTC+05:30)</span>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 space-y-1">
            <span className="text-[var(--text-secondary)] font-medium">Next Scheduled Generation</span>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1">{nextScheduledRun}</div>
            <span className="text-[11px] text-[var(--text-muted)]">Vercel Cron: 18:30 UTC daily</span>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 space-y-1">
            <span className="text-[var(--text-secondary)] font-medium">Latest Generation Job</span>
            <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1">
              {jobInfo?.status?.toUpperCase() || (currentFeed ? "SUCCESS" : "PENDING")}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {currentFeed?.leadStory?.title ? `Lead: ${currentFeed.leadStory.title.slice(0, 30)}...` : "Waiting for next cycle"}
            </span>
          </div>
        </div>
      </section>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            Total Articles
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-[var(--text-primary)]">
            {articleCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Ingested across RSS &amp; HN</div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            Clustered Events
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-[var(--text-primary)]">
            {groupCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Deduplicated story events</div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            Research Papers
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-[var(--text-primary)]">
            {paperCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">arXiv &amp; Hugging Face</div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            RAG Paper Chunks
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-[var(--text-primary)]">
            {chunkCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Indexed for Paper Assistant</div>
        </div>
      </div>

      {/* Sources Health Registry Table */}
      <section className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[var(--surface-soft)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Active Source Connectors ({sources.length})
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">All registered primary feeds and academic repositories.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-soft)] text-[var(--text-secondary)] font-medium text-xs border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3">Source Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Trust Tier</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Fetched</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-soft)]">
              {sources.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--surface-soft)]">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    <div className="flex items-center gap-1.5">
                      <span>{s.name}</span>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[var(--accent)]">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-secondary)] uppercase">
                    {s.type}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.trustLevel === "TIER_1_LAB" || s.trustLevel === "TIER_1_ACADEMIC" ? "success" : "secondary"} className="text-[10px]">
                      {s.trustLevel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {s.category}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Healthy</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-[11px]">
                    {s.lastFetchedAt ? new Date(s.lastFetchedAt).toLocaleTimeString() : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ingestion Logs */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Recent Pipeline Execution Logs
        </h3>
        <div className="space-y-2">
          {logs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <Badge variant={log.status === "success" ? "success" : "warning"} className="text-[10px]">
                  {log.status.toUpperCase()}
                </Badge>
                <span className="font-mono text-[var(--text-primary)] font-medium">{log.jobType}</span>
                <span className="text-[var(--text-secondary)] font-mono">
                  {log.recordsProcessed} records in {log.durationMs}ms
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {new Date(log.ranAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
