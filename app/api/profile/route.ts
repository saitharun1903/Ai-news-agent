import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const profile = await db.getUserProfile();
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  try {
    const updates = await req.json();
    const updated = await db.updateUserProfile(updates);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (
      body.dailyGoalMinutes !== undefined ||
      body.morningBriefingTime !== undefined ||
      body.interestedTopics !== undefined ||
      body.difficultyPreference !== undefined ||
      body.desktopNotificationsEnabled !== undefined ||
      body.weekendNotificationsEnabled !== undefined ||
      body.soundEnabled !== undefined
    ) {
      const updated = await db.updateUserProfile(body);
      return NextResponse.json(updated);
    }

    const { paperId, paperTitle, seconds, progress, completed } = body;
    const session = await db.recordReadingActivity(
      paperId,
      paperTitle,
      seconds || 60,
      progress || 10,
      completed || false
    );
    const profile = await db.getUserProfile();
    return NextResponse.json({ session, profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
