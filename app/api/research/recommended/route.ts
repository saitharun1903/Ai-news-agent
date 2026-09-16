import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const profile = await db.getUserProfile();
    const sessions = await db.getReadingSessions();
    const favorites = await db.getFavorites("paper");

    // Gather topics user has read or favorited
    const interestedTopics = new Set<string>(profile.interestedTopics.map((t) => t.toLowerCase()));
    for (const fav of favorites) {
      if (fav.category) interestedTopics.add(fav.category.toLowerCase());
    }

    const allPapers = await db.getPapers({ limit: 60 });

    const scored = allPapers.map((paper) => {
      let score = paper.upvotes * 2 + paper.citationCount;
      const cat = paper.primaryCategory.toLowerCase();
      if (Array.from(interestedTopics).some((t) => cat.includes(t) || t.includes(cat))) {
        score += 50;
      }
      if (paper.difficulty === profile.difficultyPreference) {
        score += 20;
      }
      return { paper, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return NextResponse.json(scored.slice(0, limit).map((s) => s.paper));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
