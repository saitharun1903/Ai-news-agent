import { Article } from "@/lib/db/types";

export async function fetchHackerNewsAIStories(): Promise<Article[]> {
  try {
    const url = "https://hn.algolia.com/api/v1/search_by_date?query=AI+OR+LLM+OR+DeepSeek+OR+OpenAI+OR+Claude+OR+Reasoning&tags=story&numericFilters=points>15&hitsPerPage=20";
    const res = await fetch(url, {
      headers: { "User-Agent": "ResearchPulse/1.0" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.hits) return [];

    const articles: Article[] = [];

    for (const hit of data.hits) {
      if (!hit.title || !hit.url) continue;

      const title = hit.title.trim();
      const points = hit.points || 0;
      const numComments = hit.num_comments || 0;

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 60);

      articles.push({
        id: `hn_${hit.objectID}`,
        slug: `${slug}-${hit.objectID}`,
        title,
        url: hit.url,
        sourceId: "hackernews-ai",
        sourceName: `Hacker News (${points} pts, ${numComments} comments)`,
        summary: `Active technical community discussion with ${points} points and ${numComments} comments on Hacker News.`,
        publishedAt: hit.created_at || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        category: "OPEN SOURCE",
        importanceScore: Math.min(1.5, 0.8 + points / 300),
        readTimeMinutes: 3,
        author: hit.author || "HN Community",
      });
    }

    return articles;
  } catch (err: any) {
    console.warn("[HN] Fetch failed:", err.message);
    return [];
  }
}
