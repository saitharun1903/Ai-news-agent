import { db } from "@/lib/db";
import { ai } from "@/lib/ai";
import { runIngestionPipeline } from "@/lib/ingestion/pipeline";
import { cacheDel, CacheKeys } from "@/lib/redis";
import {
  getLunorBusinessDate,
  formatLunorDate,
  LUNOR_DEFAULT_TIMEZONE,
} from "@/lib/date";
import {
  createGenerationJobInDb,
  updateGenerationJobInDb,
} from "@/lib/db/supabase-adapter";
import { DailyFeedSnapshot, Paper, ArticleGroup } from "@/lib/db/types";

export interface GenerateDailyEditionOptions {
  editionDate?: string;
  force?: boolean;
  timezone?: string;
  maxRetries?: number;
}

export interface GenerateDailyEditionResult {
  success: boolean;
  editionDate: string;
  timezone: string;
  snapshotId?: string;
  feed?: DailyFeedSnapshot;
  alreadyGenerated?: boolean;
  durationMs: number;
  attempts: number;
  error?: string;
}

/**
 * Idempotent Daily Edition Generator for Lunor.
 * Strictly operates on the Asia/Kolkata (IST, UTC+05:30) business date boundary.
 *
 * Steps:
 * 1. Resolve business date in target timezone.
 * 2. Check if active edition already exists (idempotency guard).
 * 3. Audit log start in `generation_jobs`.
 * 4. Run ingestion pipeline to fetch and cluster latest articles and papers.
 * 5. Rank and select 1 Lead Story + 4 diverse Supporting Stories.
 * 6. Rank and select 1 Paper of the Day + 4 Recommended Papers (with 30-day suppression for new items).
 * 7. Generate daily executive synthesis via AI provider.
 * 8. Build and persist DailyFeedSnapshot in `daily_feeds` (and local JSON store).
 * 9. Mark past editions as archived.
 * 10. Prune history older than 10 days.
 * 11. Invalidate Redis caches.
 * 12. Update `generation_jobs` audit log with success/failure and execution metrics.
 */
