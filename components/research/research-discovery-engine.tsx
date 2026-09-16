"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Paper } from "@/lib/db/types";
import {
  Search,
  BookOpen,
  FileText,
  GitBranch,
  Database,
  Globe,
  Link2,
  Clock,
  ThumbsUp,
  Quote,
  Heart,
  Bookmark,
  CheckCircle2,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface ResearchDiscoveryEngineProps {
  initialPapers: Paper[];
  initialTab?: string;
}

export function ResearchDiscoveryEngine({ initialPapers, initialTab = "trending" }: ResearchDiscoveryEngineProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [filterHasCode, setFilterHasCode] = useState(false);
  const [filterHasPdf, setFilterHasPdf] = useState(false);
  const [filterHasDataset, setFilterHasDataset] = useState(false);
  const [favoritedMap, setFavoritedMap] = useState<Record<string, boolean>>({});

  const tabs = [
    { id: "recommended", label: "Recommended" },
    { id: "new", label: "Latest" },
    { id: "trending", label: "Trending" },
    { id: "foundational", label: "Foundational" },
    { id: "practical", label: "Practical" },
    { id: "for-you", label: "For You" },
  ];

  const topics = [
    { id: "all", label: "All Disciplines" },
    { id: "software engineering", label: "Software Engineering" },
    { id: "distributed systems", label: "Systems & Distributed" },
    { id: "security", label: "Security & Crypto" },
    { id: "programming languages", label: "Programming Languages" },
    { id: "databases", label: "Databases & Storage" },
    { id: "intelligence", label: "AI & Machine Learning" },
    { id: "agent", label: "Autonomous Agents" },
    { id: "developer tools", label: "Developer Tools" },
    { id: "hci", label: "HCI & Interface Systems" },
  ];

  const handleToggleFavorite = async (paper: Paper) => {
    const isFav = !!favoritedMap[paper.id];
    setFavoritedMap((prev) => ({ ...prev, [paper.id]: !isFav }));
    try {
      if (!isFav) {
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
      } else {
        await fetch(`/api/favorites?entityType=paper&entityId=${paper.id}`, { method: "DELETE" });
      }
    } catch {}
  };

  // Filtering logic
  const filteredPapers = useMemo(() => {
    return initialPapers.filter((p) => {
      // Tab filter
      if (activeTab === "trending") {
        if (p.discoveryCategory !== "trending" && (p.upvotes || 0) < 50) return false;
      } else if (activeTab === "new" && p.discoveryCategory !== "new") {
        return false;
      } else if (activeTab === "foundational" && p.discoveryCategory !== "foundational") {
        return false;
      } else if (activeTab === "practical" && p.discoveryCategory !== "practical" && !p.githubUrl) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchAbstract = p.abstract.toLowerCase().includes(q);
        const matchAuthors = p.authors.some((a) => a.toLowerCase().includes(q));
        const matchCat = p.categories.some((c) => c.toLowerCase().includes(q));
        if (!matchTitle && !matchAbstract && !matchAuthors && !matchCat) return false;
      }

      // Topic filter
      if (selectedTopic !== "all") {
        const matchTopic =
          p.primaryCategory.toLowerCase().includes(selectedTopic) ||
          p.categories.some((c) => c.toLowerCase().includes(selectedTopic)) ||
          p.title.toLowerCase().includes(selectedTopic);
        if (!matchTopic) return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "all" && p.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) {
        return false;
      }

      // Has Code
      if (filterHasCode && !p.githubUrl) return false;

      // Has PDF
      if (filterHasPdf && !p.pdfUrl) return false;

      // Has Dataset
      if (filterHasDataset && !p.datasetUrl) return false;

      return true;
    });
  }, [
    initialPapers,
    activeTab,
    searchQuery,
    selectedTopic,
    selectedDifficulty,
    filterHasCode,
    filterHasPdf,
    filterHasDataset,
  ]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers by title, author, keyword, or concept..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Topic Dropdown */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-white text-xs font-medium text-[var(--text-primary)] focus:outline-none shadow-xs"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Difficulty Dropdown */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-white text-xs font-medium text-[var(--text-primary)] focus:outline-none shadow-xs"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Tabs & Quick Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-[var(--text-primary)] text-white font-semibold shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Feature Checkbox Filters */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilterHasCode(!filterHasCode)}
            className={`px-3 py-1 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
              filterHasCode
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] bg-white"
            }`}
          >
            <GitBranch className="h-3 w-3 text-indigo-600" />
            <span>Has Code</span>
          </button>

          <button
            onClick={() => setFilterHasPdf(!filterHasPdf)}
            className={`px-3 py-1 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
              filterHasPdf
                ? "bg-rose-50 border-rose-200 text-rose-700 font-semibold"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] bg-white"
            }`}
          >
            <FileText className="h-3 w-3 text-rose-600" />
            <span>Has PDF</span>
          </button>

          <button
            onClick={() => setFilterHasDataset(!filterHasDataset)}
            className={`px-3 py-1 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
              filterHasDataset
                ? "bg-amber-50 border-amber-200 text-amber-700 font-semibold"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] bg-white"
            }`}
          >
            <Database className="h-3 w-3 text-amber-600" />
            <span>Dataset</span>
          </button>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
        <span>
          Showing <strong className="text-[var(--text-primary)]">{filteredPapers.length}</strong> evaluated papers
        </span>
        {(selectedTopic !== "all" || selectedDifficulty !== "all" || filterHasCode || filterHasPdf || filterHasDataset || searchQuery) && (
          <button
            onClick={() => {
              setSelectedTopic("all");
              setSelectedDifficulty("all");
              setFilterHasCode(false);
              setFilterHasPdf(false);
              setFilterHasDataset(false);
              setSearchQuery("");
            }}
            className="text-[var(--accent)] hover:underline"
          >
            Clear active filters
          </button>
        )}
      </div>

      {/* Dense Results List */}
      {filteredPapers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-[var(--border)] bg-white p-6">
          <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            No research papers match your active criteria
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            Try adjusting your search query, switching discovery tabs, or removing specific filter pills.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--surface-soft)] rounded-2xl border border-[var(--border)] bg-white shadow-xs">
          {filteredPapers.map((paper) => {
            const year = new Date(paper.publishedAt).getFullYear();
            const primaryTopic = paper.categories[0] || paper.primaryCategory;
            const isFav = !!favoritedMap[paper.id];

            return (
              <div
                key={paper.id}
                className="p-5 hover:bg-[var(--surface-soft)] transition-colors group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Metadata & Body */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--surface-soft)] text-[var(--text-primary)] font-semibold text-[11px] border border-[var(--border)]">
                        arXiv:{paper.arxivId}
                      </span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {primaryTopic}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>{year}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{paper.readingTimeMinutes} min</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-[var(--surface-soft)] text-[var(--text-secondary)] border border-[var(--border)]">
                        {paper.difficulty}
                      </span>
                    </div>

                    <Link href={`/research/${paper.id}`}>
                      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                        {paper.title}
                      </h3>
                    </Link>

                    <div className="text-xs text-[var(--text-secondary)] font-sans">
                      {paper.authors.slice(0, 4).join(", ")}
                      {paper.authors.length > 4 && ` +${paper.authors.length - 4} authors`}
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
                      <span className="font-semibold text-[var(--text-primary)]">
                        Core contribution:{" "}
                      </span>
                      {paper.coreContribution || paper.whyItMatters}
                    </p>

                    {/* Signals */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[var(--text-secondary)]">
                      {paper.upvotes > 0 && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{paper.upvotes} upvotes</span>
                        </span>
                      )}
                      {paper.citationCount > 0 && (
                        <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <Quote className="h-3 w-3" />
                          <span>{paper.citationCount.toLocaleString()} citations</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--surface-soft)]">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/reader/${paper.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)] text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 touch-target shadow-xs"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Read</span>
                      </Link>

                      {paper.pdfUrl && (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-mono flex items-center gap-1 transition-all active:scale-95 touch-target bg-white shadow-xs"
                        >
                          <FileText className="h-3.5 w-3.5 text-rose-500" />
                          <span>PDF</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleToggleFavorite(paper)}
                        className={`p-2 rounded-xl border transition-all active:scale-95 touch-target shadow-xs ${
                          isFav
                            ? "border-rose-200 bg-rose-50 text-rose-600"
                            : "border-[var(--border)] text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 bg-white"
                        }`}
                        title={isFav ? "Favorited" : "Add to permanent favorites"}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {paper.githubUrl && (
                        <a
                          href={paper.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all active:scale-95 touch-target bg-white shadow-xs"
                          title="Verified GitHub Repository"
                        >
                          <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
                        </a>
                      )}
                      {paper.projectUrl && (
                        <a
                          href={paper.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all active:scale-95 touch-target bg-white shadow-xs"
                          title="Verified Project Page"
                        >
                          <Globe className="h-3.5 w-3.5 text-[var(--accent)]" />
                        </a>
                      )}
                      {paper.datasetUrl && (
                        <a
                          href={paper.datasetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all active:scale-95 touch-target bg-white shadow-xs"
                          title="Verified Dataset"
                        >
                          <Database className="h-3.5 w-3.5 text-amber-600" />
                        </a>
                      )}
                      {paper.doiUrl && (
                        <a
                          href={paper.doiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all active:scale-95 touch-target bg-white shadow-xs"
                          title="Official DOI Link"
                        >
                          <Link2 className="h-3.5 w-3.5 text-emerald-600" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
