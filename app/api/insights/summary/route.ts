import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AnalyticsService } from "@/lib/analytics";
import { getEffectiveUserId } from "@/lib/supabase/server";

export const revalidate = 0;

export async function GET() {
  try {
    const userId = await getEffectiveUserId();
    const profile = await db.getUserProfile(userId);
    const summary = await AnalyticsService.getSummary(profile.id);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
