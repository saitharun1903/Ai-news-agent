import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLunorBusinessDate, LUNOR_DEFAULT_TIMEZONE } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const timezone = request.nextUrl.searchParams.get("timezone") || LUNOR_DEFAULT_TIMEZONE;
    const businessDate = getLunorBusinessDate(new Date(), timezone);

    // Query daily feed for today's exact business date in IST
    const feed = await db.getDailyFeed(businessDate, timezone);

    // If today's edition is not ready yet, NEVER silently return yesterday's content
    if (!feed) {
      // Calculate yesterday's date for archive navigation reference
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayDate = getLunorBusinessDate(yesterday, timezone);

      return NextResponse.json({
        status: "pending",
        date: businessDate,
        timezone,
        message: "Today's edition is being prepared",
        feed: null,
        yesterdayArchiveDate: yesterdayDate,
        archiveUrl: `/archive/${yesterdayDate}`,
      });
    }

    return NextResponse.json({
      status: "ready",
      date: feed.date,
      timezone: feed.timezone,
      generatedAt: feed.generatedAt,
      feed,
      leadStory: feed.leadStory,
      paperOfDay: feed.paperOfDay,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
