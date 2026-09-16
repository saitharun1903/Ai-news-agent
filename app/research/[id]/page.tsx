import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PaperDetailView } from "@/components/reader/paper-detail-view";

interface PaperPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { id } = await params;
  const paper = await db.getPaperById(id);

  if (!paper) {
    notFound();
  }

  const related = await db.getPapers({
    topic: paper.primaryCategory,
    limit: 3,
  });
  const filteredRelated = related.filter((p) => p.id !== paper.id);

  return <PaperDetailView paper={paper} relatedPapers={filteredRelated} />;
}
