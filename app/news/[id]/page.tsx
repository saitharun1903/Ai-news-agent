import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft, ExternalLink, Sparkles, BookOpen, Layers, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NewsDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  const group = await db.getArticleGroupById(id);

  if (!group) {
    notFound();
  }

  // Signature Feature: Discover research behind this trend
  const papers = await db.getPapers({ topic: group.topic, limit: 3 });
  const primarySource = group.sources[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10 font-sans">
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-xs font-sans text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to News</span>
      </Link>

      {/* Headline & Meta */}
      <header className="space-y-4 pb-8 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Badge variant="secondary" className="text-xs uppercase">
            {group.topic}
          </Badge>
          <span className="text-slate-300">·</span>
          <span>Published {new Date(group.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          {group.sources.length > 1 && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-[var(--accent)] font-medium">
                {group.sources.length} sources
              </span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
          {group.title}
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-sans">
          {group.summary}
        </p>

        {primarySource && (
          <div className="pt-2">
            <a href={primarySource.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2 text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-xl">
                <span>Read original story on {primarySource.sourceName}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        )}
      </header>

      {/* Related Research */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-[var(--accent)] font-semibold">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <span>Related research</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            From Academic Preprint to Production Milestone
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            This industry announcement connects directly with active theoretical and empirical research in {group.topic}. Understanding these papers gives you the foundational context behind the headline.
          </p>
        </div>

        {papers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {papers.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 flex flex-col justify-between space-y-3 shadow-xs hover:border-[var(--accent)] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1.5">
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {p.primaryCategory}
                    </Badge>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-400">arXiv:{p.arxivId}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)] line-clamp-2">
                    <Link href={`/research/${p.id}`} className="hover:underline">
                      {p.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1.5">
                    {p.whyItMatters}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--surface-soft)] flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">~{p.readingTimeMinutes}m read</span>
                  <Link href={`/reader/${p.id}`}>
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1 border-[var(--border)] rounded-lg">
                      <BookOpen className="h-3 w-3" />
                      <span>Read Paper</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[var(--text-secondary)]">
            No direct paper mapping found for this specific cluster.
          </div>
        )}
      </section>

      {/* Multi-Source Coverage List */}
      {group.sources.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <Layers className="h-3.5 w-3.5" />
            <span>Underlying Outlets &amp; Coverage ({group.sources.length})</span>
          </div>
          <div className="divide-y divide-[var(--surface-soft)] rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-xs">
            {group.sources.map((s, idx) => (
              <a
                key={idx}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 hover:bg-[var(--surface-soft)] transition-colors text-xs"
              >
                <div>
                  <div className="font-semibold text-[var(--text-primary)] text-sm">
                    {s.sourceName}
                  </div>
                  <div className="text-[var(--text-secondary)] mt-0.5">{s.title}</div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 shrink-0 ml-4" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
