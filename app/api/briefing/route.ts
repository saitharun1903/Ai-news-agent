import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDailyBriefing } from "@/lib/ingestion/pipeline";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  let briefing = await db.getDailyBriefing(date);
  if (!briefing && date === new Date().toISOString().split("T")[0]) {
    briefing = await generateDailyBriefing();
  }

  if (!briefing) {
    return NextResponse.json({ error: "No briefing found for this date" }, { status: 404 });
  }

  return NextResponse.json(briefing);
}

export async function POST() {
  try {
    const briefing = await generateDailyBriefing();
    return NextResponse.json(briefing);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
