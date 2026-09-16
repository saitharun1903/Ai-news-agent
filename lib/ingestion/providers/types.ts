import { Article, Paper } from "@/lib/db/types";

export interface ResearchFetchOptions {
  limit?: number;
  domain?: string;
  query?: string;
  sortBy?: "submittedDate" | "relevance" | "citationCount";
}

export interface ResearchProvider {
  name: string;
  enabled: boolean;
  fetchLatest(options?: ResearchFetchOptions): Promise<Paper[]>;
  search(query: string, options?: ResearchFetchOptions): Promise<Paper[]>;
  getPaper(id: string): Promise<Paper | null>;
  getRelatedPapers(id: string): Promise<Paper[]>;
  getCitations(id: string): Promise<{ citationCount: number; references?: string[] }>;
}

export interface NewsFetchOptions {
  limit?: number;
  category?: string;
  query?: string;
}

export interface NewsProvider {
  name: string;
  enabled: boolean;
  fetchLatest(options?: NewsFetchOptions): Promise<Article[]>;
  search(query: string): Promise<Article[]>;
  getArticle(id: string): Promise<Article | null>;
}

export interface RepositoryMetadata {
  repoUrl: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language?: string;
  topics: string[];
  updatedAt: string;
}

export interface RepositoryProvider {
  name: string;
  enabled: boolean;
  getRepository(repoUrlOrName: string): Promise<RepositoryMetadata | null>;
  searchRepositories(query: string, limit?: number): Promise<RepositoryMetadata[]>;
}

export interface CommunityDiscussion {
  id: string;
  platform: "hackernews" | "reddit" | "x";
  title: string;
  url: string;
  commentCount: number;
  score: number;
  publishedAt: string;
  author?: string;
  summary?: string;
  topComments?: { author: string; text: string; score: number }[];
}

export interface CommunityProvider {
  name: string;
  enabled: boolean;
  fetchDiscussions(topicOrUrl: string, limit?: number): Promise<CommunityDiscussion[]>;
  getDiscussion(id: string): Promise<CommunityDiscussion | null>;
}
