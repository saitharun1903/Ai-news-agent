import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const papers = await db.getPapers({ limit: 50 });
    // Sort by discoveryCategory === "trending" or upvotes/citations
    papers.sort((a, b) => {
      const isTrendA = a.discoveryCategory === "trending" ? 100 : 0;
      const isTrendB = b.discoveryCategory === "trending" ? 100 : 0;
      const scoreA = isTrendA + a.upvotes * 2 + a.citationCount;
      const scoreB = isTrendB + b.upvotes * 2 + b.citationCount;
      return scoreB - scoreA;
    });

    return NextResponse.json(papers.slice(0, limit));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
