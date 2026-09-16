import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AnalyticsService } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await db.getUserProfile();
    const [sessions, favorites, bookmarks, notes, analytics] = await Promise.all([
      db.getReadingSessions(profile.id),
      db.getFavorites(),
      db.getBookmarks(),
      db.getNotes(),
      AnalyticsService.getSummary(profile.id),
    ]);

    const exportData = {
      app: "Lunor",
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        bio: profile.bio || "",
        timezone: profile.timezone,
        memberSince: profile.createdAt,
        dailyGoalMinutes: profile.dailyGoalMinutes,
        difficultyPreference: profile.difficultyPreference,
        interestedTopics: profile.interestedTopics,
      },
      analytics: {
        currentStreak: analytics.currentStreak,
        longestStreak: analytics.longestStreak,
        totalReadingMinutes: analytics.totalReadingMinutes,
        totalPapersRead: analytics.papersRead,
      },
      readingSessions: sessions,
      favorites,
      readingList: bookmarks,
      notes,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lunor-archive-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
