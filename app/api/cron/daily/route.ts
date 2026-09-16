import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runIngestionPipeline } from "@/lib/ingestion/pipeline";
import { cacheDel, CacheKeys } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Authorization check
  const authHeader = request.headers.get("authorization") || "";
  const querySecret = request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET || "";

  if (cronSecret && cronSecret !== "[SENSITIVE]") {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret ||
      process.env.NODE_ENV === "development";

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }
  }

  try {
    const profile = await db.getUserProfile();
    const userTimezone = profile.timezone || "Asia/Kolkata";

    // Format current date in user's timezone dynamically
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: userTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = formatter.format(new Date());

    console.log(`[Cron:Daily] Executing daily refresh pipeline at 12:00 AM for ${todayStr} (${userTimezone})...`);

    // 2. Run live ingestion pipeline
    const pipelineResult = await runIngestionPipeline();

    // 3. Fetch freshly clustered and evaluated items
    const groups = await db.getArticleGroups({ limit: 8 });
    const papers = await db.getPapers({ limit: 6 });
    const paperOfDay = await db.getPaperOfDay();
    const leadStory = groups[0] || null;

    // 4. Create or update today's immutable snapshot
    const snapshot = await db.createOrUpdateDailyFeed({
      id: `feed_${todayStr}`,
      date: todayStr,
      timezone: userTimezone,
      generatedAt: new Date().toISOString(),
      status: "active",
      title: `Daily Briefing · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      summary: `Daily snapshot containing ${groups.length} developments and ${papers.length} evaluated research papers.`,
      synthesis: `Daily synthesis: key developments in ${leadStory?.topic || "frontier AI"}, autonomous agents, and inference optimization.`,
      leadStory,
      stories: groups,
      papers,
      paperOfDay,
      topicCounts: [
        { topic: "LLMs", count: groups.length },
        { topic: "Agents", count: papers.length },
        { topic: "Reasoning", count: 4 },
        { topic: "Infrastructure", count: 2 },
      ],
    });

    // 5. Prune snapshots older than 10 days
    const prunedCount = await db.cleanDailyHistoryOlderThan(10);

    // 6. Invalidate cached feeds in Upstash Redis
    await Promise.allSettled([
      cacheDel(CacheKeys.dailyBriefing(todayStr)),
      cacheDel(CacheKeys.newsHome()),
      cacheDel(CacheKeys.newsTrending()),
      cacheDel(CacheKeys.researchTrending()),
    ]);

    return NextResponse.json({
      success: true,
      today: todayStr,
      timezone: userTimezone,
      pipeline: pipelineResult,
      snapshotId: snapshot.id,
      prunedSnapshotsCount: prunedCount,
      cacheInvalidated: true,
    });
  } catch (error: any) {
    console.error("[Cron:Daily] Daily refresh failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
