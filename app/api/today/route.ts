import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    let feed = await db.getDailyFeed(todayStr);

    if (!feed) {
      const feeds = await db.getDailyFeeds(1);
      feed = feeds[0] || null;
    }

    const briefing = await db.getDailyBriefing(todayStr);
    const paperOfDay = await db.getPaperOfDay();
    const leadStory = await db.getLeadStory();

    return NextResponse.json({
      date: feed?.date || todayStr,
      feed,
      briefing,
      leadStory,
      paperOfDay,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
