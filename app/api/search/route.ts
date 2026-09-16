import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { checkRateLimit } from "@/lib/redis/ratelimit";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";
import { getEffectiveUserId } from "@/lib/supabase/server";

const INTENT_MAPPINGS: Record<string, string[]> = {
  inference: ["quantization", "speculative", "kv cache", "vllm", "throughput", "pruning", "distillation"],
  cheaper: ["inference", "quantization", "compression", "distillation", "efficiency", "low-rank"],
  faster: ["latency", "throughput", "speculative decoding", "flashattention", "acceleration"],
  agent: ["tool use", "multi-agent", "orchestration", "autonomous", "workflow", "planning"],
  rag: ["retrieval", "vector", "dense search", "embeddings", "knowledge base"],
  reasoning: ["chain of thought", "reflection", "test-time compute", "verification", "step-by-step"],
  vision: ["multimodal", "vlm", "diffusion", "image", "video generation"],
  robot: ["embodied", "manipulation", "control", "vla", "policy"],
};

export async function GET(req: NextRequest) {
  const userId = await getEffectiveUserId();
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";
  const identifier = userId !== "user_primary" ? userId : ip;

  // Rate limit: 60 req/min
  const rl = await checkRateLimit(identifier, "search");
  if (!rl.success) {
    const limitedRes = NextResponse.json(
      {
        error: "Search rate limit reached. Please wait a moment.",
        retryAfterSeconds: rl.reset,
      },
      { status: 429 }
    );
    limitedRes.headers.set("X-RateLimit-Limit", String(rl.limit));
    limitedRes.headers.set("X-RateLimit-Remaining", "0");
    limitedRes.headers.set("X-RateLimit-Reset", String(rl.reset));
    limitedRes.headers.set("Retry-After", String(rl.reset));
    return limitedRes;
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type") || "all";

  if (!q) {
    const emptyRes = NextResponse.json({
      papers: [],
      articleGroups: [],
      projects: [],
      topics: [],
      authors: [],
    });
    emptyRes.headers.set("X-RateLimit-Limit", String(rl.limit));
    emptyRes.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    emptyRes.headers.set("X-RateLimit-Reset", String(rl.reset));
    return emptyRes;
  }

  // Check Upstash Redis cache (10 min TTL)
  const cacheKey = CacheKeys.search(`${q}_${type}`);
  const cachedData = await cacheGet<any>(cacheKey);
  if (cachedData) {
    const cachedRes = NextResponse.json(cachedData);
    cachedRes.headers.set("X-Cache", "HIT");
    cachedRes.headers.set("X-RateLimit-Limit", String(rl.limit));
    cachedRes.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    cachedRes.headers.set("X-RateLimit-Reset", String(rl.reset));
    return cachedRes;
  }

  const queryLower = q.toLowerCase();
  const tokens = queryLower.split(/\s+/).filter((t) => t.length > 2);

  // Expand semantic query tokens
  const expandedTerms = new Set<string>(tokens);
  for (const token of tokens) {
    for (const [key, related] of Object.entries(INTENT_MAPPINGS)) {
      if (token.includes(key) || key.includes(token)) {
        for (const r of related) expandedTerms.add(r);
      }
    }
  }
  const termList = Array.from(expandedTerms);

  // 1. Papers
  let papers: any[] = [];
  const allPapers = await db.getPapers();
  papers = allPapers
    .map((p) => {
      let score = 0;
      const text = `${p.title} ${p.abstract} ${p.primaryCategory} ${p.authors.join(" ")}`.toLowerCase();
      for (const term of termList) {
        if (text.includes(term)) {
          score += queryLower.includes(term) ? 5 : 2;
        }
      }
      return { paper: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item) => item.paper);

  // 2. News (Article Groups)
  let articleGroups: any[] = [];
  const allGroups = await db.getArticleGroups();
  articleGroups = allGroups
    .map((g) => {
      let score = 0;
      const text = `${g.title} ${g.summary} ${g.topic}`.toLowerCase();
      for (const term of termList) {
        if (text.includes(term)) {
          score += queryLower.includes(term) ? 4 : 2;
        }
      }
      return { group: g, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item) => item.group);

  // 3. Projects (Papers with verified GitHub code repositories)
  const projects = allPapers
    .filter((p) => p.githubUrl)
    .filter((p) => {
      const matchText = `${p.title} ${p.githubUrl} ${p.primaryCategory}`.toLowerCase();
      return termList.some((term) => matchText.includes(term));
    })
    .map((p) => {
      const repoPath = p.githubUrl?.replace("https://github.com/", "") || "";
      return {
        id: `proj_${p.id}`,
        title: repoPath.split("/")[1] || p.title,
        repo: repoPath,
        url: p.githubUrl!,
        description: p.whyItMatters || p.title,
        paperId: p.id,
        upvotes: p.upvotes,
      };
    })
    .slice(0, 6);

  // 4. Topics
  const topics = siteConfig.topics.filter(
    (t) =>
      t.name.toLowerCase().includes(queryLower) ||
      t.description.toLowerCase().includes(queryLower) ||
      termList.some((term) => t.description.toLowerCase().includes(term))
  );

  // 5. Authors & Research Labs
  const authorMap = new Map<string, { name: string; paperCount: number; latestPaper: string }>();
  for (const p of allPapers) {
    for (const author of p.authors) {
      if (
        author.toLowerCase().includes(queryLower) ||
        termList.some((term) => author.toLowerCase().includes(term))
      ) {
        const existing = authorMap.get(author) || { name: author, paperCount: 0, latestPaper: p.title };
        existing.paperCount++;
        authorMap.set(author, existing);
      }
    }
  }
  const authors = Array.from(authorMap.values()).slice(0, 6);

  const payload = {
    query: q,
    expandedTerms: termList,
    papers,
    articleGroups,
    projects,
    topics,
    authors,
  };

  // Cache in Upstash Redis (10 minutes)
  await cacheSet(cacheKey, payload, 600);

  const response = NextResponse.json(payload);
  response.headers.set("X-Cache", "MISS");
  response.headers.set("X-RateLimit-Limit", String(rl.limit));
  response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  response.headers.set("X-RateLimit-Reset", String(rl.reset));
  return response;
}
