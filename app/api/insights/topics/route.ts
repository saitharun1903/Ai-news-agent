import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AnalyticsService } from "@/lib/analytics";

export const revalidate = 0;

export async function GET() {
  try {
    const profile = await db.getUserProfile();
    const topics = await AnalyticsService.getTopicAffinity(profile.id);
    return NextResponse.json(topics);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
