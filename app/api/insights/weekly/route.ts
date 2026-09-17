import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AnalyticsService } from "@/lib/analytics";
import { getEffectiveUserId } from "@/lib/supabase/server";

export const revalidate = 0;

export async function GET() {
  try {
    const userId = await getEffectiveUserId();
    const profile = await db.getUserProfile(userId);
    const sessions = await db.getReadingSessions(profile.id);
    const weekly = AnalyticsService.getWeeklyActivity(
      sessions,
      profile.dailyGoalMinutes || 25,
      profile.timezone || "Asia/Kolkata"
    );
    return NextResponse.json(weekly);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
