import crypto from "crypto";
import { Paper, DailyFeedSnapshot } from "@/lib/db/types";

export interface CanonicalIdResult {
  canonicalId: string;
  doi?: string;
  arxivId?: string;
  version?: number;
  semanticScholarId?: string;
  openAlexId?: string;
  crossrefId?: string;
  fingerprint: string;
}

/**
 * Normalizes title by removing punctuation, extra whitespace, and converting to lowercase.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates deterministic fingerprint hash from title + primary author + publication year.
 */
export function generatePaperFingerprint(
  title: string,
  firstAuthor: string = "",
  year?: number | string
): string {
  const normTitle = normalizeTitle(title);
  const normAuthor = firstAuthor.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  const yr = year ? String(year).trim().slice(0, 4) : "";
  const rawKey = `${normTitle}::${normAuthor}::${yr}`;
  return crypto.createHash("sha256").update(rawKey).digest("hex").slice(0, 16);
}

/**
 * Parses arXiv identifier and extracts base canonical ID and version number.
 * e.g., "2401.12345v3" -> { canonicalId: "2401.12345", version: 3 }
 */
export function parseArxivId(rawId: string): { canonicalId: string; version?: number } {
  if (!rawId) return { canonicalId: "" };

  let cleaned = rawId.trim();
  // Strip URL prefixes if present
  if (cleaned.includes("/abs/")) {
    cleaned = cleaned.split("/abs/")[1];
  } else if (cleaned.includes("/pdf/")) {
    cleaned = cleaned.split("/pdf/")[1].replace(/\.pdf$/i, "");
  }

  // Check for version suffix (e.g. "v1", "v2")
  const match = cleaned.match(/^([a-zA-Z\-]+(?:\.[a-zA-Z\-]+)?\/\d+|\d{4}\.\d{4,5})(?:v(\d+))?$/);
  if (match) {
    return {
      canonicalId: match[1],
      version: match[2] ? parseInt(match[2], 10) : undefined,
    };
  }

  // Fallback split on 'v'
  const parts = cleaned.split("v");
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
    const ver = parseInt(parts.pop()!, 10);
    return {
      canonicalId: parts.join("v"),
      version: ver,
    };
  }

  return { canonicalId: cleaned };
}

/**
 * Resolves the canonical identity of a paper using standard priority:
 * 1. DOI
 * 2. arXiv ID (ignoring version suffix)
 * 3. Semantic Scholar ID
 * 4. Deterministic Title + First Author Fingerprint
 */
