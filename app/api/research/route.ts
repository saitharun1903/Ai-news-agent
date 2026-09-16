import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || searchParams.get("topic");
    const query = searchParams.get("query") || searchParams.get("q");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const cacheKey = `research:feed:${category || "all"}:${query || ""}:${difficulty || "all"}:${limit}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("X-Cache", "HIT");
      return res;
    }

    const papers = await db.getPapers({
      category: category || undefined,
      query: query || undefined,
      difficulty: difficulty || undefined,
      limit,
    });

    await cacheSet(cacheKey, papers, 300);
    const res = NextResponse.json(papers);
    res.headers.set("X-Cache", "MISS");
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
