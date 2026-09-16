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
    } else {
      setQuery("");
      setResults({ papers: [], articleGroups: [], projects: [], topics: [], authors: [] });
    }
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
          className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-20 bg-[var(--text-primary)]/40 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
        >
          <motion.div
            key="command-palette-panel"
            variants={modalVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-white shadow-modal overflow-hidden font-sans my-auto sm:my-0"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)]">
          <Search className="h-4 w-4 text-[var(--accent)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, research papers, projects, topics, authors..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-semibold"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-white rounded-lg border border-[var(--border)]">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-[var(--border-subtle)]">
          {isLoading && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)] font-mono">
              <span className="inline-block animate-spin mr-2 text-[var(--accent)]">⟳</span>
              Searching live intelligence indexes...
            </div>
          )}

          {!isLoading && query && !hasAnyResults && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No matching records found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!query && (
            <div className="py-2 space-y-3">
              {/* Quick Navigation Commands */}
              <div>
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                  Navigation Shortcuts
                </div>
                <div className="space-y-0.5 mt-1">
                  {[
                    { label: "Today Command Center", url: "/", icon: Sparkles, key: "G T" },
                    { label: "Discover Wire", url: "/news", icon: Newspaper, key: "G D" },
                    { label: "Research Discovery", url: "/research", icon: FileText, key: "G R" },
                    { label: "Technical Domains", url: "/topics", icon: Hash, key: "G M" },
                    { label: "Permanent Favorites", url: "/favorites", icon: Heart, key: "G F" },
                    { label: "Daily Archive (10-Day History)", url: "/archive", icon: Calendar, key: "G H" },
                    { label: "Reading Analytics", url: "/insights", icon: ArrowRight, key: "G A" },
                  ].map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.url}
                        onClick={() => handleSelect(cmd.url)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-[var(--surface-soft)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
                          <span>{cmd.label}</span>
                        </div>
                        <kbd className="text-[10px] font-mono text-[var(--text-muted)]">{cmd.key}</kbd>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Searches */}
              <div className="px-3 pt-3 border-t border-[var(--border-subtle)] space-y-1.5 text-xs text-[var(--text-secondary)]">
                <div className="font-mono uppercase tracking-wider text-[10px] text-[var(--text-muted)] font-bold">
                  Suggested Searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Reasoning models", "Multi-agent workflows", "Attention", "Inference speed", "RAG"].map(
                    (term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1 rounded-xl bg-[var(--surface-soft)] text-[var(--accent)] hover:bg-[var(--accent-soft)] font-medium transition-colors"
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 1. NEWS */}
          {results.articleGroups.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
                <span>News</span>
                <span>{results.articleGroups.length}</span>
              </div>
              {results.articleGroups.slice(0, 4).map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelect(`/news/${g.id}`)}
                  className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-2xl hover:bg-[var(--surface-soft)] transition-colors group"
                >
                  <Newspaper className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)]">
                      {g.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">{g.summary}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 2. RESEARCH */}
          {results.papers.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
                <span>Research Papers</span>
                <span>{results.papers.length}</span>
              </div>
              {results.papers.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(`/reader/${p.id}`)}
                  className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-2xl hover:bg-[var(--surface-soft)] transition-colors group"
                >
                  <FileText className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)]">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono truncate">
                      {p.authors.slice(0, 2).join(", ")} · {p.primaryCategory} · {p.readingTimeMinutes}m
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 3. PROJECTS */}
          {results.projects.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
                <span>Projects &amp; Repositories</span>
                <span>{results.projects.length}</span>
              </div>
              {results.projects.slice(0, 3).map((proj) => (
                <a
                  key={proj.id}
                  href={proj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-2xl hover:bg-[var(--surface-soft)] transition-colors group"
                >
                  <GitBranch className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate font-mono group-hover:text-[var(--accent)]">
                        {proj.repo}
                      </p>
                      <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">{proj.description}</p>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* 4. TOPICS */}
          {results.topics.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center justify-between">
                <span>Topics</span>
                <span>{results.topics.length}</span>
              </div>
              {results.topics.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(`/topics/${t.slug}`)}
                  className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-2xl hover:bg-[var(--surface-soft)] transition-colors group"
                >
                  <Hash className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)]">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[11px] text-[var(--text-muted)] flex items-center justify-between font-mono">
          <span>Search live arXiv, Hugging Face, Lab RSS &amp; GitHub</span>
          <span>Press ESC to close</span>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
}
