import { NextResponse } from "next/server";
import { runIngestionPipeline } from "@/lib/ingestion/pipeline";
import { db } from "@/lib/db";

export async function GET() {
  const logs = await db.getIngestionLogs();
  const sources = await db.getSources();
  return NextResponse.json({
    latestLogs: logs.slice(0, 10),
    sources,
  });
}

export async function POST() {
  try {
    const result = await runIngestionPipeline();
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
