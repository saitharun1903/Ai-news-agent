import { XMLParser } from "fast-xml-parser";
import { parseArxivId } from "./canonicalizer";

export interface RawArxivPaper {
  arxivId: string;
  version?: number;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  primaryCategory: string;
  categories: string[];
  pdfUrl: string;
  arxivUrl: string;
  discoveryCategory?: "trending" | "new" | "important" | "practical" | "foundational";
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  processEntities: false,
  htmlEntities: false,
});

export const BROAD_COMPUTING_QUERY =
  "cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.CV+OR+cat:cs.SE+OR+cat:cs.PL+OR+cat:cs.DC+OR+cat:cs.DB+OR+cat:cs.CR+OR+cat:cs.DS";

export async function fetchArxivPapers(
  maxResults: number = 20,
  query: string = BROAD_COMPUTING_QUERY,
  sortBy: string = "submittedDate"
): Promise<RawArxivPaper[]> {
  try {
    const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=${sortBy}&sortOrder=descending&max_results=${maxResults}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ResearchPulse/1.0 (+https://researchpulse.dev)",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.warn(`[arXiv] Failed with status ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);

    const entries = parsed.feed?.entry
      ? Array.isArray(parsed.feed.entry)
        ? parsed.feed.entry
        : [parsed.feed.entry]
      : [];

    const papers: RawArxivPaper[] = [];

    for (const entry of entries) {
      const rawId = entry.id || "";
      const rawArxivStr = rawId.split("/abs/").pop() || rawId;
      const { canonicalId, version } = parseArxivId(rawArxivStr);
      if (!canonicalId) continue;

      const title = (typeof entry.title === "string" ? entry.title : entry.title?.["#text"] || "")
        .replace(/\s+/g, " ")
        .trim();

      const abstract = (
        typeof entry.summary === "string" ? entry.summary : entry.summary?.["#text"] || ""
      )
        .replace(/\s+/g, " ")
        .trim();

      let authors: string[] = [];
      if (entry.author) {
        const authorList = Array.isArray(entry.author) ? entry.author : [entry.author];
        authors = authorList
          .map((a: any) => (typeof a === "object" ? a.name || a["#text"] : a))
          .filter(Boolean);
      }

      const publishedAt = entry.published || new Date().toISOString();

      let primaryCat = "cs.AI";
      if (entry["arxiv:primary_category"]?.["@_term"]) {
        primaryCat = entry["arxiv:primary_category"]["@_term"];
      }

      let categories: string[] = [primaryCat];
      if (entry.category) {
        const catList = Array.isArray(entry.category) ? entry.category : [entry.category];
        categories = catList.map((c: any) => c["@_term"]).filter(Boolean);
      }

      let pdfUrl = `https://arxiv.org/pdf/${canonicalId}.pdf`;
      let arxivUrl = `https://arxiv.org/abs/${canonicalId}`;

      if (entry.link) {
        const links = Array.isArray(entry.link) ? entry.link : [entry.link];
        const pdfLink = links.find((l: any) => l["@_title"] === "pdf");
        if (pdfLink?.["@_href"]) pdfUrl = pdfLink["@_href"];
      }

      papers.push({
        arxivId: canonicalId,
        version,
        title,
        authors: authors.slice(0, 10),
        abstract,
        publishedAt,
        primaryCategory: mapArxivCategory(primaryCat),
        categories: categories.map(mapArxivCategory),
        pdfUrl,
        arxivUrl,
      });
    }

    return papers;
  } catch (err: any) {
    console.warn("[arXiv] Fetch failed:", err.message);
    return [];
  }
}

export async function fetchArxivFoundationalPapers(): Promise<RawArxivPaper[]> {
  const query = "all:transformer+OR+all:raft+OR+all:mapreduce+OR+all:paxos+OR+all:zero-knowledge";
  const papers = await fetchArxivPapers(10, query, "relevance");
  return papers.map((p) => ({ ...p, discoveryCategory: "foundational" }));
}

export async function fetchArxivByDomain(
  domain: "systems" | "software" | "security" | "pl" | "ai" | "algorithms",
  count: number = 8
): Promise<RawArxivPaper[]> {
  const queryMap: Record<string, string> = {
    systems: "cat:cs.DC+OR+cat:cs.DB+OR+cat:cs.OS",
    software: "cat:cs.SE",
    security: "cat:cs.CR",
    pl: "cat:cs.PL",
    ai: "cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.CV",
    algorithms: "cat:cs.DS",
  };
  const q = queryMap[domain] || BROAD_COMPUTING_QUERY;
  return fetchArxivPapers(count, q, "submittedDate");
}

export function mapArxivCategory(cat: string): string {
  const map: Record<string, string> = {
    "cs.AI": "Artificial Intelligence",
    "cs.LG": "Machine Learning",
    "cs.CL": "Computation and Language (LLMs)",
    "cs.CV": "Computer Vision",
    "cs.RO": "Robotics",
    "stat.ML": "Statistical Machine Learning",
    "cs.SE": "Software Engineering",
    "cs.PL": "Programming Languages",
    "cs.DC": "Distributed & Cloud Computing",
    "cs.DB": "Databases & Data Management",
    "cs.CR": "Cryptography and Security",
    "cs.DS": "Data Structures & Algorithms",
    "cs.OS": "Operating Systems",
    "cs.NI": "Networking & Internet Architecture",
    "cs.AR": "Hardware Architecture",
  };
  return map[cat] || cat;
}
