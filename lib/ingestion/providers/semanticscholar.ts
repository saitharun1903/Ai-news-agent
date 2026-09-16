import { Paper } from "@/lib/db/types";
import { ResearchFetchOptions, ResearchProvider } from "./types";
import { evaluateAndEnrichPaper } from "../paper-evaluator";

export interface RawSemanticScholarPaper {
  semanticScholarId: string;
  doi?: string;
  arxivId?: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  year?: number;
  citationCount: number;
  pdfUrl?: string;
  s2Url: string;
  fieldsOfStudy: string[];
}

export async function fetchSemanticScholarPapers(
  query: string = "distributed systems software engineering machine learning",
  limit: number = 10
): Promise<RawSemanticScholarPaper[]> {
  try {
    const fields = "paperId,title,abstract,authors,year,citationCount,isOpenAccess,openAccessPdf,externalIds,url,fieldsOfStudy,publicationDate";
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
      query
    )}&limit=${limit}&fields=${fields}`;

    const headers: Record<string, string> = {
      "User-Agent": "Lunor/1.0 (academic-research-digest)",
    };

    if (process.env.SEMANTIC_SCHOLAR_API_KEY && process.env.SEMANTIC_SCHOLAR_API_KEY.trim() && process.env.SEMANTIC_SCHOLAR_API_KEY !== "dont know") {
      headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY.trim();
    }

    const res = await fetch(url, {
      headers,
      next: { revalidate: 7200 },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[SemanticScholar] API returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    const papers: RawSemanticScholarPaper[] = [];

    for (const item of data.data) {
      if (!item.title || item.title.trim().length < 5) continue;

      const title = item.title.replace(/\s+/g, " ").trim();
      const abstract = (item.abstract || "").replace(/\s+/g, " ").trim();
      const authors = (item.authors || []).map((a: any) => a.name).filter(Boolean);
      const doi = item.externalIds?.DOI;
      const arxivId = item.externalIds?.ArXiv;
      const citationCount = typeof item.citationCount === "number" ? item.citationCount : 0;
      const pdfUrl = item.openAccessPdf?.url || (arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : undefined);
      const publishedAt = item.publicationDate || (item.year ? `${item.year}-01-01` : new Date().toISOString());

      papers.push({
        semanticScholarId: item.paperId,
        doi,
        arxivId,
        title,
        authors: authors.slice(0, 10),
        abstract,
        publishedAt,
        year: item.year,
        citationCount,
        pdfUrl,
        s2Url: item.url || `https://www.semanticscholar.org/paper/${item.paperId}`,
        fieldsOfStudy: item.fieldsOfStudy || ["Computer Science"],
      });
    }

    return papers;
  } catch (err: any) {
    console.warn("[SemanticScholar] Fetch failed:", err.message);
    return [];
  }
}

export class SemanticScholarResearchProvider implements ResearchProvider {
  name = "Semantic Scholar";
  enabled = process.env.SEMANTIC_SCHOLAR_ENABLED !== "false";

  async fetchLatest(options?: ResearchFetchOptions): Promise<Paper[]> {
    const query = options?.query || "software engineering distributed systems compilers databases";
    return this.search(query, options);
  }

  async search(query: string, options?: ResearchFetchOptions): Promise<Paper[]> {
    if (!this.enabled) return [];
    const limit = options?.limit || 10;
    const rawPapers = await fetchSemanticScholarPapers(query, limit);

    return rawPapers.map((raw) => {
      const { paper } = evaluateAndEnrichPaper({
        title: raw.title,
        abstract: raw.abstract,
        authors: raw.authors,
        publishedAt: raw.publishedAt,
        semanticScholarId: raw.semanticScholarId,
        doi: raw.doi,
        arxivId: raw.arxivId,
        citationCount: raw.citationCount,
        pdfUrl: raw.pdfUrl,
        primaryCategory: raw.fieldsOfStudy[0] || "Computer Science",
        categories: raw.fieldsOfStudy,
        discoveryCategory: "trending",
      });
      return paper;
    });
  }

  async getPaper(id: string): Promise<Paper | null> {
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(
        id
      )}?fields=paperId,title,abstract,authors,year,citationCount,isOpenAccess,openAccessPdf,externalIds,url,fieldsOfStudy,publicationDate`;

      const headers: Record<string, string> = {
        "User-Agent": "Lunor/1.0 (academic-research-digest)",
      };
      if (process.env.SEMANTIC_SCHOLAR_API_KEY && process.env.SEMANTIC_SCHOLAR_API_KEY.trim() && process.env.SEMANTIC_SCHOLAR_API_KEY !== "dont know") {
        headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY.trim();
      }

      const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.title) return null;

      const { paper } = evaluateAndEnrichPaper({
        title: data.title,
        abstract: data.abstract || "",
        authors: (data.authors || []).map((a: any) => a.name),
        publishedAt: data.publicationDate,
        semanticScholarId: data.paperId,
        doi: data.externalIds?.DOI,
        arxivId: data.externalIds?.ArXiv,
        citationCount: data.citationCount || 0,
        pdfUrl: data.openAccessPdf?.url,
      });
      return paper;
    } catch {
      return null;
    }
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

export const semanticScholarProvider = new SemanticScholarResearchProvider();
