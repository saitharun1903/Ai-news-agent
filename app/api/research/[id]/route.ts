import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = await db.getPaperById(id);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const identifiers = await db.getPaperIdentifiers(paper.id);
    const versions = await db.getPaperVersions(paper.id);

    return NextResponse.json({
      ...paper,
      identifiers,
      versions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
