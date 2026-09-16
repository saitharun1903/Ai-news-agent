import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") || undefined;
    const favorites = await db.getFavorites(entityType);
    return NextResponse.json(favorites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.entityType || !body.entityId || !body.title || !body.url) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId, title, url" },
        { status: 400 }
      );
    }

    const newFavorite = await db.addFavorite({
      userId: "user_primary",
      entityType: body.entityType,
      entityId: body.entityId,
      title: body.title,
      url: body.url,
      category: body.category,
      description: body.description,
      metadata: body.metadata,
    });

    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing entityType or entityId query parameter" },
        { status: 400 }
      );
    }

    const removed = await db.removeFavorite(entityType, entityId);
    return NextResponse.json({ success: removed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
