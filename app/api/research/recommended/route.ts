import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEffectiveUserId } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const userId = await getEffectiveUserId();

    const recommended = await db.getRecommendedPapers({ limit, userId });
    return NextResponse.json(recommended);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
