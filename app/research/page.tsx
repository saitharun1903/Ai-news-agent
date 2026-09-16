import React from "react";
import { db } from "@/lib/db";
import { ResearchDiscoveryEngine } from "@/components/research/research-discovery-engine";
import { BookOpen, Sparkles } from "lucide-react";

export const revalidate = 60;

interface ResearchPageProps {
  searchParams: Promise<{
    tab?: string;
    topic?: string;
    difficulty?: string;
    search?: string;
  }>;
}

export default async function ResearchPage({ searchParams }: ResearchPageProps) {
  const params = await searchParams;
  const currentTab = params.tab || "trending";

  // Fetch all papers from database
  const papers = await db.getPapers({ limit: 100 });
  const profile = await db.getUserProfile();

  return (
    <div className="space-y-6 font-sans">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            <BookOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Research</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Research Papers
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
            Verified preprints from arXiv, Hugging Face, and premier research labs across systems, software engineering, security, and AI.
          </p>
        </div>

        <div className="text-xs text-[var(--text-secondary)] font-sans">
          <span>Total indexed: </span>
          <strong className="text-[var(--text-primary)]">{papers.length} papers</strong>
        </div>
      </div>

      {/* Interactive Discovery Engine */}
      <ResearchDiscoveryEngine initialPapers={papers} initialTab={currentTab} userProfile={profile} />
    </div>
  );
}
