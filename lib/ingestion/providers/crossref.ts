import { Paper } from "@/lib/db/types";
import { ResearchFetchOptions, ResearchProvider } from "./types";
import { evaluateAndEnrichPaper } from "../paper-evaluator";

export interface RawCrossrefPaper {
  doi: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  citationCount: number;
  doiUrl: string;
  pdfUrl?: string;
  containerTitle?: string;
}

export async function fetchCrossrefPapers(
  query: string = "software engineering distributed systems computer science",
  limit: number = 8
): Promise<RawCrossrefPaper[]> {
  try {
    const mailto = process.env.CROSSREF_MAILTO || "contact@lunor.co.in";
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(
      query
    )}&filter=has-abstract:true&rows=${limit}&sort=published&order=desc`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": `Lunor/1.0 (mailto:${mailto})`,
      },
      next: { revalidate: 7200 },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[Crossref] API returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const items = data.message?.items;
    if (!Array.isArray(items)) {
      return [];
    }

    const papers: RawCrossrefPaper[] = [];

    for (const item of items) {
      if (!item.title || item.title.length === 0) continue;
      const rawTitle = Array.isArray(item.title) ? item.title[0] : item.title;
      const title = String(rawTitle).replace(/\s+/g, " ").trim();
      if (title.length < 5) continue;

      let abstract = "";
      if (item.abstract) {
        abstract = String(item.abstract)
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      const authors: string[] = [];
      if (Array.isArray(item.author)) {
        for (const a of item.author) {
          const name = [a.given, a.family].filter(Boolean).join(" ");
          if (name) authors.push(name);
        }
      }

      let publishedAt = new Date().toISOString();
      const dateParts = item.published?.["date-parts"]?.[0] || item.created?.["date-parts"]?.[0];
      if (Array.isArray(dateParts) && dateParts.length > 0) {
        const yr = dateParts[0];
        const mo = String(dateParts[1] || 1).padStart(2, "0");
        const dy = String(dateParts[2] || 1).padStart(2, "0");
        publishedAt = `${yr}-${mo}-${dy}`;
      }

      const citationCount = typeof item["is-referenced-by-count"] === "number" ? item["is-referenced-by-count"] : 0;
      const doi = item.DOI || "";
      const doiUrl = item.URL || (doi ? `https://doi.org/${doi}` : "");

      let pdfUrl: string | undefined;
      if (Array.isArray(item.link)) {
        const pdfLink = item.link.find(
          (l: any) => l["content-type"] === "application/pdf" || l.URL?.endsWith(".pdf")
        );
        if (pdfLink?.URL) pdfUrl = pdfLink.URL;
      }

      papers.push({
        doi,
        title,
        authors: authors.slice(0, 10),
        abstract,
        publishedAt,
        citationCount,
        doiUrl,
        pdfUrl,
        containerTitle: Array.isArray(item["container-title"]) ? item["container-title"][0] : undefined,
      });
    }

    return papers;
  } catch (err: any) {
    console.warn("[Crossref] Fetch failed:", err.message);
    return [];
  }
}

export class CrossrefResearchProvider implements ResearchProvider {
  name = "Crossref";
  enabled = process.env.CROSSREF_ENABLED !== "false";

  async fetchLatest(options?: ResearchFetchOptions): Promise<Paper[]> {
    const query = options?.query || "software engineering distributed systems computer science";
    return this.search(query, options);
  }

  async search(query: string, options?: ResearchFetchOptions): Promise<Paper[]> {
    if (!this.enabled) return [];
    const limit = options?.limit || 8;
    const rawPapers = await fetchCrossrefPapers(query, limit);

    return rawPapers.map((raw) => {
      const { paper } = evaluateAndEnrichPaper({
        title: raw.title,
        abstract: raw.abstract,
        authors: raw.authors,
        publishedAt: raw.publishedAt,
        doi: raw.doi,
        doiUrl: raw.doiUrl,
        citationCount: raw.citationCount,
        pdfUrl: raw.pdfUrl,
        primaryCategory: "Computer Science",
        categories: [raw.containerTitle || "Peer-Reviewed Proceedings"],
        discoveryCategory: "foundational",
      });
      return paper;
    });
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

export const crossrefProvider = new CrossrefResearchProvider();
