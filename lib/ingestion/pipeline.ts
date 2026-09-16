import { db } from "@/lib/db";
import { ai } from "@/lib/ai";
import { fetchRssSource } from "./rss-fetcher";
import {
  fetchArxivPapers,
  fetchArxivFoundationalPapers,
  fetchArxivByDomain,
  BROAD_COMPUTING_QUERY,
} from "./arxiv-fetcher";
import { fetchHuggingFacePapers } from "./huggingface-fetcher";
import { hackerNewsProvider } from "./providers/hackernews";
import { newsApiProvider } from "./providers/newsapi";
import { openAlexProvider } from "./providers/openalex";
import { fetchSemanticScholarPapers } from "./providers/semanticscholar";
import { fetchCrossrefPapers } from "./providers/crossref";
import { fetchGithubRepoMetadata } from "./providers/github";
import { groupArticlesIntoEvents } from "./dedup";
import { evaluateAndEnrichPaper } from "./paper-evaluator";
import { Article, DailyBriefing, DailyFeedSnapshot, Paper, PaperChunk } from "@/lib/db/types";

export interface PipelineResult {
  articlesCount: number;
  articleGroupsCount: number;
  papersCount: number;
  durationMs: number;
  errors: string[];
}

export async function runIngestionPipeline(): Promise<PipelineResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log("[Pipeline] Starting multi-source live ingestion...");
  const sources = await db.getSources();

  // 1. Fetch RSS feeds from verified research labs & tech press
  const fetchedArticles: Article[] = [];
  for (const source of sources.filter((s) => s.enabled && (s.type === "rss" || s.type === "lab"))) {
    try {
      const articles = await fetchRssSource(source);
      fetchedArticles.push(...articles);
      await db.updateSource(source.id, {
        lastFetchedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      errors.push(`Source ${source.name}: ${err.message}`);
    }
  }

  // 2. Fetch Hacker News technical stories & discussions
  try {
    const hnArticles = await hackerNewsProvider.fetchLatest({ limit: 15 });
    fetchedArticles.push(...hnArticles);
  } catch (err: any) {
    errors.push(`HackerNews: ${err.message}`);
  }

  // 3. Fetch NewsAPI curated tech news (if enabled & key configured)
  try {
    if (newsApiProvider.enabled) {
      const newsApiArticles = await newsApiProvider.fetchLatest({ limit: 10 });
      fetchedArticles.push(...newsApiArticles);
    }
  } catch (err: any) {
    errors.push(`NewsAPI: ${err.message}`);
  }

  // 4. Save raw articles & cluster into deduplicated event groups
  if (fetchedArticles.length > 0) {
    await db.saveArticles(fetchedArticles);
    const groups = groupArticlesIntoEvents(fetchedArticles);
    await db.saveArticleGroups(groups);
  }

  // 5. Fetch Research Papers across multiple open providers (broad computing ecosystem)
  const enrichedPapers: Paper[] = [];
  const allChunks: PaperChunk[] = [];

  // 5a. arXiv Broad Computing (Systems, Software Engineering, Languages, Databases, Security, AI, Algorithms)
  try {
    const arxivPapers = await fetchArxivPapers(15, BROAD_COMPUTING_QUERY);
    for (const raw of arxivPapers) {
      const { paper, chunks } = evaluateAndEnrichPaper(raw);
      enrichedPapers.push(paper);
      allChunks.push(...chunks);
    }
  } catch (err: any) {
    errors.push(`arXiv Broad: ${err.message}`);
  }

  // 5b. arXiv Domain Specific: Systems, Software Engineering, Security, Compilers
  try {
    const systemsPapers = await fetchArxivByDomain("systems", 4);
    for (const raw of systemsPapers) {
      const { paper, chunks } = evaluateAndEnrichPaper(raw);
      enrichedPapers.push(paper);
      allChunks.push(...chunks);
    }
  } catch (err: any) {
    errors.push(`arXiv Systems: ${err.message}`);
  }

  try {
    const sePapers = await fetchArxivByDomain("software", 4);
    for (const raw of sePapers) {
      const { paper, chunks } = evaluateAndEnrichPaper(raw);
      enrichedPapers.push(paper);
      allChunks.push(...chunks);
    }
  } catch (err: any) {
    errors.push(`arXiv SE: ${err.message}`);
  }

  try {
    const secPapers = await fetchArxivByDomain("security", 4);
    for (const raw of secPapers) {
      const { paper, chunks } = evaluateAndEnrichPaper(raw);
      enrichedPapers.push(paper);
      allChunks.push(...chunks);
    }
  } catch (err: any) {
    errors.push(`arXiv Security: ${err.message}`);
  }

  // 5c. OpenAlex Research Provider (broad academic works graph)
  try {
    const oaPapers = await openAlexProvider.fetchLatest({ limit: 8 });
    enrichedPapers.push(...oaPapers);
  } catch (err: any) {
    errors.push(`OpenAlex: ${err.message}`);
  }

  // 5d. Semantic Scholar API (citations, academic graph, preprints)
  try {
    const s2Papers = await fetchSemanticScholarPapers(
      "distributed systems software engineering compiler database security",
      8
    );
    for (const raw of s2Papers) {
      const { paper, chunks } = evaluateAndEnrichPaper({
        title: raw.title,
        abstract: raw.abstract,
        authors: raw.authors,
        publishedAt: raw.publishedAt,
        semanticScholarId: raw.semanticScholarId,
        doi: raw.doi,
        arxivId: raw.arxivId,
        citationCount: raw.citationCount,
        pdfUrl: raw.pdfUrl,
        categories: raw.fieldsOfStudy,
      });
      enrichedPapers.push(paper);
      allChunks.push(...chunks);
    }
  } catch (err: any) {
    errors.push(`SemanticScholar: ${err.message}`);
  }

  // 5e. Crossref API (peer-reviewed journals & conference proceedings)
  try {
    const crossrefPapers = await fetchCrossrefPapers(
      "software engineering distributed systems computer science database",
      6
    );
    for (const raw of crossrefPapers) {
      const { paper, chunks } = evaluateAndEnrichPaper({
        title: raw.title,
        abstract: raw.abstract,
        authors: raw.authors,
        publishedAt: raw.publishedAt,
        doi: raw.doi,
        doiUrl: raw.doiUrl,
        citationCount: raw.citationCount,
        pdfUrl: raw.pdfUrl,
      });
      enrichedPapers.push(paper);
      allChunks.push(...chunks);
    }
  } catch (err: any) {
    errors.push(`Crossref: ${err.message}`);
  }

  // 5f. Hugging Face Daily Papers (community momentum & trending)
  try {
    const hfPapers = await fetchHuggingFacePapers();
    for (const raw of hfPapers) {
      const { paper, chunks } = evaluateAndEnrichPaper(raw);
      enrichedPapers.push(paper);
      allChunks.push(...chunks);
    }
  } catch (err: any) {
    errors.push(`HuggingFace: ${err.message}`);
  }

  // 5g. Foundational classic papers
  try {
    const foundationalArxiv = await fetchArxivFoundationalPapers();
    for (const raw of foundationalArxiv) {
      const { paper, chunks } = evaluateAndEnrichPaper(raw);
      paper.discoveryCategory = "foundational";
      enrichedPapers.push(paper);
      allChunks.push(...chunks);
    }
  } catch (err: any) {
    errors.push(`arXiv Foundational: ${err.message}`);
  }

  // 5h. Enrich GitHub telemetry for papers with code repositories
  for (const paper of enrichedPapers.slice(0, 12)) {
    if (paper.githubUrl) {
      try {
        const repoMeta = await fetchGithubRepoMetadata(paper.githubUrl);
        if (repoMeta) {
          paper.upvotes = Math.max(paper.upvotes, repoMeta.stars);
        }
      } catch {
        // silent fallback
      }
    }
  }

  // Deduplicate and save all enriched papers into canonical database
  if (enrichedPapers.length > 0) {
    await db.savePapers(enrichedPapers);
    await db.savePaperChunks(allChunks);
  }

  // 6. Generate / update Today's Briefing from stored content
  try {
    await generateDailyBriefing();
  } catch (err: any) {
    errors.push(`DailyBriefing: ${err.message}`);
  }

  // 7. Generate / update Today's Daily Feed Snapshot (with 30-day new-item suppression)
  try {
    await generateDailyFeedSnapshot();
  } catch (err: any) {
    errors.push(`DailyFeedSnapshot: ${err.message}`);
  }

  // 8. Prune snapshots older than 10 days (user favorites & reading history remain permanent)
  try {
    await db.cleanDailyHistoryOlderThan(10);
  } catch (err: any) {
    errors.push(`SnapshotPruning: ${err.message}`);
  }

  const durationMs = Date.now() - startTime;
  const groups = await db.getArticleGroups();

  await db.logIngestion({
    jobType: "FULL_SYNC",
    status: errors.length > 0 ? "partial" : "success",
    recordsProcessed: fetchedArticles.length + enrichedPapers.length,
    durationMs,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  });

  console.log(
    `[Pipeline] Finished in ${durationMs}ms: ${fetchedArticles.length} articles, ${enrichedPapers.length} papers processed.`
  );

  return {
    articlesCount: fetchedArticles.length,
    articleGroupsCount: groups.length,
    papersCount: enrichedPapers.length,
    durationMs,
    errors,
  };
}

export async function generateDailyBriefing(): Promise<DailyBriefing> {
  const todayStr = new Date().toISOString().split("T")[0];
  const existing = await db.getDailyBriefing(todayStr);
  if (existing) return existing;

  const topStories = await db.getArticleGroups({ limit: 8 });
  const allPapers = await db.getPapers({ limit: 30 });
  const suppressedNew = await db.getNeverShownAsNewPapers(allPapers, 30);
  const topPapers = suppressedNew.length >= 4 ? suppressedNew.slice(0, 4) : allPapers.slice(0, 4);
  const paperOfDay = await db.getPaperOfDay();

  const synthesis = await ai.generateDailySynthesis(topStories, topPapers);

  const briefing: DailyBriefing = {
    id: `briefing_${todayStr}`,
    date: todayStr,
    title: `Today's Briefing — ${formatDateHeader(new Date())}`,
    summary: `${topStories.length} curated stories and ${topPapers.length} key research papers worth reading today.`,
    synthesis,
    topStories,
    recommendedPapers: topPapers,
    paperOfDay,
    publishedAt: new Date().toISOString(),
  };

  await db.saveDailyBriefing(briefing);
  return briefing;
}

export async function generateDailyFeedSnapshot(): Promise<DailyFeedSnapshot> {
  const todayStr = new Date().toISOString().split("T")[0];
  const leadStory = await db.getLeadStory();
  const topStories = await db.getArticleGroups({ limit: 8 });
  
  // Select candidate papers with 30-day new-item suppression
  const allCandidatePapers = await db.getPapers({ limit: 50 });
  const freshNewPapers = await db.getNeverShownAsNewPapers(allCandidatePapers, 30);

  // Apply diversity selection across computing domains
  const selectedPapers: Paper[] = [];
  const seenDomains = new Set<string>();

  for (const p of freshNewPapers) {
    if (selectedPapers.length >= 6) break;
    const cat = p.primaryCategory;
    if (!seenDomains.has(cat) || selectedPapers.length >= 4) {
      seenDomains.add(cat);
      selectedPapers.push(p);
    }
  }

  // If strict fresh papers are fewer than 4, fill with top papers from allCandidatePapers
  if (selectedPapers.length < 4) {
    for (const p of allCandidatePapers) {
      if (selectedPapers.length >= 6) break;
      if (!selectedPapers.some((sp) => sp.id === p.id)) {
        selectedPapers.push(p);
      }
    }
  }

  const paperOfDay = await db.getPaperOfDay();
  const profile = await db.getUserProfile();

  const synthesis = await ai.generateDailySynthesis(topStories, selectedPapers);

  // Group topic counts
  const topicMap = new Map<string, number>();
  for (const s of topStories) {
    topicMap.set(s.topic, (topicMap.get(s.topic) || 0) + 1);
  }
  for (const p of selectedPapers) {
    topicMap.set(p.primaryCategory, (topicMap.get(p.primaryCategory) || 0) + 1);
  }

  const topicCounts = Array.from(topicMap.entries()).map(([topic, count]) => ({
    topic,
    count,
  }));

  const snapshot: DailyFeedSnapshot = {
    id: `feed_${todayStr}`,
    date: todayStr,
    timezone: profile.timezone || "Asia/Kolkata",
    generatedAt: new Date().toISOString(),
    status: "active",
    title: `Today · ${formatDateHeader(new Date())}`,
    summary: `${topStories.length} developments and ${selectedPapers.length} research papers curated today.`,
    synthesis,
    leadStory,
    stories: topStories,
    papers: selectedPapers,
    paperOfDay,
    topicCounts,
  };

  await db.createOrUpdateDailyFeed(snapshot);
  return snapshot;
}

function formatDateHeader(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
