import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const profile = await db.getUserProfile();
    const sessions = await db.getReadingSessions(profile.id);
    return NextResponse.json(sessions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = await db.getUserProfile();
    const { action, sessionId, paperId, paperTitle, deltaSeconds, progressPercent, completed } = body;

    if (action === "start") {
      const session = await db.startReadingSession(
        profile.id,
        paperId,
        paperTitle || "Technical Preprint",
        sessionId
      );
      return NextResponse.json(session, { status: 201 });
    }

    if (action === "heartbeat") {
      const session = await db.recordSessionHeartbeat(
        sessionId,
        deltaSeconds || 15,
        progressPercent || 0,
        completed
      );
      return NextResponse.json(session || { status: "not_found" });
    }

    if (action === "complete") {
      const session = await db.completeReadingSession(sessionId, paperId);
      return NextResponse.json(session || { status: "not_found" });
    }

    if (action === "end") {
      await db.endReadingSession(sessionId);
      return NextResponse.json({ ok: true });
    }

    // Default legacy record
    const legacy = await db.recordReadingActivity(
      paperId,
      paperTitle || "Preprint",
      deltaSeconds || 60,
      progressPercent || 10,
      completed || false
    );
    return NextResponse.json(legacy);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
