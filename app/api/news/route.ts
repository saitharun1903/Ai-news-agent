import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query") || searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const format = searchParams.get("format"); // "groups" or "articles"

    if (format === "articles") {
      const articles = await db.getArticles({ category: category || undefined, search: query || undefined, limit });
      return NextResponse.json(articles);
    }

    const groups = await db.getArticleGroups({ topic: category || undefined, search: query || undefined, limit });
    return NextResponse.json(groups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
