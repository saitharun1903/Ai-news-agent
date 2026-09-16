import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AIReaderView } from "@/components/reader/ai-reader-view";

interface ReaderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { id } = await params;
  const paper = await db.getPaperById(id);

  if (!paper) {
    notFound();
  }

  const chunks = await db.getPaperChunks(paper.id);

  return <AIReaderView paper={paper} chunks={chunks} />;
}
