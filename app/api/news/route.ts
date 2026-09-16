import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query") || searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const format = searchParams.get("format"); // "groups" or "articles"

    const cacheKey = `news:${format || "groups"}:${category || "all"}:${query || ""}:${limit}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("X-Cache", "HIT");
      return res;
    }

    if (format === "articles") {
      const articles = await db.getArticles({ category: category || undefined, search: query || undefined, limit });
      await cacheSet(cacheKey, articles, 300);
      const res = NextResponse.json(articles);
      res.headers.set("X-Cache", "MISS");
      return res;
    }

    const groups = await db.getArticleGroups({ topic: category || undefined, search: query || undefined, limit });
    await cacheSet(cacheKey, groups, 300);
    const res = NextResponse.json(groups);
    res.headers.set("X-Cache", "MISS");
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
