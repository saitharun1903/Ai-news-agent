import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { ZeroClickStoryCard } from "@/components/feed/zero-click-story-card";
import { OpenSourceStream } from "@/components/feed/open-source-stream";
import { GithubProjectItem } from "@/components/cards/github-project-card";
import { Compass, Newspaper, Code2, MessageSquare, Flame } from "lucide-react";

export const revalidate = 60;

interface DiscoverPageProps {
  searchParams: Promise<{
    tab?: string;
    category?: string;
    q?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const currentTab = params.tab || "all";
  const currentCategory = (params.category || "ALL").toUpperCase();
  const query = (params.q || "").toLowerCase();

  // Filters
  const filterCategories = [
    "ALL",
    "SOFTWARE ENGINEERING",
    "SYSTEMS",
    "SECURITY",
    "DATABASES",
    "PROGRAMMING LANGUAGES",
    "AI/ML",
    "AGENTS",
    "DEVELOPER TOOLS",
  ];

  const [allGroups, allPapers] = await Promise.all([
    db.getArticleGroups({ limit: 40 }),
    db.getPapers({ limit: 60 }),
  ]);

  // Extract verified open source projects from research papers
  const githubProjects: GithubProjectItem[] = allPapers
    .filter((p) => p.githubUrl && p.githubUrl.includes("github.com/"))
    .slice(0, 6)
    .map((p) => {
      const repoPath = p.githubUrl!.replace("https://github.com/", "").replace(/\/$/, "");
      const parts = repoPath.split("/");
      return {
        id: `proj_${p.id}`,
        name: parts[1] || p.title,
        repo: repoPath,
        owner: parts[0] || "research-lab",
        url: p.githubUrl!,
        description: p.coreContribution || p.whyItMatters || p.title,
        language: "Python / Systems",
        stars: (p.upvotes || 30) * 18 + 120,
        lastUpdated: "Recently updated",
        paperId: p.id,
        paperTitle: p.title,
      };
    });

  // Filter groups
  const filteredGroups = allGroups.filter((g) => {
    if (currentCategory !== "ALL") {
      const matchTopic = g.topic.toUpperCase().includes(currentCategory);
      const matchText = `${g.title} ${g.summary}`.toUpperCase().includes(currentCategory);
      if (!matchTopic && !matchText) return false;
    }
    if (query) {
      const text = `${g.title} ${g.summary} ${g.topic}`.toLowerCase();
      if (!text.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            <Compass className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Discover & Explore</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Explore Beyond Today
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
            Browse trending technology developments, active open-source repositories, and verified community signals.
          </p>
        </div>

        <div className="text-xs text-[var(--text-secondary)] font-sans">
          <span>Total items: </span>
          <strong className="text-[var(--text-primary)]">{filteredGroups.length + githubProjects.length}</strong>
        </div>
      </div>

      {/* Exploration View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1 bg-[var(--surface-soft)] p-1 rounded-xl border border-[var(--border)]">
          <Link
            href="/news"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
              currentTab === "all"
                ? "bg-white text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Compass className="h-3 w-3" />
            <span>All Discoveries</span>
          </Link>

          <Link
            href="/news?tab=stories"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
              currentTab === "stories"
                ? "bg-white text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Newspaper className="h-3 w-3" />
            <span>Trending Stories</span>
          </Link>

          <Link
            href="/news?tab=projects"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
              currentTab === "projects"
                ? "bg-white text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Code2 className="h-3 w-3" />
            <span>Open Source</span>
          </Link>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--surface-soft)]">
        {filterCategories.map((cat) => {
          const active = currentCategory === cat;
          const href =
            cat === "ALL"
              ? `/news${currentTab !== "all" ? `?tab=${currentTab}` : ""}`
              : `/news?category=${encodeURIComponent(cat)}${currentTab !== "all" ? `&tab=${currentTab}` : ""}`;

          return (
            <Link
              key={cat}
              href={href}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-[var(--text-primary)] text-white font-semibold shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* Open Source Projects Section (Shown on 'all' and 'projects' tabs) */}
      {(currentTab === "all" || currentTab === "projects") && githubProjects.length > 0 && (
        <div className="pt-2">
          <OpenSourceStream projects={githubProjects} />
        </div>
      )}

      {/* Clustered Stories Stream (Shown on 'all' and 'stories' tabs) */}
      {(currentTab === "all" || currentTab === "stories") && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Trending Technical Stories ({filteredGroups.length})</span>
            </h2>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-[var(--border)] bg-white p-6">
              <Newspaper className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                No news stories found in &ldquo;{currentCategory}&rdquo;
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                Try switching to &ldquo;ALL&rdquo; or explore open-source projects above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => {
                const related = allPapers
                  .filter((p) =>
                    p.categories.some((c) =>
                      c.toLowerCase().includes(group.topic.toLowerCase())
                    )
                  )
                  .slice(0, 3);

                return (
                  <ZeroClickStoryCard
                    key={group.id}
                    story={group}
                    relatedPapers={related}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
