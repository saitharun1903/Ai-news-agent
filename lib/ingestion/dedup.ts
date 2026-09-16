import { Article, ArticleGroup, ArticleSourceRef } from "@/lib/db/types";

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "by", "for", "with", "about", "against",
  "between", "into", "through", "during", "before", "after", "above", "below",
  "to", "from", "up", "down", "of", "and", "or", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "can",
  "could", "should", "would", "will", "new", "ai", "its", "it", "this", "that",
]);

function getSignificantTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function calculateTokenSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

export function groupArticlesIntoEvents(articles: Article[]): ArticleGroup[] {
  const groups: ArticleGroup[] = [];
  const assigned = new Set<string>();

  // Sort articles by importance and recency first
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const primary = sorted[i];
    if (assigned.has(primary.id)) continue;

    assigned.add(primary.id);
    const primaryTokens = getSignificantTokens(primary.title);

    const clusterMembers: Article[] = [primary];

    for (let j = i + 1; j < sorted.length; j++) {
      const candidate = sorted[j];
      if (assigned.has(candidate.id)) continue;

      const candidateTokens = getSignificantTokens(candidate.title);
      const similarity = calculateTokenSimilarity(primaryTokens, candidateTokens);

      // Check for strong entity overlap (e.g. OpenAI, DeepSeek, Anthropic, Gemma, Claude)
      const hasSharedEntity = Array.from(primaryTokens).some(
        (t) =>
          candidateTokens.has(t) &&
          ["openai", "deepseek", "anthropic", "meta", "google", "gemini", "claude", "mistral", "qwen", "llama", "deepmind"].includes(t)
      );

      if (similarity >= 0.35 || (hasSharedEntity && similarity >= 0.22)) {
        clusterMembers.push(candidate);
        assigned.add(candidate.id);
      }
    }

    // Build source references list
    const sourceRefs: ArticleSourceRef[] = clusterMembers.map((m) => ({
      sourceName: m.sourceName,
      url: m.url,
      title: m.title,
      publishedAt: m.publishedAt,
    }));

    // Deduplicate distinct sources
    const uniqueSources = new Map<string, ArticleSourceRef>();
    for (const ref of sourceRefs) {
      if (!uniqueSources.has(ref.sourceName)) {
        uniqueSources.set(ref.sourceName, ref);
      }
    }

    // Calculate cluster importance score
    let baseScore = primary.importanceScore || 1.0;
    // Boost for multi-source coverage
    const sourceMultiplier = 1 + (uniqueSources.size - 1) * 0.35;
    const finalScore = Number((baseScore * sourceMultiplier).toFixed(2));

    // Formulate concise "Why it matters"
    const whyItMatters = generateWhyItMattersForCluster(primary, uniqueSources.size);

    groups.push({
      id: `grp_${primary.id.replace("art_", "")}`,
      title: cleanHeadline(primary.title),
      summary: primary.summary,
      whyItMatters,
      topic: primary.category,
      importanceScore: finalScore,
      articleCount: clusterMembers.length,
      sources: Array.from(uniqueSources.values()),
      publishedAt: primary.publishedAt,
      createdAt: new Date().toISOString(),
    });
  }

  // Sort groups by importance score
  return groups.sort((a, b) => b.importanceScore - a.importanceScore);
}

function cleanHeadline(title: string): string {
  return title
    .replace(/\s*-\s*(TechCrunch|The Verge|Ars Technica|VentureBeat|OpenAI|DeepMind)$/i, "")
    .trim();
}

function generateWhyItMattersForCluster(primary: Article, sourceCount: number): string {
  const t = primary.title.toLowerCase();
  const coverageNotice = sourceCount > 1 ? ` Covered by ${sourceCount} independent outlets.` : "";

  if (t.includes("release") || t.includes("launch") || t.includes("model")) {
    return `Signals a key capability or distribution milestone with immediate tooling and benchmark implications.${coverageNotice}`;
  }
  if (t.includes("agent") || t.includes("workflow")) {
    return `Expands autonomous agent capability boundaries and reliability in non-deterministic environments.${coverageNotice}`;
  }
  if (t.includes("open-source") || t.includes("weights")) {
    return `Enables local self-hosted experimentation, private weights deployment, and research reproducibility.${coverageNotice}`;
  }
  if (t.includes("inference") || t.includes("chip") || t.includes("gpu")) {
    return `Improves serving economics and token generation throughput for enterprise AI infrastructure.${coverageNotice}`;
  }

  return `Represents a noteworthy shift in the AI landscape with direct relevance to practitioners and engineers.${coverageNotice}`;
}
