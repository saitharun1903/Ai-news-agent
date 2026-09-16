import { Paper } from "@/lib/db/types";
import { ResearchFetchOptions, ResearchProvider } from "./types";
import { evaluateAndEnrichPaper } from "../paper-evaluator";

export interface RawOpenAlexWork {
  id: string;
  doi?: string;
  title: string;
  abstract: string;
  authors: string[];
  publicationDate: string;
  year?: number;
  citationCount: number;
  pdfUrl?: string;
  primaryLocationUrl?: string;
  concepts: string[];
}

function reconstructAbstract(invertedIndex?: Record<string, number[]>): string {
  if (!invertedIndex) return "";
  const entries: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      entries.push({ word, pos });
    }
  }
  entries.sort((a, b) => a.pos - b.pos);
  return entries.map((e) => e.word).join(" ");
}

export class OpenAlexResearchProvider implements ResearchProvider {
  name = "OpenAlex";
  enabled = process.env.OPENALEX_ENABLED !== "false";
  private mailto = process.env.OPENALEX_EMAIL || "contact@lunor.co.in";

  async fetchLatest(options?: ResearchFetchOptions): Promise<Paper[]> {
    const query = options?.query || "computer science software engineering distributed systems";
    return this.search(query, options);
  }

  async search(query: string, options?: ResearchFetchOptions): Promise<Paper[]> {
    if (!this.enabled) return [];
    const limit = Math.min(options?.limit || 8, 25);
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(
        query
      )}&per-page=${limit}&sort=publication_date:desc&mailto=${encodeURIComponent(this.mailto)}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": `Lunor/1.0 (mailto:${this.mailto})`,
        },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        console.warn(`[OpenAlex] API returned status ${res.status}`);
        return [];
      }

      const data = await res.json();
      if (!Array.isArray(data.results)) return [];

      const papers: Paper[] = [];
      for (const work of data.results) {
        if (!work.title || work.title.trim().length < 5) continue;

        const title = work.title.replace(/\s+/g, " ").trim();
        const abstract = reconstructAbstract(work.abstract_inverted_index) || title;
        const authors = (work.authorships || [])
          .map((a: any) => a.author?.display_name)
          .filter(Boolean);

        const cleanDoi = work.doi ? work.doi.replace(/^https?:\/\/doi\.org\//i, "") : undefined;
        const pdfUrl = work.open_access?.oa_url || work.primary_location?.pdf_url;
        const publicationDate = work.publication_date || (work.publication_year ? `${work.publication_year}-01-01` : new Date().toISOString());
        const concepts = (work.concepts || []).map((c: any) => c.display_name).filter(Boolean);

        const { paper } = evaluateAndEnrichPaper({
          title,
          abstract,
          authors: authors.slice(0, 10),
          publishedAt: publicationDate,
          doi: cleanDoi,
          doiUrl: work.doi,
          openAlexId: work.id,
          citationCount: work.cited_by_count || 0,
          pdfUrl,
          primaryCategory: concepts[0] || "Computer Science",
          categories: concepts.slice(0, 5),
          discoveryCategory: "trending",
        });

        papers.push(paper);
      }

      return papers;
    } catch (err: any) {
      console.warn("[OpenAlex] Fetch failed:", err.message);
      return [];
    }
  }

  async getPaper(id: string): Promise<Paper | null> {
    const papers = await this.search(id, { limit: 1 });
    return papers[0] || null;
  }

  async getRelatedPapers(id: string): Promise<Paper[]> {
    return this.search(id, { limit: 4 });
  }

  async getCitations(id: string): Promise<{ citationCount: number; references?: string[] }> {
    const paper = await this.getPaper(id);
    return {
      citationCount: paper?.citationCount || 0,
    };
  }
}

export const openAlexProvider = new OpenAlexResearchProvider();
