"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, FileText, Newspaper, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<"all" | "papers" | "news">("all");
  const [results, setResults] = useState<{
    papers: any[];
    articleGroups: any[];
    topics: any[];
    expandedTerms?: string[];
  }>({ papers: [], articleGroups: [], topics: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ papers: [], articleGroups: [], topics: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${activeType}`
        );
        const data = await res.json();
        setResults({
          papers: data.papers || [],
          articleGroups: data.articleGroups || [],
          topics: data.topics || [],
          expandedTerms: data.expandedTerms || [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeType]);

  const hasResults =
    results.papers.length > 0 ||
    results.articleGroups.length > 0 ||
    results.topics.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 font-sans">
      {/* Search Header */}
      <div className="space-y-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-1">
            <Search className="h-3.5 w-3.5" />
            <span>Universal Semantic Search</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Search Research &amp; Intelligence
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Natural language intent recognition across preprints, headlines, authors, and conceptual formulations.
          </p>
        </div>

        {/* Large Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: 'papers about making LLM inference cheaper' or 'multi-agent reasoning'..."
            className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-12 pr-4 text-sm sm:text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 shadow-xs transition-all"
          />
        </div>

        {/* Type Filter & Semantic Expansion Hint */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            {[
              { id: "all", label: "All Results" },
              { id: "papers", label: "Research Papers" },
              { id: "news", label: "News & Developments" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id as any)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  activeType === tab.id
                    ? "bg-[var(--text-primary)] text-white shadow-xs"
                    : "bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] border border-[var(--border)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {results.expandedTerms && results.expandedTerms.length > 1 && (
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[11px]">
              <Sparkles className="h-3 w-3 text-[var(--accent)]" />
              <span>Semantic expansions:</span>
              <span className="font-mono text-[var(--text-primary)]">
                {results.expandedTerms.slice(0, 5).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[var(--text-secondary)] flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span>Searching index with semantic intent...</span>
        </div>
      ) : query && !hasResults ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white/60 p-12 text-center text-sm text-[var(--text-secondary)]">
          No matches found for &ldquo;{query}&rdquo;. Try broader terms or domain topics.
        </div>
      ) : !query ? (
        <div className="space-y-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Suggested Research Inquiries
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { query: "papers about making LLM inference cheaper", desc: "Quantization, speculative decoding, and KV caching" },
              { query: "multi-agent reasoning loops", desc: "Tool use, execution graphs, and self-correction" },
              { query: "vision language action models", desc: "Spatial intelligence, multimodal representations, and robotics" },
              { query: "direct preference optimization vs RLHF", desc: "Alignment methodology, reward modeling, and loss formulation" },
            ].map((s, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(s.query)}
                className="rounded-xl border border-[var(--border)] bg-white p-4 text-left hover:border-[var(--accent)] hover:shadow-xs transition-all group"
              >
                <div className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                  {s.query}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Papers */}
          {results.papers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>Research Papers ({results.papers.length})</span>
              </div>
              <div className="space-y-3">
                {results.papers.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[var(--border)] bg-white p-5 space-y-2 shadow-xs hover:border-[var(--accent)] transition-all"
                  >
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {p.primaryCategory}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {p.difficulty}
                      </Badge>
                      <span>·</span>
                      <span className="font-mono">arXiv:{p.arxivId}</span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      <Link href={`/research/${p.id}`} className="hover:text-[var(--accent)] hover:underline">
                        {p.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {p.abstract}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{p.authors?.slice(0, 3).join(", ")} et al.</span>
                      <div className="flex items-center gap-2">
                        {p.arxivId && (
                          <a
                            href={`https://arxiv.org/pdf/${p.arxivId}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[var(--text-secondary)] hover:text-red-700 px-2 py-1 rounded bg-[var(--surface-soft)] border border-[var(--border)] hover:bg-white"
                          >
                            PDF ↗
                          </a>
                        )}
                        <Link href={`/reader/${p.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                            <span>Open Reader</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News */}
          {results.articleGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <Newspaper className="h-3.5 w-3.5 text-amber-600" />
                <span>News &amp; Developments ({results.articleGroups.length})</span>
              </div>
              <div className="space-y-3">
                {results.articleGroups.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-[var(--border)] bg-white p-5 space-y-1.5 shadow-xs hover:border-[var(--accent)] transition-all"
                  >
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {g.topic}
                      </Badge>
                      <span>·</span>
                      <span>{g.sources?.length || 1} sources</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      <a
                        href={g.sources?.[0]?.url || "/news"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--accent)] hover:underline"
                      >
                        {g.title}
                      </a>
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {g.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
