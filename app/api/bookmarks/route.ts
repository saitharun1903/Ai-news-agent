import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const bookmarks = await db.getBookmarks();
  return NextResponse.json(bookmarks);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bookmark = await db.addBookmark({
      userId: "user_primary",
      itemType: body.itemType || "paper",
      itemId: body.itemId,
      title: body.title,
      url: body.url,
      category: body.category,
    });
    return NextResponse.json(bookmark);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "Missing itemId" }, { status: 400 });

    await db.removeBookmark(itemId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