export async function generateDailyEdition(
  options?: GenerateDailyEditionOptions
): Promise<GenerateDailyEditionResult> {
  const startTime = Date.now();
  const timezone = options?.timezone || LUNOR_DEFAULT_TIMEZONE;
  const editionDate =
    options?.editionDate || getLunorBusinessDate(new Date(), timezone);
  const force = !!options?.force;
  const maxRetries = options?.maxRetries ?? 3;

  console.log(
    `[DailyGenerator] Initializing daily generation for ${editionDate} (${timezone}), force=${force}...`
  );

  // 1. Idempotency Check: if snapshot exists and not forcing, return immediately
  const existing = await db.getDailyFeed(editionDate, timezone);
  if (existing && !force) {
    console.log(
      `[DailyGenerator] Edition for ${editionDate} already exists with status '${existing.status}'. Exiting early.`
    );
    return {
      success: true,
      editionDate,
      timezone,
      snapshotId: existing.id,
      feed: existing,
      alreadyGenerated: true,
      durationMs: Date.now() - startTime,
      attempts: 0,
    };
  }

  const jobId = `daily_job_${editionDate}_${Date.now()}`;
  await createGenerationJobInDb({
    id: jobId,
    jobName: "daily_edition",
    editionDate,
    status: "running",
    attempt: 1,
  }).catch((err) => {
    console.warn(`[DailyGenerator] Failed to create job log in DB: ${err.message}`);
  });

  let lastError: Error | null = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;
    console.log(`[DailyGenerator] Generation attempt ${attempt}/${maxRetries} for ${editionDate}...`);

    try {
      // Step A: Ingest fresh real-time content across all registered providers
      let pipelineResult = { articlesCount: 0, papersCount: 0 };
      try {
        pipelineResult = await runIngestionPipeline();
      } catch (pipeErr: any) {
        console.warn(`[DailyGenerator] Ingestion pipeline warning (continuing with existing database candidates):`, pipeErr.message);
      }

      // Step B: Retrieve candidate article groups and papers
      const candidateGroups = await db.getArticleGroups({ limit: 16 });
      const candidatePapers = await db.getPapers({ limit: 50 });
      const explicitPaperOfDay = await db.getPaperOfDay();

      if (candidateGroups.length === 0 && candidatePapers.length === 0) {
        throw new Error("No candidate articles or papers found in database to synthesize daily edition.");
      }

      // Step C: Select 1 Lead Story + 4 Diverse Supporting Stories
      const leadStory: ArticleGroup | null = candidateGroups[0] || null;

      // Ensure diverse topics across supporting stories (Agents, Systems, Security, Software Engineering, Databases, etc.)
      const supportingStories: ArticleGroup[] = [];
      const seenTopics = new Set<string>();
      if (leadStory?.topic) {
        seenTopics.add(leadStory.topic.toLowerCase());
      }

      // First pass: distinct topics
      for (const group of candidateGroups.slice(1)) {
        if (supportingStories.length >= 4) break;
        const topicKey = (group.topic || "general").toLowerCase();
        if (!seenTopics.has(topicKey)) {
          seenTopics.add(topicKey);
          supportingStories.push(group);
        }
      }

      // Second pass: fill remaining slots up to 4 if needed
      if (supportingStories.length < 4) {
        for (const group of candidateGroups.slice(1)) {
          if (supportingStories.length >= 4) break;
          if (!supportingStories.some((s) => s.id === group.id)) {
            supportingStories.push(group);
          }
        }
      }

      // Step D: Select 1 Paper of the Day + 4 Recommended Papers (with 30-day suppression for new items)
      const freshNewPapers = await db.getNeverShownAsNewPapers(candidatePapers, 30);
      const papersPool = freshNewPapers.length >= 5 ? freshNewPapers : candidatePapers;

      const paperOfDay: Paper | null =
        explicitPaperOfDay ||
        papersPool.find((p) => p.isPaperOfDay) ||
        papersPool[0] ||
        null;

      const recommendedPapers: Paper[] = [];
      const seenPaperDomains = new Set<string>();
      if (paperOfDay?.primaryCategory) {
        seenPaperDomains.add(paperOfDay.primaryCategory.toLowerCase());
      }

      for (const paper of papersPool) {
        if (recommendedPapers.length >= 4) break;
        if (paperOfDay && paper.id === paperOfDay.id) continue;

        const cat = (paper.primaryCategory || "computing").toLowerCase();
        if (!seenPaperDomains.has(cat) || recommendedPapers.length >= 2) {
          seenPaperDomains.add(cat);
          recommendedPapers.push(paper);
        }
      }

      // Backfill up to 4 if diversity pass had fewer
      if (recommendedPapers.length < 4) {
        for (const paper of candidatePapers) {
          if (recommendedPapers.length >= 4) break;
          if (paperOfDay && paper.id === paperOfDay.id) continue;
          if (!recommendedPapers.some((rp) => rp.id === paper.id)) {
            recommendedPapers.push(paper);
          }
        }
      }

      // Step E: Compute Topic Counts
      const topicMap = new Map<string, number>();
      if (leadStory?.topic) {
        topicMap.set(leadStory.topic, (topicMap.get(leadStory.topic) || 0) + 1);
      }
      for (const story of supportingStories) {
        if (story.topic) {
          topicMap.set(story.topic, (topicMap.get(story.topic) || 0) + 1);
        }
      }
      for (const paper of [paperOfDay, ...recommendedPapers].filter(Boolean) as Paper[]) {
        if (paper.primaryCategory) {
          topicMap.set(paper.primaryCategory, (topicMap.get(paper.primaryCategory) || 0) + 1);
        }
      }
      const topicCounts = Array.from(topicMap.entries()).map(([topic, count]) => ({
        topic,
        count,
      }));

      // Step F: Generate Daily Synthesis via AI
      const synthesisStories = leadStory ? [leadStory, ...supportingStories] : supportingStories;
      const synthesisPapers = [paperOfDay, ...recommendedPapers].filter(Boolean) as Paper[];

      let synthesis = "";
      try {
        synthesis = await ai.generateDailySynthesis(synthesisStories, synthesisPapers);
      } catch (aiErr: any) {
        console.warn(`[DailyGenerator] AI synthesis fallback triggered: ${aiErr.message}`);
        synthesis = `Daily Intelligence Synthesis for ${formatLunorDate(editionDate, timezone)}. ` +
          `Key highlights include major advancements in ${leadStory?.topic || "frontier computing systems"}, ` +
          `autonomous agents, and high-performance inference.`;
      }

      // Step G: Assemble Immutable Daily Snapshot
      const readableDate = formatLunorDate(editionDate, timezone);
      const snapshot: DailyFeedSnapshot = {
        id: `feed_${editionDate}`,
        date: editionDate,
        timezone,
        generatedAt: new Date().toISOString(),
        status: "active",
        title: `Lunor Daily Intelligence — ${readableDate}`,
        summary: `${synthesisStories.length} essential developments and ${synthesisPapers.length} evaluated research papers curated for ${readableDate}.`,
        synthesis,
        leadStory,
        stories: supportingStories,
        papers: recommendedPapers,
        paperOfDay,
        topicCounts,
      };

      // Step H: Persist to Daily Feeds Snapshot repository
      await db.createOrUpdateDailyFeed(snapshot);

      // Step I: Prune Snapshots older than 10 days
      await db.cleanDailyHistoryOlderThan(10).catch(() => 0);

      // Step J: Invalidate Redis Caches
      await Promise.allSettled([
        cacheDel(CacheKeys.dailyBriefing(editionDate)),
        cacheDel(`today:${editionDate}`),
        cacheDel(CacheKeys.newsHome()),
        cacheDel(CacheKeys.newsTrending()),
        cacheDel(CacheKeys.researchTrending()),
      ]);

      // Step K: Log Generation Job Success
      await updateGenerationJobInDb(jobId, {
        status: "success",
        completedAt: new Date().toISOString(),
        recordsFetched: pipelineResult.articlesCount + pipelineResult.papersCount,
        recordsInserted: synthesisStories.length + synthesisPapers.length,
      }).catch(() => {});

      const durationMs = Date.now() - startTime;
      console.log(
        `[DailyGenerator] Successfully generated daily edition for ${editionDate} in ${durationMs}ms.`
      );

      return {
        success: true,
        editionDate,
        timezone,
        snapshotId: snapshot.id,
        feed: snapshot,
        alreadyGenerated: false,
        durationMs,
        attempts,
      };
    } catch (err: any) {
      lastError = err;
      console.error(`[DailyGenerator] Attempt ${attempt} failed: ${err.message}`);

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`[DailyGenerator] Backing off for ${backoffMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  // If all attempts failed:
  const durationMs = Date.now() - startTime;
  const failureMessage = lastError?.message || "All generation attempts exhausted";

  await updateGenerationJobInDb(jobId, {
    status: "failed",
    completedAt: new Date().toISOString(),
    errorMessage: failureMessage,
  }).catch(() => {});

  return {
    success: false,
    editionDate,
    timezone,
    durationMs,
    attempts,
    error: failureMessage,
  };
}
