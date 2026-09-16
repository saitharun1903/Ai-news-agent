import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (date) {
      const feed = await db.getDailyFeed(date);
      if (!feed) {
        return NextResponse.json({ error: `No archive snapshot for ${date}` }, { status: 404 });
      }
      return NextResponse.json(feed);
    }

    const feeds = await db.getDailyFeeds(10);
    return NextResponse.json(feeds);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
