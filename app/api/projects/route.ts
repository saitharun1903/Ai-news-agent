import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchTrendingResearchRepos } from "@/lib/ingestion/providers/github";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Get papers with verified GitHub repositories
    const papers = await db.getPapers({ limit: 100 });
    const papersWithCode = papers
      .filter((p) => p.githubUrl && p.githubUrl.includes("github.com/"))
      .slice(0, limit);

    // Also fetch trending research repositories from GitHub
    let trendingRepos: any[] = [];
    try {
      trendingRepos = await fetchTrendingResearchRepos(8);
    } catch {
      trendingRepos = [];
    }

    return NextResponse.json({
      papersWithCode,
      trendingRepositories: trendingRepos,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
