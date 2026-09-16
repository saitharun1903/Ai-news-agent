import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groups = await db.getArticleGroups();
    const group = groups.find((g) => g.id === id);
    if (group) return NextResponse.json(group);

    const articles = await db.getArticles();
    const article = articles.find((a) => a.id === id || a.slug === id);
    if (article) return NextResponse.json(article);

    return NextResponse.json({ error: "Story or article not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
