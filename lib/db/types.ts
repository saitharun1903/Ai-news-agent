export type TrustLevel = "TIER_1_LAB" | "TIER_1_ACADEMIC" | "TIER_2_TECH_PRESS" | "TIER_3_COMMUNITY";

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Source {
  id: string;
  name: string;
  type: "rss" | "arxiv" | "huggingface" | "hackernews" | "lab";
  url: string;
  rssUrl?: string;
  trustLevel: TrustLevel;
  category: string;
  enabled: boolean;
  lastFetchedAt?: string;
  errorCount: number;
}

export interface ArticleSourceRef {
  sourceName: string;
  url: string;
  title: string;
  publishedAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  canonicalTitle?: string;
  url: string;
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  summary: string;
  content?: string;
  publishedAt: string;
  fetchedAt: string;
  updatedAt?: string;
  category: string;
  topics?: string[];
  entities?: string[];
  importanceScore: number;
  readTimeMinutes: number;
  groupId?: string;
  eventGroupId?: string;
  author?: string;
  imageUrl?: string;
  originalImageUrl?: string;
  createdAt?: string;
}

export interface ArticleGroup {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  topic: string;
  importanceScore: number;
  articleCount: number;
  sources: ArticleSourceRef[];
  publishedAt: string;
  createdAt: string;
}

export interface PrerequisiteConcept {
  concept: string;
  description: string;
  status: "Mastered" | "Needs Review";
  briefExplanation: string;
}

export interface PaperSection {
  id: string;
  title: string;
  pageNumber?: number;
  content: string;
}

export interface PaperIdentifier {
  paperId: string;
  provider: string;
  providerId: string;
  identifierType: "doi" | "arxiv" | "s2" | "openalex" | "crossref" | "fingerprint";
  identifierValue: string;
}

export interface PaperVersion {
  paperId: string;
  version: number;
  sourceUrl?: string;
  pdfUrl?: string;
  publishedAt: string;
}

export interface PaperDailyHistory {
  paperId: string;
  dailyFeedId: string;
  shownAt: string;
  section: "new" | "paper_of_day" | "recommended" | "top_story";
}

export interface Paper {
  id: string;
  canonicalTitle?: string;
  arxivId: string;
  slug: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  publicationDate?: string;
  updatedDate?: string;
  year?: number;
  domain?: string;
  subdomains?: string[];
  keywords?: string[];
  source?: string;
  sourceUrl?: string;
  primaryCategory: string;
  categories: string[];
  pdfUrl: string;
  arxivUrl: string;
  publisherUrl?: string;
  githubUrl?: string;
  codeUrl?: string;
  projectUrl?: string;
  datasetUrl?: string;
  demoUrl?: string;
  doiUrl?: string;
  doi?: string;
  semanticScholarId?: string;
  openAlexId?: string;
  crossrefId?: string;
  fingerprint?: string;
  canonicalFingerprint?: string;
  version?: number;
  versions?: { version: number; date: string; url?: string }[];
  shownInDailyDates?: string[];
  figureUrl?: string;
  imageUrl?: string;
  upvotes: number;
  citationCount: number;
  referenceCount?: number;
  openAccess?: boolean;
  difficulty: DifficultyLevel;
  readingTimeMinutes: number;
  whyItMatters: string;
  coreContribution: string;
  method: string;
  results: string;
  limitations: string;
  prerequisites: PrerequisiteConcept[];
  recommendationReasons: string[];
  isPaperOfDay: boolean;
  paperOfDayDate?: string;
  outline?: PaperSection[];
  discoveryCategory: "trending" | "new" | "important" | "practical" | "foundational";
  createdAt?: string;
  updatedAt?: string;
  lastVerifiedAt?: string;
}

export type ResearchPaper = Paper;

export interface PaperChunk {
  id: string;
  paperId: string;
  chunkIndex: number;
  sectionTitle: string;
  content: string;
  keywords: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  timezone?: string;
  readingStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalReadingMinutes: number;
  papersReadCount: number;
  articlesReadCount: number;
  difficultyPreference: DifficultyLevel;
  interestedTopics: string[];
  dailyGoalMinutes: number;
  morningBriefingTime: string;
  desktopNotificationsEnabled: boolean;
  weekendNotificationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface ReadingSession {
  id: string;
  userId: string;
  paperId: string;
  paperTitle: string;
  timeSpentSeconds: number;
  durationSeconds?: number;
  progressPercent: number;
  status: "started" | "in_progress" | "completed";
  completed: boolean;
  startedAt: string;
  lastUpdatedAt: string;
  lastHeartbeatAt?: string;
  endedAt?: string;
  completedAt?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  itemType: "paper" | "article";
  itemId: string;
  title: string;
  url: string;
  category?: string;
  createdAt: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  entityType: "article" | "paper" | "project" | "topic";
  entityId: string;
  title: string;
  url: string;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  paperId: string;
  paperTitle: string;
  sectionTitle?: string;
  highlightedText?: string;
  note: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyBriefing {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  synthesis: string; // "What changed today?"
  topStories: ArticleGroup[];
  recommendedPapers: Paper[];
  paperOfDay: Paper | null;
  publishedAt: string;
}

export interface DailyFeedSnapshot {
  id: string; // e.g. "feed_2026-09-16"
  date: string; // YYYY-MM-DD
  timezone: string; // e.g. "Asia/Kolkata"
  generatedAt: string;
  status: "active" | "archived";
  title: string;
  summary: string;
  synthesis: string;
  leadStory: ArticleGroup | null;
  stories: ArticleGroup[];
  papers: Paper[];
  paperOfDay: Paper | null;
  topicCounts: { topic: string; count: number }[];
}

export interface IngestionLog {
  id: string;
  jobType: string;
  status: "success" | "partial" | "error";
  recordsProcessed: number;
  durationMs: number;
  error?: string;
  ranAt: string;
}

export type VisualSourceType = "official" | "project" | "paper_figure" | "generated";

export interface VisualAsset {
  id: string;
  entityType: "article" | "paper" | "project" | "topic" | "group" | "articleGroup";
  entityId: string;
  sourceType: VisualSourceType;
  url: string;
  prompt?: string;
  altText: string;
  width: number;
  height: number;
  visualStyle?: string;
  contentHash: string;
  status: "ready" | "pending" | "failed";
  generatedAt: string;
  updatedAt?: string;
}
