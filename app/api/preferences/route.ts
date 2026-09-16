import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeTechnicalDepth } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preferences = await db.getUserPreferences();
    return NextResponse.json(preferences);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate dailyGoalMinutes
    if (body.dailyGoalMinutes !== undefined) {
      const mins = Number(body.dailyGoalMinutes);
      if (!Number.isFinite(mins) || mins < 5 || mins > 360) {
        return NextResponse.json(
          { error: "dailyGoalMinutes must be a positive integer between 5 and 360 minutes" },
          { status: 400 }
        );
      }
      body.dailyGoalMinutes = Math.round(mins);
    }

    // 2. Validate morningBriefingTime
    if (body.morningBriefingTime !== undefined) {
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (typeof body.morningBriefingTime !== "string" || !timeRegex.test(body.morningBriefingTime)) {
        return NextResponse.json(
          { error: "morningBriefingTime must be a valid 24-hour time in HH:mm format (00:00 - 23:59)" },
          { status: 400 }
        );
      }
    }

    // 3. Validate timezone
    if (body.timezone !== undefined) {
      if (typeof body.timezone !== "string" || body.timezone.trim().length === 0) {
        return NextResponse.json(
          { error: "timezone must be a non-empty string" },
          { status: 400 }
        );
      }
      try {
        new Intl.DateTimeFormat(undefined, { timeZone: body.timezone });
      } catch {
        return NextResponse.json(
          { error: `Invalid IANA timezone name: "${body.timezone}"` },
          { status: 400 }
        );
      }
    }

    // 4. Validate technicalDepth
    if (body.technicalDepth !== undefined) {
      const allowed = ["accessible", "intermediate", "rigorous", "all", "introductory", "advanced", "beginner"];
      if (typeof body.technicalDepth !== "string" || !allowed.includes(body.technicalDepth.toLowerCase())) {
        return NextResponse.json(
          { error: 'technicalDepth must be one of: "accessible", "intermediate", "rigorous", "all"' },
          { status: 400 }
        );
      }
      body.technicalDepth = normalizeTechnicalDepth(body.technicalDepth);
    }

    // 5. Validate interestedTopics
    if (body.interestedTopics !== undefined) {
      if (!Array.isArray(body.interestedTopics) || body.interestedTopics.some((t: any) => typeof t !== "string")) {
        return NextResponse.json(
          { error: "interestedTopics must be an array of topic strings" },
          { status: 400 }
        );
      }
    }

    // 6. Validate boolean notification preferences
    if (body.weekendDigestEnabled !== undefined && typeof body.weekendDigestEnabled !== "boolean") {
      return NextResponse.json({ error: "weekendDigestEnabled must be a boolean" }, { status: 400 });
    }
    if (body.desktopNotificationsEnabled !== undefined && typeof body.desktopNotificationsEnabled !== "boolean") {
      return NextResponse.json({ error: "desktopNotificationsEnabled must be a boolean" }, { status: 400 });
    }
    if (body.soundEnabled !== undefined && typeof body.soundEnabled !== "boolean") {
      return NextResponse.json({ error: "soundEnabled must be a boolean" }, { status: 400 });
    }

    const updated = await db.updateUserPreferences("user_primary", body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update preferences" }, { status: 500 });
  }
}
