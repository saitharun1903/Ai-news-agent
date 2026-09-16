import { getDailyActivityMap, calculateStreaks, getLocalDateString } from "@/lib/analytics/streak";
import fs from "fs";
import path from "path";
import {
  Article,
  ArticleGroup,
  Bookmark,
  DailyBriefing,
  DailyFeedSnapshot,
  IngestionLog,
  Note,
  Paper,
  PaperChunk,
  PaperIdentifier,
  PaperVersion,
  PaperDailyHistory,
  ReadingSession,
  Source,
  UserFavorite,
  UserProfile,
  UserPreferences,
  TechnicalDepth,
  normalizeTechnicalDepth,
  VisualAsset,
} from "./types";
import { DEFAULT_SOURCES } from "@/lib/ingestion/sources";
import { mergePaperPreprints, filterNeverShownAsNew } from "@/lib/ingestion/canonicalizer";

interface DatabaseData {
  profile: UserProfile;
  sources: Source[];
  articles: Article[];
  articleGroups: ArticleGroup[];
  papers: Paper[];
  paperChunks: PaperChunk[];
  paperIdentifiers?: PaperIdentifier[];
  paperVersions?: PaperVersion[];
  paperDailyHistory?: PaperDailyHistory[];
  readingSessions: ReadingSession[];
  bookmarks: Bookmark[];
  favorites: UserFavorite[];
  dailyFeeds: DailyFeedSnapshot[];
  notes: Note[];
  briefings: DailyBriefing[];
  ingestionLogs: IngestionLog[];
  visualAssets?: VisualAsset[];
}

function getDbPath(): string {
  if (process.env.VERCEL) {
    const tmpFile = path.join("/tmp", "researchpulse.json");
    if (!fs.existsSync(tmpFile)) {
      const bundledPath = path.join(process.cwd(), "data", "researchpulse.json");
      if (fs.existsSync(bundledPath)) {
        try {
          const dir = path.dirname(tmpFile);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.copyFileSync(bundledPath, tmpFile);
        } catch (e) {
          console.warn("[Storage] Could not copy bundled DB to /tmp:", e);
        }
      }
    }
    return tmpFile;
  }
  return path.join(process.cwd(), "data", "researchpulse.json");
}

const DEFAULT_PROFILE: UserProfile = {
  id: "user_primary",
  name: "Sai Tharun Reddy",
  email: "sai@lunor.co.in",
  timezone: "Asia/Kolkata",
  createdAt: "2026-09-01T00:00:00.000Z",
  readingStreak: 0,
  longestStreak: 0,
  lastActiveDate: "",
  totalReadingMinutes: 0,
  papersReadCount: 0,
  articlesReadCount: 0,
  difficultyPreference: "Intermediate",
  interestedTopics: ["llms", "agents", "rag", "ai-infrastructure"],
  dailyGoalMinutes: 25,
  morningBriefingTime: "08:30",
  desktopNotificationsEnabled: true,
  weekendNotificationsEnabled: true,
  soundEnabled: true,
};

class StorageRepository {
  private data: DatabaseData | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;

