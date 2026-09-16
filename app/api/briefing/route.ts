import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDailyBriefing } from "@/lib/ingestion/pipeline";
import { cacheGet, cacheSet, cacheDel, CacheKeys } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const cacheKey = CacheKeys.dailyBriefing(date);
  const cached = await cacheGet<any>(cacheKey);
  if (cached) {
    const res = NextResponse.json(cached);
    res.headers.set("X-Cache", "HIT");
    return res;
  }

  let briefing = await db.getDailyBriefing(date);
  if (!briefing && date === new Date().toISOString().split("T")[0]) {
    briefing = await generateDailyBriefing();
  }

  if (!briefing) {
    return NextResponse.json({ error: "No briefing found for this date" }, { status: 404 });
  }

  await cacheSet(cacheKey, briefing, 1800);
  const res = NextResponse.json(briefing);
  res.headers.set("X-Cache", "MISS");
  return res;
}

export async function POST() {
  try {
    const briefing = await generateDailyBriefing();
    const date = briefing.date || new Date().toISOString().split("T")[0];
    await cacheDel(CacheKeys.dailyBriefing(date));
    await cacheSet(CacheKeys.dailyBriefing(date), briefing, 1800);
    return NextResponse.json(briefing);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
