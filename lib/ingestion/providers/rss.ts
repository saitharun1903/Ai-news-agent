import { Article, Source } from "@/lib/db/types";
import { NewsFetchOptions, NewsProvider } from "./types";
import { fetchRssSource } from "../rss-fetcher";
import { DEFAULT_SOURCES } from "../sources";

export class RssNewsProvider implements NewsProvider {
  name = "RSS";
  enabled = process.env.RSS_ENABLED !== "false";

  async fetchLatest(options?: NewsFetchOptions): Promise<Article[]> {
    if (!this.enabled) return [];
    const limit = options?.limit || 20;

    const rssSources = DEFAULT_SOURCES.filter(
      (s) => s.enabled && (s.type === "rss" || s.type === "lab")
    );

    const articles: Article[] = [];
    for (const source of rssSources.slice(0, 10)) {
      try {
        const fetched = await fetchRssSource(source);
        articles.push(...fetched);
      } catch (err: any) {
        console.warn(`[RSS Provider] ${source.name} failed:`, err.message);
      }
    }

    // Sort by publication date desc
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return articles.slice(0, limit);
  }

  async search(query: string): Promise<Article[]> {
    const all = await this.fetchLatest({ limit: 40 });
    const q = query.toLowerCase();
    return all.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
  }

  async getArticle(id: string): Promise<Article | null> {
    const all = await this.fetchLatest({ limit: 40 });
    return all.find((a) => a.id === id) || null;
  }
}

export const rssNewsProvider = new RssNewsProvider();
