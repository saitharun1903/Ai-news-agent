import { Paper } from "@/lib/db/types";
import { ResearchFetchOptions, ResearchProvider } from "./types";
import {
  fetchArxivPapers,
  fetchArxivByDomain,
  BROAD_COMPUTING_QUERY,
} from "../arxiv-fetcher";
import { evaluateAndEnrichPaper } from "../paper-evaluator";

export class ArxivResearchProvider implements ResearchProvider {
  name = "arXiv";
  enabled = process.env.ARXIV_ENABLED !== "false";

  async fetchLatest(options?: ResearchFetchOptions): Promise<Paper[]> {
    if (!this.enabled) return [];
    const limit = options?.limit || 15;
    const query = options?.query || BROAD_COMPUTING_QUERY;

    const rawPapers = await fetchArxivPapers(limit, query, "submittedDate");
    return rawPapers.map((raw) => {
      const { paper } = evaluateAndEnrichPaper(raw);
      return paper;
    });
  }

  async search(query: string, options?: ResearchFetchOptions): Promise<Paper[]> {
    if (!this.enabled) return [];
    const limit = options?.limit || 10;
    const rawPapers = await fetchArxivPapers(limit, `all:${encodeURIComponent(query)}`, "relevance");
    return rawPapers.map((raw) => {
      const { paper } = evaluateAndEnrichPaper(raw);
      return paper;
    });
  }

  async getPaper(id: string): Promise<Paper | null> {
    const papers = await this.search(`id:${id}`, { limit: 1 });
    return papers[0] || null;
  }

  async getRelatedPapers(id: string): Promise<Paper[]> {
    return this.search(id, { limit: 4 });
  }

  async getCitations(id: string): Promise<{ citationCount: number; references?: string[] }> {
    return { citationCount: 0 };
  }
}

export const arxivProvider = new ArxivResearchProvider();
