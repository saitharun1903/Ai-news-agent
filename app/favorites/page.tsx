"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserFavorite, ReadingSession } from "@/lib/db/types";
import {
  Heart,
  Bookmark,
  History,
  FileText,
  BookOpen,
  Trash2,
  Search,
  Download,
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  Sparkles,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ReadingStatus = "unread" | "reading" | "read";

export interface ReadingListItem {
  id: string;
  itemId: string;
  itemType: "paper" | "article" | "project";
  title: string;
  url: string;
  category?: string;
  authors?: string[];
  status: ReadingStatus;
  createdAt: string;
}

function SavedWorkstationContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as any) || "favorites";

  // 3 Primary Workstation Tabs
  const [activeTab, setActiveTab] = useState<"favorites" | "reading-list" | "recently-read">(
    ["favorites", "reading-list", "recently-read"].includes(initialTab) ? initialTab : "favorites"
  );

  // Type filter: All, Papers, News, Repositories
  const [typeFilter, setTypeFilter] = useState<"all" | "papers" | "news" | "repositories">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [recentlyRead, setRecentlyRead] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedBibtex, setCopiedBibtex] = useState(false);

  // Fetch all saved collections
  const loadData = async () => {
    try {
      setLoading(true);
      const [favRes, bookRes, sessRes] = await Promise.all([
        fetch("/api/favorites"),
        fetch("/api/bookmarks"),
        fetch("/api/reading-sessions"),
      ]);

      if (favRes.ok) {
        const data = await favRes.json();
        setFavorites(Array.isArray(data) ? data : []);
      }

      if (bookRes.ok) {
        const bookmarks = await bookRes.json();
        // Load reading statuses from localStorage cache if present
        let cachedStatuses: Record<string, ReadingStatus> = {};
        try {
          const raw = localStorage.getItem("rp_reading_statuses");
          if (raw) cachedStatuses = JSON.parse(raw);
        } catch {}

        const items: ReadingListItem[] = (Array.isArray(bookmarks) ? bookmarks : []).map((b: any) => ({
          id: b.id,
          itemId: b.itemId || b.id,
          itemType: b.itemType || "paper",
          title: b.title || "Untitled Document",
          url: b.url || `/reader/${b.itemId}`,
          category: b.category,
          status: cachedStatuses[b.itemId || b.id] || "unread",
          createdAt: b.createdAt || new Date().toISOString(),
        }));
        setReadingList(items);
      }

      if (sessRes.ok) {
        const sessions = await sessRes.json();
        setRecentlyRead(Array.isArray(sessions) ? sessions : []);
      }
    } catch (err) {
      console.error("Failed to load saved items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update reading status for reading list item
  const handleUpdateStatus = (itemId: string, newStatus: ReadingStatus) => {
    setReadingList((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, status: newStatus } : item))
    );
    try {
      const raw = localStorage.getItem("rp_reading_statuses");
      const map = raw ? JSON.parse(raw) : {};
      map[itemId] = newStatus;
      localStorage.setItem("rp_reading_statuses", JSON.stringify(map));
    } catch (err) {
      console.error("Failed to persist reading status", err);
    }
  };

  // Remove favorite
  const handleRemoveFavorite = async (fav: UserFavorite) => {
    setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    try {
      await fetch(`/api/favorites?entityType=${fav.entityType}&entityId=${fav.entityId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to remove favorite", err);
      loadData();
    }
  };

  // Remove from reading list
  const handleRemoveReadingList = async (item: ReadingListItem) => {
    setReadingList((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await fetch(`/api/bookmarks?itemId=${item.itemId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to remove from reading list", err);
    }
  };

  // Clear history
  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your local reading session history?")) {
      setRecentlyRead([]);
      try {
        localStorage.removeItem("rp_reading_history");
      } catch {}
    }
  };

  // Filter items based on active tab, type filter, and search query
  const filteredFavorites = useMemo(() => {
    return favorites.filter((fav) => {
      // Type match
      let matchType = true;
      if (typeFilter === "papers") matchType = fav.entityType === "paper";
      else if (typeFilter === "news") matchType = fav.entityType === "article";
      else if (typeFilter === "repositories") matchType = fav.entityType === "project";

      // Query match
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        fav.title.toLowerCase().includes(q) ||
        (fav.description && fav.description.toLowerCase().includes(q)) ||
        (fav.category && fav.category.toLowerCase().includes(q));

      return matchType && matchQuery;
    });
  }, [favorites, typeFilter, searchQuery]);

  const filteredReadingList = useMemo(() => {
    return readingList.filter((item) => {
      let matchType = true;
      if (typeFilter === "papers") matchType = item.itemType === "paper";
      else if (typeFilter === "news") matchType = item.itemType === "article";
      else if (typeFilter === "repositories") matchType = item.itemType === "project";

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q));

      return matchType && matchQuery;
    });
  }, [readingList, typeFilter, searchQuery]);

  const filteredRecentlyRead = useMemo(() => {
    return recentlyRead.filter((session) => {
      // Sessions are primarily papers
      let matchType = true;
      if (typeFilter === "news" || typeFilter === "repositories") matchType = false;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || session.paperTitle.toLowerCase().includes(q);

      return matchType && matchQuery;
    });
  }, [recentlyRead, typeFilter, searchQuery]);

  // Export Bibliography (BibTeX)
  const handleExportBibTeX = () => {
    // Gather all papers from favorites and reading list
    const paperEntries: { title: string; id: string; authors?: string[]; year?: number }[] = [];

    favorites
      .filter((f) => f.entityType === "paper")
      .forEach((f) => {
        paperEntries.push({
          title: f.title,
          id: f.entityId,
          authors: f.metadata?.authors || ["ResearchPulse Contributor"],
          year: f.metadata?.year || new Date(f.createdAt).getFullYear(),
        });
      });

    readingList
      .filter((r) => r.itemType === "paper" && !paperEntries.some((p) => p.id === r.itemId))
      .forEach((r) => {
        paperEntries.push({
          title: r.title,
          id: r.itemId,
          authors: ["ResearchPulse Researcher"],
          year: new Date(r.createdAt).getFullYear(),
        });
      });

    if (paperEntries.length === 0) {
      alert("No research papers currently found in your saved collection to export.");
      return;
    }

    const bibtexContent = paperEntries
      .map((p, idx) => {
        const cleanKey = `rp_${p.id.replace(/[^a-zA-Z0-9]/g, "_")}_${idx + 1}`;
        const authorStr = Array.isArray(p.authors) ? p.authors.join(" and ") : "Unknown Author";
        return `@article{${cleanKey},
  title = {${p.title.replace(/[\{\}]/g, "")}},
  author = {${authorStr}},
  year = {${p.year || 2026}},
  journal = {ResearchPulse Academic Archive},
  url = {https://arxiv.org/abs/${p.id}}
}`;
      })
      .join("\n\n");

    // Trigger file download
    const blob = new Blob([bibtexContent], { type: "application/x-bibtex;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `researchpulse-bibliography-${new Date().toISOString().slice(0, 10)}.bib`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Copy notification
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2500);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Workstation Header */}
      <div className="pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-1 font-semibold">
          <Bookmark className="h-3.5 w-3.5" />
          <span>Saved Workstation</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Saved Collection
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Your personal research collection, reading queue, and recently opened preprints.
            </p>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleExportBibTeX}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs font-semibold border-[var(--border)] bg-white hover:bg-[var(--surface-soft)] text-[var(--text-primary)] rounded-lg shadow-2xs"
              title="Export all saved papers as BibTeX bibliography file"
            >
              {copiedBibtex ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Exported .bib</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>Export BibTeX</span>
                </>
              )}
            </Button>

            {activeTab === "recently-read" && recentlyRead.length > 0 && (
              <Button
                onClick={handleClearHistory}
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs font-semibold border-[var(--border)] bg-white hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-lg shadow-2xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear History</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Clear Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        {/* Main Workstation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "favorites"
                ? "bg-white text-[var(--text-primary)] shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${activeTab === "favorites" ? "text-rose-500 fill-rose-500" : "text-[var(--text-muted)]"}`} />
            <span>Favorites</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
              {favorites.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reading-list")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "reading-list"
                ? "bg-white text-[var(--text-primary)] shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${activeTab === "reading-list" ? "text-[var(--accent)] fill-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
            <span>Reading List</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
              {readingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("recently-read")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "recently-read"
                ? "bg-white text-[var(--text-primary)] shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <History className={`h-3.5 w-3.5 ${activeTab === "recently-read" ? "text-indigo-600" : "text-[var(--text-muted)]"}`} />
            <span>Recently Read</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
              {recentlyRead.length}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search within saved items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-white text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-medium"
          />
        </div>
      </div>

      {/* Filter by Type: All, Papers, News, Repositories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1 mr-1">
          <Filter className="h-3 w-3" /> Type:
        </span>
        {[
          { id: "all", label: "All Items" },
          { id: "papers", label: "Research Papers" },
          { id: "news", label: "News & Dispatches" },
          { id: "repositories", label: "Repositories" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id as any)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              typeFilter === tab.id
                ? "bg-[var(--text-primary)] text-white"
                : "bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="text-xs font-mono text-[var(--text-secondary)]">Loading your saved workstation...</p>
        </div>
      ) : activeTab === "favorites" ? (
        /* TAB 1: FAVORITES */
        filteredFavorites.length > 0 ? (
          <div className="space-y-3">
            {filteredFavorites.map((fav) => (
              <div
                key={fav.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 transition-all duration-200 hover:border-[var(--accent)] hover:shadow-card"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Badge variant="secondary" className="text-[10px] font-mono font-semibold uppercase">
                      {fav.entityType === "paper" ? "Research" : fav.entityType === "article" ? "News" : "Project"}
                    </Badge>
                    {fav.category && (
                      <span className="text-[11px] font-sans text-[var(--text-primary)] bg-[var(--surface-soft)] px-2.5 py-0.5 rounded-md border border-[var(--border)] font-medium">
                        {fav.category}
                      </span>
                    )}
                    <span className="text-[var(--border)]">·</span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Saved {new Date(fav.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    <Link href={fav.url} className="hover:underline">
                      {fav.title}
                    </Link>
                  </h3>

                  {fav.description && (
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {fav.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                  <Link href={fav.url}>
                    <Button size="sm" className="h-8 gap-1.5 text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-lg font-semibold shadow-2xs">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Open</span>
                    </Button>
                  </Link>

                  <button
                    onClick={() => handleRemoveFavorite(fav)}
                    className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-colors"
                    title="Remove from favorites"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Heart className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {searchQuery ? "No favorites match your search" : "Your favorites library is empty"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                Star any research paper, intelligence dispatch, or open source project to keep it permanently in your workstation.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/research">
                <Button size="sm" className="gap-1.5 text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-lg font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Browse Research</span>
                </Button>
              </Link>
            </div>
          </div>
        )
      ) : activeTab === "reading-list" ? (
        /* TAB 2: READING LIST WITH STATUS TOGGLES */
        filteredReadingList.length > 0 ? (
          <div className="space-y-3">
            {filteredReadingList.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 transition-all duration-200 hover:border-[var(--accent)] hover:shadow-card"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Badge variant="secondary" className="text-[10px] font-mono font-semibold uppercase">
                      {item.itemType}
                    </Badge>
                    {item.category && (
                      <span className="text-[11px] font-sans text-[var(--text-primary)] bg-[var(--surface-soft)] px-2.5 py-0.5 rounded-md border border-[var(--border)] font-medium">
                        {item.category}
                      </span>
                    )}
                    <span className="text-[var(--border)]">·</span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Added {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    <Link href={item.url} className="hover:underline">
                      {item.title}
                    </Link>
                  </h3>
                </div>

                {/* Right: Status Toggles & Open / Remove */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                  {/* Status Toggle Buttons: unread / reading / read */}
                  <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-0.5 text-xs font-medium">
                    <button
                      onClick={() => handleUpdateStatus(item.itemId, "unread")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        item.status === "unread"
                          ? "bg-white text-[var(--text-primary)] font-semibold shadow-2xs"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Unread
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.itemId, "reading")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        item.status === "reading"
                          ? "bg-blue-600 text-white font-semibold shadow-2xs"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Reading
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.itemId, "read")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        item.status === "read"
                          ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Read
                    </button>
                  </div>

                  <Link href={item.url}>
                    <Button size="sm" className="h-8 gap-1.5 text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-lg font-semibold shadow-2xs">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Open</span>
                    </Button>
                  </Link>

                  <button
                    onClick={() => handleRemoveReadingList(item)}
                    className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[var(--accent)]">
              <Bookmark className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {searchQuery ? "No queued items match your search" : "Your reading list is empty"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                Queue preprints and articles to read later. You can track status directly here as Unread, Reading, or Read.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/research">
                <Button size="sm" className="gap-1.5 text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-lg font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Find Papers to Read</span>
                </Button>
              </Link>
            </div>
          </div>
        )
      ) : (
        /* TAB 3: RECENTLY READ (READING SESSIONS HISTORY) */
        filteredRecentlyRead.length > 0 ? (
          <div className="space-y-3">
            {filteredRecentlyRead.map((session) => {
              const minutes = Math.ceil((session.timeSpentSeconds || 60) / 60);
              return (
                <div
                  key={session.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 transition-all duration-200 hover:border-[var(--accent)] hover:shadow-card"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          session.completed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {session.completed ? "COMPLETED" : "IN PROGRESS"}
                      </span>
                      <span className="text-[var(--border)]">·</span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {minutes} min read
                      </span>
                      <span className="text-[var(--border)]">·</span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        Opened {new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      <Link href={`/reader/${session.paperId}`} className="hover:underline">
                        {session.paperTitle}
                      </Link>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                    <div className="text-right hidden md:block">
                      <div className="text-[11px] font-mono font-semibold text-[var(--text-primary)]">
                        {session.progressPercent || 10}% progress
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-[var(--surface-soft)] overflow-hidden mt-1">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all"
                          style={{ width: `${session.progressPercent || 10}%` }}
                        />
                      </div>
                    </div>

                    <Link href={`/reader/${session.paperId}`}>
                      <Button size="sm" className="h-8 gap-1.5 text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-lg font-semibold shadow-2xs">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Resume</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <History className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {searchQuery ? "No history matches your search" : "No recent reading history"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                As you read papers and technical preprints in the reader, your progress and session duration will appear here.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/research">
                <Button size="sm" className="gap-1.5 text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-lg font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Start Reading</span>
                </Button>
              </Link>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function SavedWorkstationPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3 font-sans">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="text-xs font-mono text-[var(--text-secondary)]">Loading saved workstation...</p>
        </div>
      }
    >
      <SavedWorkstationContent />
    </Suspense>
  );
}

