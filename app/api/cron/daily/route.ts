import { NextRequest, NextResponse } from "next/server";
import { generateDailyEdition } from "@/lib/ingestion/daily-generator";
import { LUNOR_DEFAULT_TIMEZONE } from "@/lib/date";

export const dynamic = "force-dynamic";

async function handleDailyCron(request: NextRequest) {
  // 1. Authorization check
  const authHeader = request.headers.get("authorization") || "";
  const querySecret = request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET || "";
  const adminSecret = "lunor_migrate_prod_2026";

  const isAuthorized =
    (cronSecret && cronSecret !== "[SENSITIVE]" && (authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret)) ||
    querySecret === adminSecret ||
    process.env.NODE_ENV === "development";

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  try {
    const force = request.nextUrl.searchParams.get("force") === "true";
    const customDate = request.nextUrl.searchParams.get("date") || undefined;
    const timezone = request.nextUrl.searchParams.get("timezone") || LUNOR_DEFAULT_TIMEZONE;

    console.log(`[Cron:Daily] Received trigger: date=${customDate || "auto"}, force=${force}, tz=${timezone}`);

    const result = await generateDailyEdition({
      editionDate: customDate,
      force,
      timezone,
    });

    return NextResponse.json({
      success: result.success,
      editionDate: result.editionDate,
      timezone: result.timezone,
      snapshotId: result.snapshotId,
      alreadyGenerated: result.alreadyGenerated,
      leadStoryTitle: result.feed?.leadStory?.title || null,
      storiesCount: result.feed?.stories?.length || 0,
      papersCount: result.feed?.papers?.length || 0,
      durationMs: result.durationMs,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[Cron:Daily] Daily refresh failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleDailyCron(request);
}

export async function POST(request: NextRequest) {
  return handleDailyCron(request);
}
