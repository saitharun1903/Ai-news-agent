import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");

    const allPapers = await db.getPapers({ limit: 100 });
    const papers = allCandidateMatches(allPapers, cleanSlug);

    const allGroups = await db.getArticleGroups({ limit: 100 });
    const stories = allGroups.filter((g) => {
      const t = g.topic.toLowerCase().replace(/[^a-z0-9]/g, "");
      return t.includes(cleanSlug) || cleanSlug.includes(t);
    });

    return NextResponse.json({
      topic: slug,
      paperCount: papers.length,
      storyCount: stories.length,
      papers,
      stories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function allCandidateMatches(papers: any[], cleanSlug: string) {
  return papers.filter((p) => {
    const cat = (p.primaryCategory || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cat.includes(cleanSlug) || cleanSlug.includes(cat)) return true;
    return (p.categories || []).some((c: string) => {
      const clean = c.toLowerCase().replace(/[^a-z0-9]/g, "");
      return clean.includes(cleanSlug) || cleanSlug.includes(clean);
    });
  });
}
