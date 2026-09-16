"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { modalVariants, backdropVariants } from "@/lib/motion";
import {
  Search,
  FileText,
  Newspaper,
  Hash,
  Sparkles,
  X,
  ArrowRight,
  GitBranch,
  Calendar,
  Heart,
  ExternalLink,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    papers: any[];
    articleGroups: any[];
    projects: any[];
    topics: any[];
    authors: any[];
  }>({ papers: [], articleGroups: [], projects: [], topics: [], authors: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      setResults({ papers: [], articleGroups: [], projects: [], topics: [], authors: [] });
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else (window as any).__openCommandPalette?.();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ papers: [], articleGroups: [], projects: [], topics: [], authors: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults({
          papers: data.papers || [],
          articleGroups: data.articleGroups || [],
          projects: data.projects || [],
          topics: data.topics || [],
          authors: data.authors || [],
        });
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const hasAnyResults =
    results.papers.length > 0 ||
    results.articleGroups.length > 0 ||
    results.projects.length > 0 ||
    results.topics.length > 0 ||
    results.authors.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="command-palette-backdrop"
          variants={backdropVariants}
          initial="closed"
          animate="open"
          exit="closed"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center pt-0 sm:pt-16 md:pt-20 bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4 overflow-hidden font-sans"
        >
          <motion.div
            key="command-palette-panel"
            variants={modalVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="w-full max-w-2xl lg:max-w-3xl rounded-none sm:rounded-3xl border-0 sm:border sm:border-[var(--border)] bg-white shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))",
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Mobile Header Bar (visible on mobile screens only) */}
            <div className="flex sm:hidden items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">Search</span>
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white active:scale-95 transition-all"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border-subtle)] bg-white">
              <Search className="h-4 w-4 text-[var(--accent)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search news, research papers, projects, topics, authors..."
                className="w-full bg-transparent text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-medium"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Clear query"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {/* Desktop / Tablet Visible Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors shrink-0"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Results / Content Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-[var(--border-subtle)]">
              {isLoading && (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] font-mono">
                  <span className="inline-block animate-spin mr-2 text-[var(--accent)]">⟳</span>
                  Searching live intelligence indexes...
                </div>
              )}

              {!isLoading && query && !hasAnyResults && (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  <p className="font-semibold text-sm text-[var(--text-primary)] mb-1">No results found</p>
                  <p>Try searching for another topic, paper title, or author.</p>
                </div>
              )}

              {!query && (
                <div className="py-2 space-y-4">
                  {/* Quick Navigation */}
                  <div>
                    <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                      Quick Navigation
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {[
                        { label: "Today Command Center", url: "/", icon: Sparkles },
                        { label: "Discover Wire", url: "/news", icon: Newspaper },
                        { label: "Research Discovery", url: "/research", icon: FileText },
                        { label: "Technical Domains", url: "/topics", icon: Hash },
                        { label: "Permanent Favorites", url: "/favorites", icon: Heart },
                        { label: "Daily Archive (10-Day History)", url: "/archive", icon: Calendar },
                        { label: "Reading Analytics", url: "/insights", icon: ArrowRight },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.url}
                            type="button"
                            onClick={() => handleSelect(item.url)}
                            className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-[var(--surface-soft)] text-xs sm:text-sm font-medium text-[var(--text-primary)] transition-colors active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-[var(--accent)] shrink-0" />
                              <span>{item.label}</span>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suggested Searches */}
                  <div className="px-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                    <div className="font-mono uppercase tracking-wider text-[11px] text-[var(--text-muted)] font-bold">
                      Suggested Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Reasoning models", "Multi-agent workflows", "Attention", "Inference speed", "RAG"].map(
                        (term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setQuery(term)}
                            className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-soft)] text-[var(--accent)] hover:bg-[var(--accent-soft)] text-xs font-medium transition-colors"
                          >
                            {term}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 1. NEWS RESULTS */}
              {results.articleGroups.length > 0 && (
                <div className="py-2.5">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
                    <span>News &amp; Developments</span>
                    <span>{results.articleGroups.length}</span>
                  </div>
                  {results.articleGroups.slice(0, 4).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleSelect(`/news/${g.id}`)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-2xl hover:bg-[var(--surface-soft)] transition-colors group active:scale-[0.99]"
                    >
                      <Newspaper className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)]">
                          {g.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate mt-0.5">{g.summary}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 2. RESEARCH PAPERS */}
              {results.papers.length > 0 && (
                <div className="py-2.5">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
                    <span>Research Papers</span>
                    <span>{results.papers.length}</span>
                  </div>
                  {results.papers.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(`/reader/${p.id}`)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-2xl hover:bg-[var(--surface-soft)] transition-colors group active:scale-[0.99]"
                    >
                      <FileText className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)]">
                          {p.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate mt-0.5">
                          {(p.authors || []).slice(0, 2).join(", ")} · {p.primaryCategory || "AI"} · {p.readingTimeMinutes || 8} min read
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 3. OPEN SOURCE PROJECTS */}
              {results.projects.length > 0 && (
                <div className="py-2.5">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
                    <span>Projects &amp; Repositories</span>
                    <span>{results.projects.length}</span>
                  </div>
                  {results.projects.slice(0, 3).map((proj) => (
                    <a
                      key={proj.id}
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-2xl hover:bg-[var(--surface-soft)] transition-colors group"
                    >
                      <GitBranch className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate font-mono group-hover:text-[var(--accent)]">
                            {proj.repo}
                          </p>
                          <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate mt-0.5">{proj.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* 4. TOPICS */}
              {results.topics.length > 0 && (
                <div className="py-2.5">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
                    <span>Topics</span>
                    <span>{results.topics.length}</span>
                  </div>
                  {results.topics.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelect(`/topics/${t.slug}`)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-2xl hover:bg-[var(--surface-soft)] transition-colors group active:scale-[0.99]"
                    >
                      <Hash className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)]">
                          {t.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate mt-0.5">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
