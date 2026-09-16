import { CommunityDiscussion, CommunityProvider } from "./types";

export class RedditCommunityProvider implements CommunityProvider {
  name = "Reddit";
  enabled = process.env.REDDIT_ENABLED === "true";

  async fetchDiscussions(topicOrUrl: string, limit: number = 5): Promise<CommunityDiscussion[]> {
    if (!this.enabled) return [];
    try {
      const subreddit = "programming";
      const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;

      const res = await fetch(url, {
        headers: { "User-Agent": "Lunor/1.0 (academic-community-signals)" },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return [];
      const data = await res.json();
      const posts = data.data?.children || [];

      return posts.map((p: any) => ({
        id: `reddit_${p.data.id}`,
        platform: "reddit" as const,
        title: p.data.title,
        url: `https://reddit.com${p.data.permalink}`,
        commentCount: p.data.num_comments || 0,
        score: p.data.score || 0,
        publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
        author: p.data.author,
        summary: `Community discussion on r/${p.data.subreddit} with ${p.data.score} upvotes and ${p.data.num_comments} comments.`,
      }));
    } catch {
      return [];
    }
  }

  async getDiscussion(id: string): Promise<CommunityDiscussion | null> {
    if (!this.enabled) return null;
    return null;
  }
}

export const redditProvider = new RedditCommunityProvider();
