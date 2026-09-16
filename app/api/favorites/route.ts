import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEffectiveUserId } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const userId = await getEffectiveUserId();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") || undefined;
    const favorites = await db.getFavorites(entityType, userId);
    return NextResponse.json(favorites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getEffectiveUserId();
    const body = await request.json();
    if (!body.entityType || !body.entityId || !body.title || !body.url) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId, title, url" },
        { status: 400 }
      );
    }

    const newFavorite = await db.addFavorite({
      userId,
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
    const userId = await getEffectiveUserId();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing entityType or entityId query parameter" },
        { status: 400 }
      );
    }

    const removed = await db.removeFavorite(entityType, entityId, userId);
    return NextResponse.json({ success: removed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
