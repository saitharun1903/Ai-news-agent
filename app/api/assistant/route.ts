import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ai } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json({
      answer,
      paperId: paper.id,
      paperTitle: paper.title,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
