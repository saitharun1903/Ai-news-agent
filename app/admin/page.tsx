import React from "react";
import { db } from "@/lib/db";
import { AdminView } from "@/components/admin/admin-view";

export const revalidate = 0; // dynamic

export default async function AdminPage() {
  const sources = await db.getSources();
  const logs = await db.getIngestionLogs();
  const articles = await db.getArticles();
  const groups = await db.getArticleGroups();
  const papers = await db.getPapers();

  // count chunks roughly
  const chunkCount = papers.length * 5;

  return (
    <AdminView
      initialSources={sources}
      initialLogs={logs}
      articleCount={articles.length}
      groupCount={groups.length}
      paperCount={papers.length}
      chunkCount={chunkCount}
    />
  );
}
