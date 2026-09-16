import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ai } from "@/lib/ai";
import { checkRateLimit } from "@/lib/redis/ratelimit";
import { getEffectiveUserId } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const userId = await getEffectiveUserId();
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";
    const identifier = userId !== "user_primary" ? userId : ip;

    // Rate limit: 15 req/min
    const rl = await checkRateLimit(identifier, "ai");
    if (!rl.success) {
      const limitedRes = NextResponse.json(
        {
          error: "AI rate limit exceeded. Please wait a moment before sending more prompts.",
          retryAfterSeconds: rl.reset,
        },
        { status: 429 }
      );
      limitedRes.headers.set("X-RateLimit-Limit", String(rl.limit));
      limitedRes.headers.set("X-RateLimit-Remaining", "0");
      limitedRes.headers.set("X-RateLimit-Reset", String(rl.reset));
      limitedRes.headers.set("Retry-After", String(rl.reset));
      return limitedRes;
    }

    const { paperId, question } = await req.json();
    if (!paperId || !question) {
      return NextResponse.json({ error: "Missing paperId or question" }, { status: 400 });
    }

    const paper = await db.getPaperById(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const chunks = await db.getPaperChunks(paper.id);
    const answer = await ai.answerPaperQuestion(paper, question, chunks);

    const res = NextResponse.json({
      answer,
      paperId: paper.id,
      paperTitle: paper.title,
    });
    res.headers.set("X-RateLimit-Limit", String(rl.limit));
    res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    res.headers.set("X-RateLimit-Reset", String(rl.reset));
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
