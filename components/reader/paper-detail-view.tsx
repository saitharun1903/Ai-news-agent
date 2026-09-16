"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ExternalLink,
  BookOpen,
  GitBranch,
  Database,
  Globe,
  Link2,
  Clock,
  ThumbsUp,
  Bookmark,
  Heart,
  Share2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Check,
  Code2,
} from "lucide-react";
import { Paper } from "@/lib/db/types";
import { ExplainBeforeYouReadModal } from "@/components/reader/explain-modal";

interface PaperDetailViewProps {
  paper: Paper;
  relatedPapers: Paper[];
}

export function PaperDetailView({ paper, relatedPapers }: PaperDetailViewProps) {
  const router = useRouter();
  const [explainOpen, setExplainOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    try {
      if (!saved) {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: paper.id,
            itemType: "paper",
            title: paper.title,
            url: `/research/${paper.id}`,
            category: paper.primaryCategory,
          }),
        });
        setSaved(true);
      } else {
        await fetch(`/api/bookmarks?itemId=${paper.id}`, { method: "DELETE" });
        setSaved(false);
      }
    } catch {}
  };

  const handleFavorite = async () => {
    try {
      if (!favorited) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "paper",
            entityId: paper.id,
            title: paper.title,
            url: `/reader/${paper.id}`,
            category: paper.primaryCategory,
            description: paper.whyItMatters || paper.coreContribution || paper.abstract.slice(0, 160),
            metadata: {
              pdfUrl: paper.pdfUrl,
              githubUrl: paper.githubUrl,
              arxivId: paper.arxivId,
            },
          }),
        });
        setFavorited(true);
      } else {
        await fetch(`/api/favorites?entityType=paper&entityId=${paper.id}`, { method: "DELETE" });
        setFavorited(false);
      }
    } catch {}
  };

  const handleShare = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const year = new Date(paper.publishedAt).getFullYear();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 font-sans">
      {/* Paper Header */}
      <header className="space-y-4 pb-6 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)] font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-soft)] text-[var(--text-primary)] font-semibold text-[11px] border border-[var(--border)]">
              {paper.primaryCategory}
            </span>
            <span className="px-2 py-0.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-[10px] uppercase font-bold">
              {paper.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>~{paper.readingTimeMinutes} mins read</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors shadow-xs touch-target active:scale-95"
              aria-label="Share paper"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>

            {/* Reading List Queue */}
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-mono transition-colors shadow-xs touch-target active:scale-95 ${
                saved
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
              }`}
              aria-label="Queue in reading list"
            >
              <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
              <span>{saved ? "Queued" : "Queue"}</span>
            </button>

            {/* Permanent Favorite */}
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-mono transition-colors shadow-xs touch-target active:scale-95 ${
                favorited
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50/50"
              }`}
              aria-label="Save to favorites"
            >
              <Heart className={`h-3.5 w-3.5 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>{favorited ? "Favorited" : "Favorite"}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] leading-snug">
          {paper.title}
        </h1>

        {/* Authors & Meta */}
        <div className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">
            {paper.authors.join(", ")}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
            <span>Published {new Date(paper.publishedAt).toLocaleDateString()}</span>
            <span className="text-slate-300">·</span>
            <span>arXiv:{paper.arxivId}</span>
            {paper.upvotes > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{paper.upvotes} community upvotes</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Primary CTAs with verified badges */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <Link
            href={`/reader/${paper.id}`}
            className="px-4 py-2.5 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)] text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm touch-target active:scale-95"
          >
            <BookOpen className="h-4 w-4 text-[var(--accent)]" />
            <span>Open in Paper Reader</span>
          </Link>

          {paper.pdfUrl && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-mono flex items-center gap-1.5 transition-colors shadow-xs touch-target active:scale-95"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" />
              <span>Original PDF ↗</span>
            </a>
          )}

          {paper.githubUrl && (
            <a
              href={paper.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-mono flex items-center gap-1.5 transition-colors shadow-xs touch-target active:scale-95"
            >
              <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
              <span>Code Repository ↗</span>
            </a>
          )}

          {paper.projectUrl && (
            <a
              href={paper.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-mono flex items-center gap-1.5 transition-colors shadow-xs touch-target active:scale-95"
            >
              <Globe className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Project Page ↗</span>
            </a>
          )}

          {paper.datasetUrl && (
            <a
              href={paper.datasetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-mono flex items-center gap-1.5 transition-colors shadow-xs touch-target active:scale-95"
            >
              <Database className="h-3.5 w-3.5 text-amber-600" />
              <span>Dataset ↗</span>
            </a>
          )}

          {paper.doiUrl && (
            <a
              href={paper.doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-mono flex items-center gap-1.5 transition-colors shadow-xs touch-target active:scale-95"
            >
              <Link2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Publication DOI ↗</span>
            </a>
          )}
        </div>
      </header>

      {/* "Explain Before You Read" Prerequisites */}
      {paper.prerequisites && paper.prerequisites.length > 0 && (
        <section className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-mono">
                Explain Before You Read
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              This paper relies on {paper.prerequisites.length} prerequisite mathematical and architectural foundations.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {paper.prerequisites.map((p, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)] shadow-xs border border-[var(--border)] font-mono"
                >
                  {p.status === "Mastered" ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                  )}
                  {p.concept}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setExplainOpen(true)}
            className="px-4 py-2 rounded-xl border border-[var(--accent)]/30 bg-white text-[var(--accent)] hover:bg-[var(--accent-hover)]/50 text-xs font-semibold shrink-0 transition-colors shadow-xs"
          >
            Review Missing Concepts
          </button>
        </section>
      )}

      {/* Structured Technical Breakdown */}
      <div className="space-y-6">
        {/* Abstract */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            Abstract
          </h3>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed bg-white p-5 rounded-2xl border border-[var(--border)] shadow-xs">
            {paper.abstract}
          </p>
        </section>

        {/* Why it Matters & Core Contribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-2 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              Why This Matters
            </h4>
            <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
              {paper.whyItMatters}
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-2 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              Core Contribution
            </h4>
            <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
              {paper.coreContribution}
            </p>
          </section>
        </div>

        {/* Methodology & Architecture */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-2 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            Methodology &amp; System Design
          </h4>
          <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
            {paper.method}
          </p>
        </section>

        {/* Results and Limitations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-2 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              Results &amp; Empirical Benchmarks
            </h4>
            <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
              {paper.results}
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-2 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              Known Limitations &amp; Future Directions
            </h4>
            <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
              {paper.limitations}
            </p>
          </section>
        </div>
      </div>

      {/* Verified External Code & Data Cards */}
      {(paper.githubUrl || paper.datasetUrl) && (
        <section className="space-y-3 pt-4 border-t border-[var(--border)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            Verified Artifacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paper.githubUrl && (
              <a
                href={paper.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl border border-[var(--border)] bg-white hover:border-indigo-400 transition-colors flex items-start gap-3 group shadow-xs"
              >
                <GitBranch className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 font-bold text-sm text-[var(--text-primary)] group-hover:text-indigo-600 truncate">
                    <span>{paper.githubUrl.replace("https://github.com/", "")}</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Open source code repository &amp; reference model weights.
                  </p>
                </div>
              </a>
            )}

            {paper.datasetUrl && (
              <a
                href={paper.datasetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl border border-[var(--border)] bg-white hover:border-amber-400 transition-colors flex items-start gap-3 group shadow-xs"
              >
                <Database className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 font-bold text-sm text-[var(--text-primary)] group-hover:text-amber-600 truncate">
                    <span>Benchmark Dataset</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Verified training, evaluation, and fine-tuning datasets.
                  </p>
                </div>
              </a>
            )}
          </div>
        </section>
      )}

      {/* Related Papers */}
      {relatedPapers.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">
            Related Research
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedPapers.slice(0, 2).map((rp) => (
              <div
                key={rp.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-2 shadow-xs"
              >
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--surface-soft)] text-[var(--text-primary)] border border-[var(--border)]">
                  {rp.primaryCategory}
                </span>
                <h4 className="font-semibold text-sm text-[var(--text-primary)] line-clamp-1">
                  <Link href={`/research/${rp.id}`} className="hover:text-[var(--accent)] transition-colors">
                    {rp.title}
                  </Link>
                </h4>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{rp.abstract}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prerequisite Explainer Modal */}
      <ExplainBeforeYouReadModal
        paperTitle={paper.title}
        prerequisites={paper.prerequisites}
        isOpen={explainOpen}
        onClose={() => setExplainOpen(false)}
        onProceedToRead={() => router.push(`/reader/${paper.id}`)}
      />
    </div>
  );
}
