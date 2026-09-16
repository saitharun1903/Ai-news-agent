import { Article } from "@/lib/db/types";
import { NewsFetchOptions, NewsProvider } from "./types";

export class NewsApiProvider implements NewsProvider {
  name = "NewsAPI";
  enabled = process.env.NEWSAPI_ENABLED !== "false" && !!process.env.NEWSAPI_KEY;

  async fetchLatest(options?: NewsFetchOptions): Promise<Article[]> {
    if (!this.enabled) return [];
    const apiKey = process.env.NEWSAPI_KEY?.trim();
    if (!apiKey) return [];

    const limit = Math.min(options?.limit || 12, 30);

    try {
      // Fetch top tech headlines or specific query
      const url = options?.query
        ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(
            options.query
          )}&domains=techcrunch.com,wired.com,arstechnica.com,theverge.com,venturebeat.com,zdnet.com&language=en&sortBy=publishedAt&pageSize=${limit}&apiKey=${apiKey}`
        : `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=${limit}&apiKey=${apiKey}`;

      const res = await fetch(url, {
        headers: { "User-Agent": "ResearchPulse/1.0" },
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn(`[NewsAPI] Request returned status ${res.status}`);
        return [];
      }

      const data = await res.json();
      if (!Array.isArray(data.articles)) return [];

      const articles: Article[] = [];
      for (const item of data.articles) {
        if (!item.title || item.title === "[Removed]" || !item.url) continue;

        const cleanTitle = item.title.replace(/\s+-\s+[^-]+$/, "").trim(); // Remove publication suffix
        const slug = cleanTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
          .slice(0, 70);

        const id = `newsapi_${Buffer.from(item.url).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;

        articles.push({
          id,
          slug,
          title: cleanTitle,
          canonicalTitle: cleanTitle,
          url: item.url,
          sourceUrl: item.url,
          sourceId: "newsapi",
          sourceName: item.source?.name || "Tech Press",
          summary: item.description || item.content?.slice(0, 250) || cleanTitle,
          content: item.content || undefined,
          author: item.author || undefined,
          publishedAt: item.publishedAt || new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          category: options?.category || "TECHNOLOGY",
          topics: [options?.category || "Tech", item.source?.name].filter(Boolean),
          entities: [],
          importanceScore: 75,
          readTimeMinutes: 4,
          imageUrl: item.urlToImage || undefined,
          originalImageUrl: item.urlToImage || undefined,
          createdAt: new Date().toISOString(),
        });
      }

      return articles;
    } catch (err: any) {
      console.warn("[NewsAPI] Fetch failed:", err.message);
      return [];
    }
  }

  async search(query: string): Promise<Article[]> {
    return this.fetchLatest({ query, limit: 10 });
  }

  async getArticle(id: string): Promise<Article | null> {
    const results = await this.fetchLatest({ limit: 20 });
    return results.find((a) => a.id === id) || null;
  }
}

export const newsApiProvider = new NewsApiProvider();
