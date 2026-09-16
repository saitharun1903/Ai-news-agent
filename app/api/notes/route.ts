import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paperId") || undefined;
  const topic = searchParams.get("topic") || undefined;

  const notes = await db.getNotes({ paperId, topic });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const note = await db.addNote({
      userId: "user_primary",
      paperId: body.paperId,
      paperTitle: body.paperTitle,
      sectionTitle: body.sectionTitle,
      highlightedText: body.highlightedText,
      note: body.note,
      topic: body.topic || "General AI",
    });
    return NextResponse.json(note);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.deleteNote(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
