import React from "react";
import { db } from "@/lib/db";
import { TodayBriefingView, QuickTopicItem } from "@/components/today/today-briefing-view";

export const revalidate = 60; // 1-minute freshness revalidation

export default async function TodayPage() {
  // 1. Fetch concise daily records concurrently with Promise.all
  const [articleGroups, allPapers, paperOfDay, ingestionLogs] = await Promise.all([
    db.getArticleGroups({ limit: 6 }),
    db.getPapers({ limit: 8 }),
    db.getPaperOfDay(),
    db.getIngestionLogs(),
  ]);

  // 2. Compute dynamic recency text
  const lastLog = ingestionLogs[0];
  let lastUpdatedText = "Updated 4m ago";
  if (lastLog?.ranAt) {
    const diffMs = Date.now() - new Date(lastLog.ranAt).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    if (diffMins < 60) {
      lastUpdatedText = `Updated ${diffMins}m ago`;
    } else {
      const hrs = Math.floor(diffMins / 60);
      lastUpdatedText = `Updated ${hrs}h ago`;
    }
  }

  const dateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // 3. Lead Story + 3-4 Supporting Stories
  const leadStory = articleGroups[0] || null;
  const supportingStories = articleGroups.slice(1, 5);

  // 4. Exactly 2-4 Recommended Research Papers
  const papersPool = paperOfDay
    ? [paperOfDay, ...allPapers.filter((p) => p.id !== paperOfDay.id)]
    : allPapers;
  const recommendedPapers = papersPool.slice(0, 4);

  // 5. Quick Topics (3-5 primary computing areas)
  const quickTopics: QuickTopicItem[] = [
    { name: "Agents", slug: "agents" },
    { name: "Systems", slug: "systems" },
    { name: "Security", slug: "security" },
    { name: "Software Engineering", slug: "softwareengineering" },
    { name: "Databases", slug: "databases" },
  ];

  if (!leadStory) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Preparing Today&apos;s Briefing</h2>
        <p className="text-sm text-[var(--text-secondary)]">Connecting to real-time research and news providers...</p>
      </div>
    );
  }

  return (
    <TodayBriefingView
      leadStory={leadStory}
      supportingStories={supportingStories}
      recommendedPapers={recommendedPapers}
      quickTopics={quickTopics}
      lastUpdatedText={lastUpdatedText}
      dateFormatted={dateFormatted}
    />
  );
}
