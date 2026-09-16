import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { VisualEngine, generateTechnicalIllustrationSvg } from "@/lib/visuals";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (entityType && entityId) {
      const asset =
        (await db.getVisualAsset(entityType, entityId)) ||
        (await db.getVisualAsset("group", entityId)) ||
        (await db.getVisualAsset("article", entityId));
      if (asset) return NextResponse.json(asset);

      if (entityType === "group" || entityType === "articleGroup" || entityType === "story") {
        const group = await db.getArticleGroupById(entityId);
        if (group) {
          const generated = await VisualEngine.getVisualForArticleGroup(group);
          return NextResponse.json(generated);
        }
      } else if (entityType === "article") {
        const article = await db.getArticleById(entityId);
        if (article) {
          const generated = await VisualEngine.getVisualForArticle(article);
          return NextResponse.json(generated);
        }
        // Fallback: entityId might be an article group
        const group = await db.getArticleGroupById(entityId);
        if (group) {
          const generated = await VisualEngine.getVisualForArticleGroup(group);
          return NextResponse.json(generated);
        }
      } else if (entityType === "paper") {
        const paper = await db.getPaperById(entityId);
        if (paper) {
          const generated = await VisualEngine.getVisualForPaper(paper);
          return NextResponse.json(generated);
        }
      } else if (entityType === "topic") {
        const title = searchParams.get("title") || entityId;
        const svg = generateTechnicalIllustrationSvg(entityId, title);
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        return NextResponse.json({
          id: "vis_topic_" + entityId,
          entityType: "topic",
          entityId,
          sourceType: "generated",
          url: dataUrl,
          altText: `${title} Architecture Diagram`,
          width: 800,
          height: 450,
          status: "ready",
          contentHash: "hash_" + entityId,
          generatedAt: new Date().toISOString(),
        });
      }
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const all = await db.getAllVisualAssets();
    return NextResponse.json(all);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const count = await VisualEngine.ensureAllVisualAssets();
    return NextResponse.json({ success: true, indexedCount: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
