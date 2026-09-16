import React from "react";
import { db } from "@/lib/db";
import { AdminView } from "@/components/admin/admin-view";
import {
  getLunorBusinessDate,
  getNextScheduledGenerationIST,
  LUNOR_DEFAULT_TIMEZONE,
} from "@/lib/date";
import { fetchLatestGenerationJob } from "@/lib/db/supabase-adapter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const timezone = LUNOR_DEFAULT_TIMEZONE;
  const todayDate = getLunorBusinessDate(new Date(), timezone);

  const [sources, logs, articles, groups, papers, todayFeed, latestJob] =
    await Promise.all([
      db.getSources(),
      db.getIngestionLogs(),
      db.getArticles(),
      db.getArticleGroups(),
      db.getPapers(),
      db.getDailyFeed(todayDate, timezone),
      fetchLatestGenerationJob(todayDate).catch(() => null),
    ]);

  const chunkCount = papers.length * 5;
  const nextScheduledRun = getNextScheduledGenerationIST();

  return (
    <AdminView
      initialSources={sources}
      initialLogs={logs}
      articleCount={articles.length}
      groupCount={groups.length}
      paperCount={papers.length}
      chunkCount={chunkCount}
      todayDate={todayDate}
      todayFeed={todayFeed}
      latestJob={latestJob}
      nextScheduledRun={nextScheduledRun}
    />
  );
}