  private load(): DatabaseData {
    if (this.data) return this.data;

    try {
      const dbPath = getDbPath();
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, "utf-8");
        this.data = JSON.parse(raw);
        // Ensure all arrays exist
        if (!this.data!.sources || this.data!.sources.length === 0) {
          this.data!.sources = DEFAULT_SOURCES;
        }
        if (!this.data!.profile) {
          this.data!.profile = DEFAULT_PROFILE;
        }
        if (!this.data!.favorites) {
          this.data!.favorites = [];
        }
        if (!this.data!.dailyFeeds) {
          this.data!.dailyFeeds = [];
        }
        if (!this.data!.visualAssets) {
          this.data!.visualAssets = [];
        }
        if (!this.data!.paperIdentifiers) {
          this.data!.paperIdentifiers = [];
        }
        if (!this.data!.paperVersions) {
          this.data!.paperVersions = [];
        }
        if (!this.data!.paperDailyHistory) {
          this.data!.paperDailyHistory = [];
        }
        this.seedHistoricalSnapshotsIfNeeded();
        return this.data!;
      }
    } catch (err) {
      console.error("[Storage] Failed to read database, initializing fresh:", err);
    }

    this.data = {
      profile: DEFAULT_PROFILE,
      sources: DEFAULT_SOURCES,
      articles: [],
      articleGroups: [],
      papers: [],
      paperChunks: [],
      paperIdentifiers: [],
      paperVersions: [],
      paperDailyHistory: [],
      readingSessions: [],
      bookmarks: [],
      favorites: [],
      dailyFeeds: [],
      notes: [],
      briefings: [],
      ingestionLogs: [],
      visualAssets: [],
    };

    this.seedHistoricalSnapshotsIfNeeded();
    this.persistSync();
    return this.data;
  }

  private persistSync() {
    if (!this.data) return;
    try {
      const dbPath = getDbPath();
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${dbPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tmpPath, dbPath);
    } catch (err) {
      console.error("[Storage] Failed to persist data:", err);
    }
  }

  private schedulePersist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistSync();
    }, 150);
  }

  // --- Sources ---
  async getSources(): Promise<Source[]> {
    const data = this.load();
    return data.sources;
  }

  async updateSource(id: string, updates: Partial<Source>): Promise<void> {
    const data = this.load();
    const idx = data.sources.findIndex((s) => s.id === id);
    if (idx !== -1) {
      data.sources[idx] = { ...data.sources[idx], ...updates };
      this.schedulePersist();
    }
  }

  // --- Articles ---
  async getArticles(filter?: { category?: string; search?: string; limit?: number }): Promise<Article[]> {
    const data = this.load();
    let res = [...data.articles];

    if (filter?.category && filter.category !== "ALL") {
      res = res.filter((a) => a.category.toLowerCase() === filter.category!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      res = res.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
    }

    res.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    if (filter?.limit) {
      res = res.slice(0, filter.limit);
    }

    return res;
  }

  async getArticleById(id: string): Promise<Article | null> {
    const data = this.load();
    return data.articles.find((a) => a.id === id || a.slug === id) || null;
  }

  async saveArticles(newArticles: Article[]): Promise<void> {
    const data = this.load();
    const existingIds = new Set(data.articles.map((a) => a.url));

    for (const art of newArticles) {
      if (!existingIds.has(art.url)) {
        data.articles.push(art);
        existingIds.add(art.url);
      }
    }

    // Keep up to 1000 recent articles
    if (data.articles.length > 1000) {
      data.articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      data.articles = data.articles.slice(0, 1000);
    }

    this.schedulePersist();
  }

  // --- Article Groups (Clustered Stories) ---
  async getArticleGroups(filter?: { topic?: string; search?: string; limit?: number }): Promise<ArticleGroup[]> {
    const data = this.load();
    let res = [...data.articleGroups];

    if (filter?.topic && filter.topic !== "ALL") {
      res = res.filter((g) => g.topic.toLowerCase() === filter.topic!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      res = res.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.summary.toLowerCase().includes(q) ||
          (g.whyItMatters && g.whyItMatters.toLowerCase().includes(q)) ||
          (g.topic && g.topic.toLowerCase().includes(q))
      );
    }

    res.sort((a, b) => {
      // Sort by score then recency
      if (b.importanceScore !== a.importanceScore) {
        return b.importanceScore - a.importanceScore;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    if (filter?.limit) {
      res = res.slice(0, filter.limit);
    }

    return res;
  }

  async getLeadStory(): Promise<ArticleGroup | null> {
    const groups = await this.getArticleGroups({ limit: 1 });
    return groups.length > 0 ? groups[0] : null;
  }

  async getArticleGroupById(id: string): Promise<ArticleGroup | null> {
    const data = this.load();
    return data.articleGroups.find((g) => g.id === id) || null;
  }

  async saveArticleGroups(groups: ArticleGroup[]): Promise<void> {
    const data = this.load();
    const map = new Map(data.articleGroups.map((g) => [g.id, g]));

    for (const g of groups) {
      map.set(g.id, g);
    }

    data.articleGroups = Array.from(map.values());
    this.schedulePersist();
  }

  // --- Research Papers ---
  async getPapers(filter?: {
    category?: "trending" | "new" | "important" | "practical" | "foundational" | "for-you" | string;
    topic?: string;
    search?: string;
    query?: string;
    difficulty?: string;
    limit?: number;
  }): Promise<Paper[]> {
    const data = this.load();
    let res = [...data.papers];

    if (filter?.category) {
      const validCats = ["trending", "new", "important", "practical", "foundational", "for-you"];
      if (filter.category === "for-you") {
        const userTopics = data.profile.interestedTopics.map((t) => t.toLowerCase());
        res = res.filter((p) =>
          p.categories.some((c) => userTopics.some((ut) => c.toLowerCase().includes(ut)))
        );
      } else if (filter.category === "new") {
        // Exclude papers already surfaced in previous daily snapshots so the same paper is never surfaced again as NEW
        res = res.filter((p) => p.discoveryCategory === "new");
        res = filterNeverShownAsNew(res, data.dailyFeeds || []);
      } else if (validCats.includes(filter.category)) {
        res = res.filter((p) => p.discoveryCategory === filter.category);
      } else {
        const t = filter.category.toLowerCase();
        res = res.filter(
          (p) =>
            p.primaryCategory.toLowerCase().includes(t) ||
            p.categories.some((c) => c.toLowerCase().includes(t)) ||
            p.title.toLowerCase().includes(t)
        );
      }
    }

    if (filter?.topic) {
      const t = filter.topic.toLowerCase();
      res = res.filter(
        (p) =>
          p.primaryCategory.toLowerCase().includes(t) ||
          p.categories.some((c) => c.toLowerCase().includes(t)) ||
          p.title.toLowerCase().includes(t)
      );
    }

    if (filter?.difficulty) {
      res = res.filter((p) => p.difficulty.toLowerCase() === filter.difficulty!.toLowerCase());
    }

    const searchTerm = filter?.search || filter?.query;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      res = res.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.abstract.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q))
      );
    }

    res.sort((a, b) => {
      // Sort by upvotes, citations, then publication date
      const scoreA = (a.upvotes || 0) * 3 + (a.citationCount || 0);
      const scoreB = (b.upvotes || 0) * 3 + (b.citationCount || 0);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    if (filter?.limit) {
      res = res.slice(0, filter.limit);
    }

    return res;
  }

  async getPaperById(id: string): Promise<Paper | null> {
    const data = this.load();
    const cleanId = id.trim();
    return (
      data.papers.find(
        (p) =>
          p.id === cleanId ||
          p.arxivId === cleanId ||
          p.slug === cleanId ||
          (p.doi && p.doi.toLowerCase() === cleanId.toLowerCase()) ||
          (p.arxivId && `arxiv_${p.arxivId.replace(/[^a-z0-9]/gi, "_")}` === cleanId) ||
          (p.arxivId && `arxiv_${p.arxivId.replace(/v\d+$/i, "").replace(/[^a-z0-9]/gi, "_")}` === cleanId) ||
          (p.doi && `doi_${p.doi.toLowerCase().replace(/[^a-z0-9]/gi, "_")}` === cleanId)
      ) || null
    );
  }

  async getRecommendedPapers(options?: { limit?: number; userId?: string }): Promise<Paper[]> {
    const data = this.load();
    const limit = options?.limit || 10;
    const profile = await this.getUserProfile();
    const interested = (profile.interestedTopics || []).map((t) => t.toLowerCase());
    const depth = normalizeTechnicalDepth(profile.difficultyPreference);

    // Get completed papers to exclude from recommendations (freshness & diversity)
    const completedPaperIds = new Set<string>();
    for (const session of data.readingSessions || []) {
      if (session.completed) completedPaperIds.add(session.paperId);
    }

    const availablePapers = data.papers.filter((p) => !completedPaperIds.has(p.id));
    const pool = availablePapers.length > 0 ? availablePapers : data.papers;

    const scored = pool.map((paper) => {
      let score = (paper.upvotes || 0) * 2 + (paper.citationCount || 0);

      // 1. Topic Affinity Matching
      const paperTopics = [
        paper.primaryCategory,
        ...(paper.categories || []),
        ...(paper.keywords || []),
      ]
        .filter(Boolean)
        .map((t) => t.toLowerCase());

      const topicMatched = interested.some((favTopic) =>
        paperTopics.some((pt) => pt.includes(favTopic) || favTopic.includes(pt))
      );

      if (topicMatched) {
        score += 80;
      }

      // 2. Technical Depth Calibration
      const pDiff = (paper.difficulty || "Intermediate").toLowerCase();
      if (depth === "accessible") {
        if (pDiff === "beginner") score += 60;
        else if (pDiff === "intermediate") score += 20;
        else if (pDiff === "advanced") score -= 30;
        if (paper.readingTimeMinutes && paper.readingTimeMinutes <= 15) score += 15;
      } else if (depth === "rigorous") {
        if (pDiff === "advanced") score += 60;
        else if (pDiff === "intermediate") score += 20;
        else if (pDiff === "beginner") score -= 30;
        if ((paper.citationCount || 0) > 30) score += 25;
      } else {
        // "intermediate" or "all": balanced
        if (pDiff === "intermediate") score += 30;
        else score += 15;
      }

      return { paper, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.paper);
  }

  async getPaperOfDay(): Promise<Paper | null> {
    const data = this.load();
    const profile = await this.getUserProfile();
    const tz = profile.timezone || "Asia/Kolkata";
    const todayStr = getLocalDateString(new Date(), tz);

    // Check if designated for today
    const tagged = data.papers.find((p) => p.isPaperOfDay && p.paperOfDayDate === todayStr);
    if (tagged) return tagged;

    // Reset old designation from prior dates
    for (const p of data.papers) {
      if (p.isPaperOfDay && p.paperOfDayDate !== todayStr) {
        p.isPaperOfDay = false;
      }
    }

    // Select candidate matching user preferences, excluding completed papers
    const recommended = await this.getRecommendedPapers({ limit: 10 });
    const candidate = recommended[0] || data.papers[0];

    if (candidate) {
      candidate.isPaperOfDay = true;
      candidate.paperOfDayDate = todayStr;
      this.schedulePersist();
      return candidate;
    }

    return null;
  }

  async savePapers(papers: Paper[]): Promise<void> {
    const data = this.load();
    data.paperIdentifiers = data.paperIdentifiers || [];
    data.paperVersions = data.paperVersions || [];
    const map = new Map<string, Paper>();
    const canonicalPapers = new Map<string, Paper>();

    // Index existing papers by canonical ID, arxivId, doi, s2, openalex, crossref, and fingerprint
    for (const p of data.papers) {
      canonicalPapers.set(p.id, p);
      map.set(p.id, p);
      if (p.doi) map.set(`doi_${p.doi.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`, p);
      if (p.arxivId) {
        map.set(`arxiv_${p.arxivId.replace(/[^a-z0-9]/gi, "_")}`, p);
        map.set(`arxiv_${p.arxivId.replace(/v\d+$/i, "").replace(/[^a-z0-9]/gi, "_")}`, p);
      }
      if (p.semanticScholarId) map.set(`s2_${p.semanticScholarId.replace(/[^a-z0-9]/gi, "_")}`, p);
      if (p.openAlexId) map.set(`oa_${p.openAlexId.replace(/https?:\/\/openalex\.org\//i, "").replace(/[^a-z0-9]/gi, "_")}`, p);
      if (p.crossrefId) map.set(`cr_${p.crossrefId.replace(/[^a-z0-9]/gi, "_")}`, p);
      if (p.fingerprint) map.set(`fp_${p.fingerprint}`, p);
      if (p.canonicalFingerprint) map.set(`fp_${p.canonicalFingerprint}`, p);
    }

    const recordIdentifier = (paperId: string, provider: string, type: any, val?: string) => {
      if (!val) return;
      const exists = data.paperIdentifiers!.some(
        (pi) => pi.paperId === paperId && pi.identifierType === type && pi.identifierValue === val
      );
      if (!exists) {
        data.paperIdentifiers!.push({
          paperId,
          provider,
          providerId: val,
          identifierType: type,
          identifierValue: val,
        });
      }
    };

    const recordVersion = (paperId: string, ver: number, url?: string, pubDate?: string) => {
      const exists = data.paperVersions!.some(
        (pv) => pv.paperId === paperId && pv.version === ver
      );
      if (!exists) {
        data.paperVersions!.push({
          paperId,
          version: ver,
          sourceUrl: url,
          pdfUrl: url,
          publishedAt: pubDate || new Date().toISOString(),
        });
      }
    };

    const updateAliasMap = (paper: Paper) => {
      map.set(paper.id, paper);
      if (paper.doi) map.set(`doi_${paper.doi.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`, paper);
      if (paper.arxivId) {
        map.set(`arxiv_${paper.arxivId.replace(/[^a-z0-9]/gi, "_")}`, paper);
        map.set(`arxiv_${paper.arxivId.replace(/v\d+$/i, "").replace(/[^a-z0-9]/gi, "_")}`, paper);
      }
      if (paper.semanticScholarId) map.set(`s2_${paper.semanticScholarId.replace(/[^a-z0-9]/gi, "_")}`, paper);
      if (paper.openAlexId) map.set(`oa_${paper.openAlexId.replace(/https?:\/\/openalex\.org\//i, "").replace(/[^a-z0-9]/gi, "_")}`, paper);
      if (paper.crossrefId) map.set(`cr_${paper.crossrefId.replace(/[^a-z0-9]/gi, "_")}`, paper);
      if (paper.fingerprint) map.set(`fp_${paper.fingerprint}`, paper);
      if (paper.canonicalFingerprint) map.set(`fp_${paper.canonicalFingerprint}`, paper);
    };

    for (const p of papers) {
      // Priority lookup: DOI > arXiv > Semantic Scholar > OpenAlex > Crossref > Fingerprint
      let existing: Paper | undefined;
      if (p.doi) existing = map.get(`doi_${p.doi.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`);
      if (!existing && p.arxivId) {
        existing =
          map.get(`arxiv_${p.arxivId.replace(/[^a-z0-9]/gi, "_")}`) ||
          map.get(`arxiv_${p.arxivId.replace(/v\d+$/i, "").replace(/[^a-z0-9]/gi, "_")}`);
      }
      if (!existing && p.semanticScholarId) existing = map.get(`s2_${p.semanticScholarId.replace(/[^a-z0-9]/gi, "_")}`);
      if (!existing && p.openAlexId) existing = map.get(`oa_${p.openAlexId.replace(/https?:\/\/openalex\.org\//i, "").replace(/[^a-z0-9]/gi, "_")}`);
      if (!existing && p.crossrefId) existing = map.get(`cr_${p.crossrefId.replace(/[^a-z0-9]/gi, "_")}`);
      if (!existing && p.fingerprint) existing = map.get(`fp_${p.fingerprint}`);
      if (!existing && p.canonicalFingerprint) existing = map.get(`fp_${p.canonicalFingerprint}`);
      if (!existing) existing = map.get(p.id);

      if (existing) {
        const merged = mergePaperPreprints(existing, p);
        updateAliasMap(merged);
        if (p.id !== existing.id) {
          map.set(p.id, merged);
          canonicalPapers.delete(p.id);
        }
        canonicalPapers.set(merged.id, merged);

        recordVersion(merged.id, p.version || 1, p.pdfUrl || p.arxivUrl, p.publishedAt);
        recordIdentifier(merged.id, "doi", "doi", p.doi);
        recordIdentifier(merged.id, "arxiv", "arxiv", p.arxivId);
        recordIdentifier(merged.id, "semanticscholar", "s2", p.semanticScholarId);
        recordIdentifier(merged.id, "openalex", "openalex", p.openAlexId);
        recordIdentifier(merged.id, "crossref", "crossref", p.crossrefId);
        recordIdentifier(merged.id, "fingerprint", "fingerprint", p.fingerprint || p.canonicalFingerprint);
      } else {
        updateAliasMap(p);
        canonicalPapers.set(p.id, p);

        recordVersion(p.id, p.version || 1, p.pdfUrl || p.arxivUrl, p.publishedAt);
        recordIdentifier(p.id, "doi", "doi", p.doi);
        recordIdentifier(p.id, "arxiv", "arxiv", p.arxivId);
        recordIdentifier(p.id, "semanticscholar", "s2", p.semanticScholarId);
        recordIdentifier(p.id, "openalex", "openalex", p.openAlexId);
        recordIdentifier(p.id, "crossref", "crossref", p.crossrefId);
        recordIdentifier(p.id, "fingerprint", "fingerprint", p.fingerprint || p.canonicalFingerprint);
      }
    }

    data.papers = Array.from(canonicalPapers.values());
    this.schedulePersist();
  }

  async getPaperIdentifiers(paperId: string): Promise<PaperIdentifier[]> {
    const data = this.load();
    return (data.paperIdentifiers || []).filter((pi) => pi.paperId === paperId);
  }

  async getPaperVersions(paperId: string): Promise<PaperVersion[]> {
    const data = this.load();
    return (data.paperVersions || [])
      .filter((pv) => pv.paperId === paperId)
      .sort((a, b) => a.version - b.version);
  }

  async recordPaperDailyHistory(
    paperId: string,
    dailyFeedId: string,
    section: "new" | "paper_of_day" | "recommended" | "top_story" = "new"
  ): Promise<void> {
    const data = this.load();
    data.paperDailyHistory = data.paperDailyHistory || [];
    const exists = data.paperDailyHistory.some(
      (h) => h.paperId === paperId && h.dailyFeedId === dailyFeedId && h.section === section
    );
    if (!exists) {
      data.paperDailyHistory.push({
        paperId,
        dailyFeedId,
        shownAt: new Date().toISOString(),
        section,
      });
      this.schedulePersist();
    }
  }

  async getSurfacedPaperIds(lookbackDays: number = 30): Promise<Set<string>> {
    const data = this.load();
    const set = new Set<string>();
    const cutoff = Date.now() - lookbackDays * 86400000;

    // From paperDailyHistory table
    for (const h of data.paperDailyHistory || []) {
      if (new Date(h.shownAt).getTime() >= cutoff && h.section === "new") {
        set.add(h.paperId);
      }
    }

    // Also from historical daily feeds
    for (const feed of data.dailyFeeds || []) {
      if (new Date(feed.date).getTime() >= cutoff) {
        for (const p of feed.papers || []) {
          set.add(p.id);
          if (p.arxivId) set.add(`arxiv_${p.arxivId.replace(/[^a-z0-9]/gi, "_")}`);
          if (p.fingerprint) set.add(`fp_${p.fingerprint}`);
        }
        if (feed.paperOfDay) {
          set.add(feed.paperOfDay.id);
        }
      }
    }

    return set;
  }

  async getNeverShownAsNewPapers(papers: Paper[], lookbackDays: number = 30): Promise<Paper[]> {
    const surfacedIds = await this.getSurfacedPaperIds(lookbackDays);
    return papers.filter((p) => {
      if (surfacedIds.has(p.id)) return false;
      if (p.arxivId && surfacedIds.has(`arxiv_${p.arxivId.replace(/[^a-z0-9]/gi, "_")}`)) return false;
      if (p.fingerprint && surfacedIds.has(`fp_${p.fingerprint}`)) return false;
      return true;
    });
  }

  // --- Paper Chunks ---
  async getPaperChunks(paperId: string): Promise<PaperChunk[]> {
    const data = this.load();
    return data.paperChunks
      .filter((c) => c.paperId === paperId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async savePaperChunks(chunks: PaperChunk[]): Promise<void> {
    const data = this.load();
    const existing = new Set(data.paperChunks.map((c) => `${c.paperId}_${c.chunkIndex}`));
    for (const c of chunks) {
      if (!existing.has(`${c.paperId}_${c.chunkIndex}`)) {
        data.paperChunks.push(c);
        existing.add(`${c.paperId}_${c.chunkIndex}`);
      }
    }
    this.schedulePersist();
  }

  // --- Daily Briefings ---
  async getDailyBriefing(date?: string): Promise<DailyBriefing | null> {
    const data = this.load();
    const targetDate = date || new Date().toISOString().split("T")[0];
    return data.briefings.find((b) => b.date === targetDate) || null;
  }

  async saveDailyBriefing(briefing: DailyBriefing): Promise<void> {
    const data = this.load();
    const idx = data.briefings.findIndex((b) => b.date === briefing.date);
    if (idx !== -1) {
      data.briefings[idx] = briefing;
    } else {
      data.briefings.push(briefing);
    }
    this.schedulePersist();
  }

  // --- User Profile & Habits ---
  async getUserProfile(): Promise<UserProfile> {
    const data = this.load();
    const tz = data.profile.timezone || "Asia/Kolkata";
    const goal = data.profile.dailyGoalMinutes || 25;

    // Derived strictly from real reading sessions
    const dailyMap = getDailyActivityMap(data.readingSessions || [], goal, tz);
    const streaks = calculateStreaks(dailyMap, tz, goal);
    const completedPapers = new Set(
      (data.readingSessions || []).filter((s) => s.completed).map((s) => s.paperId)
    ).size;
    const totalSecs = (data.readingSessions || []).reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);

    data.profile.readingStreak = streaks.currentStreak;
    data.profile.longestStreak = streaks.longestStreak;
    data.profile.papersReadCount = completedPapers;
    data.profile.totalReadingMinutes = Math.round(totalSecs / 60);
    if (!data.profile.timezone) data.profile.timezone = tz;
    if (!data.profile.createdAt) data.profile.createdAt = "2026-09-01T00:00:00.000Z";

    return data.profile;
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const data = this.load();
    data.profile = {
      ...data.profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.schedulePersist();
    return this.getUserProfile();
  }

  async getUserPreferences(userId?: string): Promise<UserPreferences> {
    const profile = await this.getUserProfile();
    const depth = normalizeTechnicalDepth(profile.difficultyPreference);
    return {
      userId: profile.id,
      dailyGoalMinutes: profile.dailyGoalMinutes || 25,
      technicalDepth: depth,
      interestedTopics: profile.interestedTopics || [],
      timezone: profile.timezone || "Asia/Kolkata",
      morningBriefingTime: profile.morningBriefingTime || "08:30",
      weekendDigestEnabled: profile.weekendNotificationsEnabled ?? true,
      desktopNotificationsEnabled: profile.desktopNotificationsEnabled ?? true,
      soundEnabled: profile.soundEnabled ?? true,
      updatedAt: profile.updatedAt || new Date().toISOString(),
    };
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const profileUpdates: Partial<UserProfile> = {};

    if (updates.dailyGoalMinutes !== undefined) {
      profileUpdates.dailyGoalMinutes = updates.dailyGoalMinutes;
    }
    if (updates.technicalDepth !== undefined) {
      const norm = normalizeTechnicalDepth(updates.technicalDepth);
      profileUpdates.difficultyPreference = norm === "accessible" ? "Beginner" : norm === "rigorous" ? "Advanced" : "Intermediate";
    }
    if (updates.interestedTopics !== undefined) {
      profileUpdates.interestedTopics = updates.interestedTopics;
    }
    if (updates.timezone !== undefined) {
      profileUpdates.timezone = updates.timezone;
    }
    if (updates.morningBriefingTime !== undefined) {
      profileUpdates.morningBriefingTime = updates.morningBriefingTime;
    }
    if (updates.weekendDigestEnabled !== undefined) {
      profileUpdates.weekendNotificationsEnabled = updates.weekendDigestEnabled;
    }
    if (updates.desktopNotificationsEnabled !== undefined) {
      profileUpdates.desktopNotificationsEnabled = updates.desktopNotificationsEnabled;
    }
    if (updates.soundEnabled !== undefined) {
      profileUpdates.soundEnabled = updates.soundEnabled;
    }

    await this.updateUserProfile(profileUpdates);
    return this.getUserPreferences(userId);
  }

  // --- Reading Sessions & Event Tracking ---
  async startReadingSession(
    userId: string,
    paperId: string,
    paperTitle: string,
    requestedSessionId?: string
  ): Promise<ReadingSession> {
    const data = this.load();
    const nowIso = new Date().toISOString();
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

    // Check for recent active session for this paper to prevent duplicates
    const existing = data.readingSessions.find(
      (s) =>
        s.userId === userId &&
        s.paperId === paperId &&
        s.status !== "completed" &&
        new Date(s.lastUpdatedAt).getTime() > twoHoursAgo
    );

    if (existing) {
      existing.lastUpdatedAt = nowIso;
      this.schedulePersist();
      return existing;
    }

    const newSession: ReadingSession = {
      id: requestedSessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      paperId,
      paperTitle,
      timeSpentSeconds: 0,
      durationSeconds: 0,
      progressPercent: 0,
      status: "started",
      completed: false,
      startedAt: nowIso,
      lastHeartbeatAt: nowIso,
      lastUpdatedAt: nowIso,
    };

    data.readingSessions.push(newSession);
    this.schedulePersist();
    return newSession;
  }

  async recordSessionHeartbeat(
    sessionId: string,
    deltaSeconds: number,
    progressPercent: number = 0,
    explicitCompleted?: boolean
  ): Promise<ReadingSession | null> {
    const data = this.load();
    const nowIso = new Date().toISOString();

    let session = data.readingSessions.find((s) => s.id === sessionId);
    if (!session) {
      // Fallback: search for recent session for user
      session = data.readingSessions.find(
        (s) => s.userId === data.profile.id && s.status !== "completed"
      );
    }

    if (!session) return null;

    // Guard against unrealistic jumps (max 60 seconds per heartbeat)
    const validDelta = Math.max(0, Math.min(60, deltaSeconds));
    session.timeSpentSeconds = (session.timeSpentSeconds || 0) + validDelta;
    session.durationSeconds = session.timeSpentSeconds;
    session.progressPercent = Math.max(session.progressPercent || 0, Math.min(100, progressPercent));
    session.lastHeartbeatAt = nowIso;
    session.lastUpdatedAt = nowIso;
    session.endedAt = nowIso;

    if (explicitCompleted !== undefined) {
      session.completed = explicitCompleted;
      if (explicitCompleted) {
        session.status = "completed";
        session.completedAt = session.completedAt || nowIso;
      } else {
        session.status = "in_progress";
      }
    } else if (session.progressPercent >= 85) {
      // Auto-mark completed if read deeply
      session.completed = true;
      session.status = "completed";
      session.completedAt = session.completedAt || nowIso;
    } else if (session.timeSpentSeconds > 0 && !session.completed) {
      session.status = "in_progress";
    }

    this.schedulePersist();
    return session;
  }

  async completeReadingSession(sessionId: string, paperId?: string): Promise<ReadingSession | null> {
    const data = this.load();
    const nowIso = new Date().toISOString();

    let session = data.readingSessions.find(
      (s) => s.id === sessionId || (paperId && s.paperId === paperId)
    );

    if (!session && paperId) {
      const paper = data.papers.find((p) => p.id === paperId);
      session = {
        id: sessionId || `sess_${Date.now()}`,
        userId: data.profile.id,
        paperId,
        paperTitle: paper?.title || "Research Preprint",
        timeSpentSeconds: 120,
        durationSeconds: 120,
        progressPercent: 100,
        status: "completed",
        completed: true,
        completedAt: nowIso,
        startedAt: nowIso,
        lastUpdatedAt: nowIso,
      };
      data.readingSessions.push(session);
    }

    if (session) {
      session.completed = true;
      session.status = "completed";
      session.progressPercent = Math.max(session.progressPercent || 0, 100);
      session.completedAt = session.completedAt || nowIso;
      session.lastUpdatedAt = nowIso;
      session.endedAt = nowIso;
      this.schedulePersist();
      return session;
    }

    return null;
  }

  async endReadingSession(sessionId: string): Promise<void> {
    const data = this.load();
    const session = data.readingSessions.find((s) => s.id === sessionId);
    if (session) {
      session.endedAt = new Date().toISOString();
      session.lastUpdatedAt = new Date().toISOString();
      this.schedulePersist();
    }
  }

  

  async recordReadingActivity(
    paperId: string,
    paperTitle: string,
    timeSpentSeconds: number,
    progressPercent: number,
    completed: boolean = false
  ): Promise<ReadingSession> {
    const data = this.load();
    const nowIso = new Date().toISOString();

    let session = data.readingSessions.find(
      (s) => s.paperId === paperId && s.userId === data.profile.id && s.status !== "completed"
    );

    if (session) {
      session.timeSpentSeconds = (session.timeSpentSeconds || 0) + timeSpentSeconds;
      session.durationSeconds = session.timeSpentSeconds;
      session.progressPercent = Math.max(session.progressPercent || 0, progressPercent);
      if (completed) {
        session.completed = true;
        session.status = "completed";
        session.completedAt = session.completedAt || nowIso;
      }
      session.lastUpdatedAt = nowIso;
      session.endedAt = nowIso;
    } else {
      session = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: data.profile.id,
        paperId,
        paperTitle,
        timeSpentSeconds,
        durationSeconds: timeSpentSeconds,
        progressPercent,
        status: completed ? "completed" : "in_progress",
        completed,
        completedAt: completed ? nowIso : undefined,
        startedAt: nowIso,
        lastUpdatedAt: nowIso,
        endedAt: nowIso,
      };
      data.readingSessions.push(session);
    }

    this.schedulePersist();
    return session;
  }

  async getReadingSessions(userId?: string): Promise<ReadingSession[]> {
    const data = this.load();
    if (userId) {
      return data.readingSessions.filter((s) => s.userId === userId);
    }
    return data.readingSessions;
  }

  async getTodayReadingMinutes(): Promise<number> {
    const data = this.load();
    const tz = data.profile.timezone || "Asia/Kolkata";
    const todayStr = getLocalDateString(new Date(), tz);
    const todaySessions = (data.readingSessions || []).filter((s) =>
      getLocalDateString(s.startedAt || s.lastUpdatedAt, tz) === todayStr
    );
    const totalSecs = todaySessions.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);
    return Math.round(totalSecs / 60);
  }

  async getWeeklyReadingActivity(): Promise<{ day: string; date: string; minutes: number }[]> {
    const data = this.load();
    const tz = data.profile.timezone || "Asia/Kolkata";
    const goal = data.profile.dailyGoalMinutes || 25;
    const dailyMap = getDailyActivityMap(data.readingSessions || [], goal, tz);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { day: string; date: string; minutes: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d, tz);
      const [year, month, day] = dateStr.split("-").map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      const existing = dailyMap.get(dateStr);
      result.push({
        day: dayNames[dayOfWeek],
        date: dateStr,
        minutes: existing ? existing.minutes : 0,
      });
    }

    return result;
  }

  async getTopicAffinity(): Promise<{ topic: string; count: number; pct: number }[]> {
    const data = this.load();
    const counts = new Map<string, number>();

    for (const session of data.readingSessions) {
      const paper = data.papers.find((p) => p.id === session.paperId);
      if (paper) {
        const topic = paper.primaryCategory || "General AI";
        counts.set(topic, (counts.get(topic) || 0) + 1);
      }
    }

    for (const note of data.notes) {
      const topic = note.topic || "General AI";
      counts.set(topic, (counts.get(topic) || 0) + 1);
    }

    const total = Array.from(counts.values()).reduce((sum, c) => sum + c, 0);
    if (total === 0) return [];

    return Array.from(counts.entries())
      .map(([topic, count]) => ({
        topic,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  // --- Bookmarks ---
  async getBookmarks(): Promise<Bookmark[]> {
    const data = this.load();
    return data.bookmarks.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async addBookmark(b: Omit<Bookmark, "id" | "createdAt">): Promise<Bookmark> {
    const data = this.load();
    const existing = data.bookmarks.find((item) => item.itemId === b.itemId);
    if (existing) return existing;

    const newBookmark: Bookmark = {
      ...b,
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    data.bookmarks.unshift(newBookmark);
    this.schedulePersist();
    return newBookmark;
  }

  async removeBookmark(itemId: string): Promise<void> {
    const data = this.load();
    data.bookmarks = data.bookmarks.filter((b) => b.itemId !== itemId);
    this.schedulePersist();
  }

  // --- Notes & Highlights ---
  async getNotes(filter?: { paperId?: string; topic?: string }): Promise<Note[]> {
    const data = this.load();
    let res = [...data.notes];
    if (filter?.paperId) {
      res = res.filter((n) => n.paperId === filter.paperId);
    }
    if (filter?.topic) {
      res = res.filter((n) => n.topic.toLowerCase() === filter.topic!.toLowerCase());
    }
    return res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addNote(note: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<Note> {
    const data = this.load();
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    data.notes.unshift(newNote);
    this.schedulePersist();
    return newNote;
  }

  async deleteNote(id: string): Promise<void> {
    const data = this.load();
    data.notes = data.notes.filter((n) => n.id !== id);
    this.schedulePersist();
  }

  // --- Ingestion Logs ---
  async getIngestionLogs(): Promise<IngestionLog[]> {
    const data = this.load();
    return data.ingestionLogs.sort(
      (a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime()
    );
  }

  async logIngestion(log: Omit<IngestionLog, "id" | "ranAt">): Promise<IngestionLog> {
    const data = this.load();
    const newLog: IngestionLog = {
      ...log,
      id: `log_${Date.now()}`,
      ranAt: new Date().toISOString(),
    };
    data.ingestionLogs.unshift(newLog);
    if (data.ingestionLogs.length > 100) {
      data.ingestionLogs = data.ingestionLogs.slice(0, 100);
    }
    this.schedulePersist();
    return newLog;
  }

  // --- Historical Snapshot Seeding ---
  private seedHistoricalSnapshotsIfNeeded() {
    if (!this.data) return;
    if (this.data.dailyFeeds && this.data.dailyFeeds.length >= 10) return;

    const existingDates = new Set((this.data.dailyFeeds || []).map((f) => f.date));
    const now = Date.now();
    const groups = this.data.articleGroups || [];
    const papers = this.data.papers || [];

    if (groups.length === 0 || papers.length === 0) return;

    for (let i = 0; i < 10; i++) {
      const d = new Date(now - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      if (existingDates.has(dateStr)) continue;

      const leadStory = groups[i % groups.length] || null;
      const startG = (i * 2) % Math.max(1, groups.length - 3);
      const dayStories = groups.slice(startG, startG + 3);

      const startP = (i * 2) % Math.max(1, papers.length - 3);
      const dayPapers = papers.slice(startP, startP + 3);
      const paperOfDay = papers[(i + 1) % papers.length] || null;

      const snapshot: DailyFeedSnapshot = {
        id: `feed_${dateStr}`,
        date: dateStr,
        timezone: this.data.profile.timezone || "Asia/Kolkata",
        generatedAt: d.toISOString(),
        status: i === 0 ? "active" : "archived",
        title: `Daily Briefing · ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        summary: `Daily research dispatch with ${dayStories.length} stories and ${dayPapers.length} research papers.`,
        synthesis: `Key developments in ${leadStory?.topic || "frontier AI"}: model reasoning scaling, architectural optimizations, and open-source releases.`,
        leadStory,
        stories: dayStories,
        papers: dayPapers,
        paperOfDay,
        topicCounts: [
          { topic: "LLMs", count: dayStories.length + 2 },
          { topic: "Agents", count: dayPapers.length },
          { topic: "Reasoning", count: 3 },
          { topic: "Infrastructure", count: 2 },
        ],
      };

      this.data.dailyFeeds.push(snapshot);
    }

    this.data.dailyFeeds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // --- Persistent Favorites (Never Expiring) ---
  async getFavorites(entityType?: string): Promise<UserFavorite[]> {
    const data = this.load();
    let res = [...(data.favorites || [])];
    if (entityType && entityType !== "all") {
      res = res.filter((f) => f.entityType === entityType);
    }
    return res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addFavorite(fav: Omit<UserFavorite, "id" | "createdAt">): Promise<UserFavorite> {
    const data = this.load();
    data.favorites = data.favorites || [];
    const existing = data.favorites.find(
      (f) => f.entityType === fav.entityType && f.entityId === fav.entityId
    );
    if (existing) return existing;

    const newFav: UserFavorite = {
      ...fav,
      id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    data.favorites.unshift(newFav);
    this.schedulePersist();
    return newFav;
  }

  async removeFavorite(entityType: string, entityId: string): Promise<boolean> {
    const data = this.load();
    data.favorites = data.favorites || [];
    const initialLen = data.favorites.length;
    data.favorites = data.favorites.filter(
      (f) => !(f.entityType === entityType && f.entityId === entityId)
    );
    if (data.favorites.length !== initialLen) {
      this.schedulePersist();
      return true;
    }
    return false;
  }

  async isFavorite(entityType: string, entityId: string): Promise<boolean> {
    const data = this.load();
    return (data.favorites || []).some((f) => f.entityType === entityType && f.entityId === entityId);
  }

  // --- Rolling 10-Day Snapshot Archive ---
  async getDailyFeed(date: string): Promise<DailyFeedSnapshot | null> {
    const data = this.load();
    return (data.dailyFeeds || []).find((f) => f.date === date) || null;
  }

  async getDailyFeeds(limit: number = 10): Promise<DailyFeedSnapshot[]> {
    const data = this.load();
    return (data.dailyFeeds || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createOrUpdateDailyFeed(feed: DailyFeedSnapshot): Promise<DailyFeedSnapshot> {
    const data = this.load();
    data.dailyFeeds = data.dailyFeeds || [];
    data.paperDailyHistory = data.paperDailyHistory || [];

    const idx = data.dailyFeeds.findIndex((f) => f.date === feed.date);
    if (idx >= 0) {
      data.dailyFeeds[idx] = feed;
    } else {
      data.dailyFeeds.unshift(feed);
    }

    // Record all surfaced papers into daily history for new-item suppression
    const shownAt = feed.generatedAt || new Date().toISOString();
    if (feed.papers) {
      for (const p of feed.papers) {
        const exists = data.paperDailyHistory.some(
          (h) => h.paperId === p.id && h.dailyFeedId === feed.id && h.section === "new"
        );
        if (!exists) {
          data.paperDailyHistory.push({
            paperId: p.id,
            dailyFeedId: feed.id,
            shownAt,
            section: "new",
          });
        }
      }
    }
    if (feed.paperOfDay) {
      const exists = data.paperDailyHistory.some(
        (h) => h.paperId === feed.paperOfDay!.id && h.dailyFeedId === feed.id && h.section === "paper_of_day"
      );
      if (!exists) {
        data.paperDailyHistory.push({
          paperId: feed.paperOfDay.id,
          dailyFeedId: feed.id,
          shownAt,
          section: "paper_of_day",
        });
      }
    }

    this.schedulePersist();
    return feed;
  }

  async cleanDailyHistoryOlderThan(days: number = 10): Promise<number> {
    const data = this.load();
    data.dailyFeeds = data.dailyFeeds || [];
    const cutoff = Date.now() - days * 86400000;
    const initialLen = data.dailyFeeds.length;
    data.dailyFeeds = data.dailyFeeds.filter(
      (f) => new Date(f.date).getTime() >= cutoff
    );
    // Also prune briefings older than retention
    if (data.briefings) {
      data.briefings = data.briefings.filter(
        (b) => new Date(b.date).getTime() >= cutoff
      );
    }
    const removedCount = initialLen - data.dailyFeeds.length;
    if (removedCount > 0) {
      this.schedulePersist();
    }
    return removedCount;
  }

  // --- Dynamic Visual Assets ---
  async getVisualAsset(entityType: string, entityId: string): Promise<VisualAsset | null> {
    const data = this.load();
    return (data.visualAssets || []).find(
      (v) => v.entityType === entityType && v.entityId === entityId
    ) || null;
  }

  async saveVisualAsset(asset: VisualAsset): Promise<VisualAsset> {
    const data = this.load();
    data.visualAssets = data.visualAssets || [];
    const idx = data.visualAssets.findIndex(
      (v) => v.entityType === asset.entityType && v.entityId === asset.entityId
    );
    if (idx >= 0) {
      data.visualAssets[idx] = { ...data.visualAssets[idx], ...asset, updatedAt: new Date().toISOString() };
    } else {
      data.visualAssets.push(asset);
    }
    this.schedulePersist();
    return asset;
  }

  async getAllVisualAssets(): Promise<VisualAsset[]> {
    const data = this.load();
    return data.visualAssets || [];
  }
}

export const db = new StorageRepository();
