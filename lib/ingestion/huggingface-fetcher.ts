export interface RawHuggingFacePaper {
  id: string;
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  upvotes: number;
  githubUrl?: string;
  pdfUrl: string;
  arxivUrl: string;
  discussionCount?: number;
}

export async function fetchHuggingFacePapers(): Promise<RawHuggingFacePaper[]> {
  try {
    const res = await fetch("https://huggingface.co/api/daily_papers", {
      headers: {
        "User-Agent": "ResearchPulse/1.0",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.warn(`[HuggingFace] API status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const papers: RawHuggingFacePaper[] = [];

    for (const item of data.slice(0, 30)) {
      const p = item.paper || item;
      const title = p.title || "";
      const arxivId = p.id || item.id || "";
      if (!title || !arxivId) continue;

      const abstract = p.summary || p.abstract || "";
      const authors = Array.isArray(p.authors)
        ? p.authors.map((a: any) => (typeof a === "object" ? a.name : a)).filter(Boolean)
        : [];

      const publishedAt = p.publishedAt || item.publishedAt || new Date().toISOString();
      const upvotes = p.upvotes || item.upvotes || 0;
      const discussionCount = p.numComments || item.numComments || 0;

      let githubUrl: string | undefined;
      if (p.githubRepo) {
        githubUrl = `https://github.com/${p.githubRepo}`;
      }

      papers.push({
        id: `hf_${arxivId}`,
        arxivId,
        title: title.trim(),
        authors: authors.slice(0, 8),
        abstract: abstract.trim(),
        publishedAt,
        upvotes,
        githubUrl,
        pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
        arxivUrl: `https://arxiv.org/abs/${arxivId}`,
        discussionCount,
      });
    }

    return papers;
  } catch (err: any) {
    console.warn("[HuggingFace] Fetch failed:", err.message);
    return [];
  }
}
