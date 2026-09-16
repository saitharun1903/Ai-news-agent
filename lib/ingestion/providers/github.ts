import { RepositoryMetadata, RepositoryProvider } from "./types";

export interface GithubRepoInfo extends RepositoryMetadata {}

export class GithubRepositoryProvider implements RepositoryProvider {
  name = "GitHub";
  enabled = process.env.GITHUB_ENABLED !== "false";

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ResearchPulse/1.0",
    };
    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async getRepository(repoUrlOrName: string): Promise<RepositoryMetadata | null> {
    try {
      let owner = "";
      let name = "";

      if (repoUrlOrName.includes("github.com/")) {
        const match = repoUrlOrName.match(/github\.com\/([^/]+)\/([^/#?]+)/);
        if (!match) return null;
        owner = match[1];
        name = match[2].replace(/\.git$/, "");
      } else if (repoUrlOrName.includes("/")) {
        const parts = repoUrlOrName.split("/");
        owner = parts[0].trim();
        name = parts[1].replace(/\.git$/, "").trim();
      } else {
        return null;
      }

      const apiUrl = `https://api.github.com/repos/${owner}/${name}`;
      const res = await fetch(apiUrl, {
        headers: this.getHeaders(),
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return null;
      const data = await res.json();

      return {
        repoUrl: data.html_url,
        name: data.name,
        owner: data.owner?.login || owner,
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        language: data.language,
        description: data.description || "",
        topics: data.topics || [],
        updatedAt: data.updated_at,
      };
    } catch (err: any) {
      console.warn(`[GitHub] Lookup failed for ${repoUrlOrName}:`, err.message);
      return null;
    }
  }

  async searchRepositories(query: string, limit: number = 8): Promise<RepositoryMetadata[]> {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
        query
      )}&sort=stars&order=desc&per_page=${limit}`;

      const res = await fetch(url, {
        headers: this.getHeaders(),
        next: { revalidate: 7200 },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data.items)) return [];

      return data.items.map((item: any) => ({
        repoUrl: item.html_url,
        name: item.name,
        owner: item.owner?.login || "",
        stars: item.stargazers_count || 0,
        forks: item.forks_count || 0,
        language: item.language,
        description: item.description || "",
        topics: item.topics || [],
        updatedAt: item.updated_at,
      }));
    } catch (err: any) {
      console.warn("[GitHub] Search failed:", err.message);
      return [];
    }
  }
}

export const githubProvider = new GithubRepositoryProvider();

export async function fetchGithubRepoMetadata(repoUrl: string): Promise<GithubRepoInfo | null> {
  return githubProvider.getRepository(repoUrl);
}

export async function fetchTrendingResearchRepos(limit: number = 8): Promise<GithubRepoInfo[]> {
  const query = "topic:machine-learning+OR+topic:distributed-systems+OR+topic:compilers+OR+topic:security";
  return githubProvider.searchRepositories(query, limit);
}
