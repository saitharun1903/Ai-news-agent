import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || searchParams.get("topic");
    const query = searchParams.get("query") || searchParams.get("q");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const papers = await db.getPapers({
      category: category || undefined,
      query: query || undefined,
      difficulty: difficulty || undefined,
      limit,
    });

    return NextResponse.json(papers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
