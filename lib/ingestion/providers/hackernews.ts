import { Article } from "@/lib/db/types";
import { CommunityDiscussion, CommunityProvider, NewsFetchOptions, NewsProvider } from "./types";

export class HackerNewsProvider implements NewsProvider, CommunityProvider {
  name = "Hacker News";
  enabled = process.env.HACKER_NEWS_ENABLED !== "false";

  async fetchLatest(options?: NewsFetchOptions): Promise<Article[]> {
    if (!this.enabled) return [];
    const limit = Math.min(options?.limit || 15, 30);
    const query = options?.query || "software+OR+systems+OR+database+OR+compiler+OR+security+OR+AI";

    try {
      const url = options?.query
        ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(options.query)}&tags=story&hitsPerPage=${limit}`
        : `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`;

      const res = await fetch(url, {
        headers: { "User-Agent": "Lunor/1.0 (+https://lunor.co.in)" },
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data.hits)) return [];

      const articles: Article[] = [];
      for (const hit of data.hits) {
        if (!hit.title || !hit.url) continue;

        const title = hit.title.trim();
        const points = hit.points || 0;
        const numComments = hit.num_comments || 0;
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
          .slice(0, 60);

        articles.push({
          id: `hn_${hit.objectID}`,
          slug: `${slug}-${hit.objectID}`,
          title,
          canonicalTitle: title,
          url: hit.url,
          sourceUrl: hit.url,
          sourceId: "hackernews",
          sourceName: "Hacker News",
          summary: `Technical discussion with ${points} points and ${numComments} comments on Hacker News.`,
          publishedAt: hit.created_at || new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          category: options?.category || "COMMUNITY",
          topics: ["Community Signal", "Engineering"],
          entities: [],
          importanceScore: Math.min(100, Math.round(50 + points / 5)),
          readTimeMinutes: 3,
          author: hit.author || "HN Community",
          createdAt: new Date().toISOString(),
        });
      }

      return articles;
    } catch (err: any) {
      console.warn("[HackerNews] Fetch failed:", err.message);
      return [];
    }
  }

  async search(query: string): Promise<Article[]> {
    return this.fetchLatest({ query, limit: 12 });
  }

  async getArticle(id: string): Promise<Article | null> {
    const rawId = id.replace(/^hn_/, "");
    try {
      const res = await fetch(`https://hn.algolia.com/api/v1/items/${rawId}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;
      const hit = await res.json();
      if (!hit.title) return null;

      return {
        id: `hn_${hit.id}`,
        slug: `hn-${hit.id}`,
        title: hit.title,
        canonicalTitle: hit.title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.id}`,
        sourceUrl: hit.url || `https://news.ycombinator.com/item?id=${hit.id}`,
        sourceId: "hackernews",
        sourceName: "Hacker News",
        summary: `Community discussion with ${hit.points || 0} points on Hacker News.`,
        publishedAt: hit.created_at || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        category: "COMMUNITY",
        importanceScore: Math.min(100, 50 + (hit.points || 0)),
        readTimeMinutes: 3,
        author: hit.author,
      };
    } catch {
      return null;
    }
  }

  async fetchDiscussions(topicOrUrl: string, limit: number = 5): Promise<CommunityDiscussion[]> {
    try {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
        topicOrUrl
      )}&tags=story&hitsPerPage=${limit}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data.hits)) return [];

      return data.hits.map((h: any) => ({
        id: `hn_disc_${h.objectID}`,
        platform: "hackernews",
        title: h.title,
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        commentCount: h.num_comments || 0,
        score: h.points || 0,
        publishedAt: h.created_at,
        author: h.author,
      }));
    } catch {
      return [];
    }
  }

  async getDiscussion(id: string): Promise<CommunityDiscussion | null> {
    const rawId = id.replace(/^hn_disc_/, "");
    try {
      const res = await fetch(`https://hn.algolia.com/api/v1/items/${rawId}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        id: `hn_disc_${data.id}`,
        platform: "hackernews",
        title: data.title,
        url: `https://news.ycombinator.com/item?id=${data.id}`,
        commentCount: (data.children || []).length,
        score: data.points || 0,
        publishedAt: data.created_at,
        author: data.author,
        topComments: (data.children || []).slice(0, 3).map((c: any) => ({
          author: c.author || "Anonymous",
          text: (c.text || "").replace(/<[^>]+>/g, " ").slice(0, 200),
          score: c.points || 0,
        })),
      };
    } catch {
      return null;
    }
  }
}

export const hackerNewsProvider = new HackerNewsProvider();