export function resolveCanonicalPaperId(input: {
  doi?: string;
  arxivId?: string;
  semanticScholarId?: string;
  openAlexId?: string;
  crossrefId?: string;
  title: string;
  firstAuthor?: string;
  year?: number | string;
}): CanonicalIdResult {
  const firstAuthor = input.firstAuthor || "";
  const fingerprint = generatePaperFingerprint(input.title, firstAuthor, input.year);

  // 1. Normalized DOI
  if (input.doi && input.doi.trim().length > 3) {
    const cleanDoi = input.doi.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
    const safeDoi = cleanDoi.replace(/[^a-z0-9]/gi, "_");
    return {
      canonicalId: `doi_${safeDoi}`,
      doi: cleanDoi,
      fingerprint,
    };
  }

  // 2. arXiv ID without version
  if (input.arxivId && input.arxivId.trim().length > 0) {
    const { canonicalId, version } = parseArxivId(input.arxivId);
    if (canonicalId) {
      const safeArxiv = canonicalId.replace(/[^a-z0-9]/gi, "_");
      return {
        canonicalId: `arxiv_${safeArxiv}`,
        arxivId: canonicalId,
        version,
        fingerprint,
      };
    }
  }

  // 3. Semantic Scholar ID
  if (input.semanticScholarId && input.semanticScholarId.trim().length > 0) {
    const cleanS2 = input.semanticScholarId.trim().replace(/[^a-z0-9]/gi, "_");
    return {
      canonicalId: `s2_${cleanS2}`,
      semanticScholarId: input.semanticScholarId.trim(),
      fingerprint,
    };
  }

  // 4. OpenAlex ID
  if ((input as any).openAlexId && (input as any).openAlexId.trim().length > 0) {
    const cleanOa = (input as any).openAlexId.trim().replace(/https?:\/\/openalex\.org\//i, "").replace(/[^a-z0-9]/gi, "_");
    return {
      canonicalId: `oa_${cleanOa}`,
      fingerprint,
    };
  }

  // 5. Crossref ID
  if ((input as any).crossrefId && (input as any).crossrefId.trim().length > 0) {
    const cleanCr = (input as any).crossrefId.trim().replace(/[^a-z0-9]/gi, "_");
    return {
      canonicalId: `cr_${cleanCr}`,
      fingerprint,
    };
  }

  // 6. Normalized Fingerprint Hash
  return {
    canonicalId: `fp_${fingerprint}`,
    fingerprint,
  };
}

/**
 * Merges a newer preprint or external metadata into an existing canonical Paper record.
 * Ensures the same paper is never duplicated across versions or providers.
 */
export function mergePaperPreprints(existing: Paper, incoming: Partial<Paper>): Paper {
  const existingVersion = existing.version || 1;
  const incomingVersion = incoming.version || 1;

  // Build/update versions history array
  const versions = existing.versions ? [...existing.versions] : [
    {
      version: existingVersion,
      date: existing.publishedAt,
      url: existing.pdfUrl || existing.arxivUrl,
    },
  ];

  if (incoming.version && !versions.some((v) => v.version === incoming.version)) {
    versions.push({
      version: incoming.version,
      date: incoming.publishedAt || new Date().toISOString(),
      url: incoming.pdfUrl || incoming.arxivUrl,
    });
    versions.sort((a, b) => a.version - b.version);
  }

  const isNewer = incomingVersion >= existingVersion;

  return {
    ...existing,
    // Update core metadata if newer
    title: isNewer && incoming.title ? incoming.title : existing.title,
    abstract: isNewer && incoming.abstract ? incoming.abstract : existing.abstract,
    pdfUrl: isNewer && incoming.pdfUrl ? incoming.pdfUrl : existing.pdfUrl,
    version: Math.max(existingVersion, incomingVersion),
    versions,

    // Merge external links
    doi: incoming.doi || existing.doi,
    doiUrl: incoming.doiUrl || existing.doiUrl,
    semanticScholarId: incoming.semanticScholarId || existing.semanticScholarId,
    openAlexId: (incoming as any).openAlexId || (existing as any).openAlexId,
    crossrefId: (incoming as any).crossrefId || (existing as any).crossrefId,
    githubUrl: incoming.githubUrl || existing.githubUrl,
    projectUrl: incoming.projectUrl || existing.projectUrl,

    // Metrics (take highest)
    upvotes: Math.max(existing.upvotes || 0, incoming.upvotes || 0),
    citationCount: Math.max(existing.citationCount || 0, incoming.citationCount || 0),

    // Merge categories
    categories: Array.from(
      new Set([...(existing.categories || []), ...(incoming.categories || [])])
    ),

    // Keep canonical IDs
    id: existing.id,
    arxivId: existing.arxivId || incoming.arxivId || "",
    slug: existing.slug,
    isPaperOfDay: existing.isPaperOfDay || incoming.isPaperOfDay || false,
    paperOfDayDate: existing.paperOfDayDate || incoming.paperOfDayDate,
  };
}

/**
 * Excludes papers that were previously surfaced in any prior DailyFeedSnapshot
 * so they are never surfaced again as "NEW" in the daily feed.
 */
export function filterNeverShownAsNew(
  papers: Paper[],
  historicalSnapshots: DailyFeedSnapshot[],
  currentDate?: string
): Paper[] {
  const previouslySurfacedIds = new Set<string>();
  const today = currentDate || new Date().toISOString().split("T")[0];

  for (const snap of historicalSnapshots) {
    // Only consider prior days
    if (snap.date === today) continue;

    if (snap.papers) {
      for (const p of snap.papers) {
        previouslySurfacedIds.add(p.id);
        if (p.arxivId) previouslySurfacedIds.add(`arxiv_${p.arxivId.replace(/[^a-z0-9]/gi, "_")}`);
        if (p.fingerprint) previouslySurfacedIds.add(`fp_${p.fingerprint}`);
      }
    }
    if (snap.paperOfDay) {
      previouslySurfacedIds.add(snap.paperOfDay.id);
    }
  }

  return papers.filter((p) => {
    if (previouslySurfacedIds.has(p.id)) return false;
    if (p.arxivId && previouslySurfacedIds.has(`arxiv_${p.arxivId.replace(/[^a-z0-9]/gi, "_")}`)) return false;
    if (p.fingerprint && previouslySurfacedIds.has(`fp_${p.fingerprint}`)) return false;
    return true;
  });
}
