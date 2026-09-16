import { CommunityDiscussion, CommunityProvider } from "./types";

export class XCommunityProvider implements CommunityProvider {
  name = "X";
  enabled = process.env.X_ENABLED === "true" && !!process.env.X_API_KEY;

  async fetchDiscussions(topicOrUrl: string, limit: number = 5): Promise<CommunityDiscussion[]> {
    if (!this.enabled) return [];
    // If configured with legitimate API access, queries search recent tweets endpoint
    return [];
  }

  async getDiscussion(id: string): Promise<CommunityDiscussion | null> {
    if (!this.enabled) return null;
    return null;
  }
}

export const xProvider = new XCommunityProvider();
