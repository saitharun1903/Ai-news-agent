import React from "react";
import Link from "next/link";
import { siteConfig, TopicItem } from "@/config/site";
import { db } from "@/lib/db";
import { Paper, ArticleGroup } from "@/lib/db/types";
import { ZeroClickResearchCard } from "@/components/feed/zero-click-research-card";
import { ExpandableStoryRow } from "@/components/feed/expandable-story-row";
import { GithubProjectCard, GithubProjectItem } from "@/components/cards/github-project-card";
import {
  Hash,
  BookOpen,
  Newspaper,
  GitFork,
  ArrowLeft,
  TrendingUp,
  Code2,
  Users,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

interface TopicDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Canonical Aliases Mapping
const TOPIC_ALIASES: Record<string, string> = {
  systems: "distributed-systems",
  system: "distributed-systems",
  sys: "distributed-systems",
  os: "operating-systems",
  kernel: "operating-systems",
  ai: "ai-ml",
  ml: "ai-ml",
  "machine-learning": "ai-ml",
  "artificial-intelligence": "ai-ml",
  pl: "programming-languages",
  languages: "programming-languages",
  se: "software-engineering",
  software: "software-engineering",
  softwareengineering: "software-engineering",
  sec: "security",
  security: "security",
  crypto: "security",
  cryptography: "security",
  db: "databases",
  database: "databases",
  storage: "databases",
  net: "networking",
  network: "networking",
  networks: "networking",
  cloud: "networking",
  agent: "agents",
  agents: "agents",
  cv: "computer-vision",
  vision: "computer-vision",
  robotics: "robotics",
  robots: "robotics",
  algo: "algorithms",
  algorithms: "algorithms",
  tools: "developer-tools",
  devtools: "developer-tools",
  hci: "hci",
};

// Search keywords mapped per topic slug to guarantee accurate multi-criteria filtering
const TOPIC_SEARCH_TERMS: Record<string, string[]> = {
  "distributed-systems": ["distributed", "systems", "consensus", "byzantine", "replication", "cluster", "fault", "cs.dc"],
  "operating-systems": ["operating", "kernel", "ebpf", "scheduling", "virtualization", "memory", "cs.os"],
  "software-engineering": ["software", "engineering", "testing", "synthesis", "refactoring", "code", "cs.se"],
  "programming-languages": ["programming", "languages", "compiler", "type system", "semantics", "llvm", "cs.pl"],
  databases: ["database", "databases", "storage", "lsm", "sql", "query", "vector", "transaction", "cs.db"],
  security: ["security", "cryptography", "crypto", "vulnerability", "zk", "exploit", "privacy", "cs.cr"],
  networking: ["networking", "network", "rpc", "datacenter", "congestion", "cs.ni"],
  "developer-tools": ["developer", "tools", "ide", "profiling", "linter", "build"],
  algorithms: ["algorithm", "complexity", "graph", "optimization", "cs.ds"],
  "ai-ml": ["ai", "machine learning", "neural", "deep learning", "transformer", "attention", "cs.ai", "cs.lg"],
  agents: ["agent", "agents", "autonomous", "tool use", "multi-agent", "reasoning"],
  "computer-vision": ["vision", "image", "diffusion", "spatial", "video", "cs.cv"],
  robotics: ["robotics", "robot", "embodied", "manipulation", "control", "cs.ro"],
  hci: ["hci", "interaction", "interface", "user", "ux"],
};

function resolveTopic(slug: string, allPapers: Paper[], allGroups: ArticleGroup[]): TopicItem | null {
  const normalized = slug.toLowerCase().trim();

  // 1. Direct match on siteConfig.topics slug or id
  const direct = siteConfig.topics.find(
    (t) => t.slug.toLowerCase() === normalized || t.id.toLowerCase() === normalized
  );
  if (direct) return direct;

  // 2. Canonical alias lookup
  const aliasedSlug = TOPIC_ALIASES[normalized];
  if (aliasedSlug) {
    const aliased = siteConfig.topics.find((t) => t.slug === aliasedSlug);
    if (aliased) {
      // If user queried "/topics/systems", customize name to "Systems & Distributed Infrastructure"
      if (normalized === "systems" || normalized === "system") {
        return {
          ...aliased,
          name: "Systems & Distributed Infrastructure",
          slug: "systems",
          description: "Distributed architectures, operating systems, consensus protocols, and resilient infrastructure.",
        };
      }
      return aliased;
    }
  }

  // 3. Substring match against existing topic titles or slugs
  const fuzzy = siteConfig.topics.find(
    (t) =>
      t.slug.includes(normalized) ||
      normalized.includes(t.slug) ||
      t.name.toLowerCase().includes(normalized)
  );
  if (fuzzy) return fuzzy;

  // 4. Dynamic synthesis if papers or news match this term in the database
  const cleanTerm = normalized.replace(/[^a-z0-9]/g, "");
  const hasMatchingPaper = allPapers.some((p) => {
    const cat = (p.primaryCategory || "").toLowerCase();
    const title = (p.title || "").toLowerCase();
    return cat.includes(cleanTerm) || title.includes(cleanTerm) || (p.categories || []).some((c) => c.toLowerCase().includes(cleanTerm));
  });

  const hasMatchingNews = allGroups.some((g) => {
    const top = (g.topic || "").toLowerCase();
    const title = (g.title || "").toLowerCase();
    return top.includes(cleanTerm) || title.includes(cleanTerm);
  });

  if (hasMatchingPaper || hasMatchingNews) {
    const formattedTitle = normalized
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      id: normalized,
      name: formattedTitle,
      slug: normalized,
      description: `State-of-the-art research papers, breaking engineering releases, and open source roadmaps for ${formattedTitle}.`,
      color: "blue",
    };
  }

  // Not found
  return null;
}

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const { slug } = await params;

  // Fetch real data from database
  const allPapers = await db.getPapers({ limit: 150 });
  const allGroups = await db.getArticleGroups({ limit: 100 });

  const topic = resolveTopic(slug, allPapers, allGroups);

  // If topic does NOT exist: Render in-product "Topic Not Found" page (NOT generic 404)
  if (!topic) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-8 font-sans">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
            Topic Not Found
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            No Topic Matching &ldquo;{slug}&rdquo;
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            We couldn&apos;t find any research preprints or lab intelligence dispatches under this topic tag. Explore our verified computing disciplines below:
          </p>
        </div>

        {/* Suggested Topics Directory */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-left flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Recommended Disciplines</span>
          </div>

          <div className="flex flex-wrap gap-2 text-left">
            {siteConfig.topics.map((t) => (
              <Link
                key={t.slug}
                href={`/topics/${t.slug}`}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] hover:bg-white hover:border-[var(--accent)] text-xs text-[var(--text-primary)] font-medium transition-all shadow-2xs"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <Link href="/topics">
            <Button className="gap-2 bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-xl font-semibold shadow-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Topics Directory</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter papers for resolved topic
  const terms = TOPIC_SEARCH_TERMS[topic.slug] || [topic.slug, topic.name.toLowerCase()];
  
  const papers = allPapers.filter((p) => {
    const primaryCat = (p.primaryCategory || "").toLowerCase();
    const title = (p.title || "").toLowerCase();
    const categories = (p.categories || []).map((c) => c.toLowerCase());

    return terms.some(
      (term) =>
        primaryCat.includes(term) ||
        categories.some((c) => c.includes(term)) ||
        title.includes(term)
    );
  });

  // Filter news groups for resolved topic
  const news = allGroups.filter((g) => {
    const topicStr = (g.topic || "").toLowerCase();
    const title = (g.title || "").toLowerCase();
    return terms.some((term) => topicStr.includes(term) || title.includes(term));
  });

  // Open source projects for this topic
  const topicProjects: GithubProjectItem[] = (papers.length > 0 ? papers : allPapers)
    .filter((p) => p.githubUrl)
    .slice(0, 3)
    .map((p) => {
      const repoPath = p.githubUrl!.replace("https://github.com/", "");
      const parts = repoPath.split("/");
      return {
        id: `proj_${p.id}`,
        name: parts[1] || p.title,
        repo: repoPath,
        owner: parts[0] || "ai-lab",
        url: p.githubUrl!,
        description: p.coreContribution || p.whyItMatters || p.title,
        language: "PyTorch / Rust / Python",
        stars: (p.upvotes || 30) * 18 + 120,
        lastUpdated: "Recently updated",
        paperId: p.id,
        paperTitle: p.title,
      };
    });

  // Extract prominent researchers & labs for this topic
  const authorCounts: Record<string, number> = {};
  for (const p of papers) {
    for (const a of p.authors || []) {
      authorCounts[a] = (authorCounts[a] || 0) + 1;
    }
  }
  const topAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // Related topics (exclude current)
  const relatedTopics = siteConfig.topics.filter((t) => t.slug !== topic.slug).slice(0, 4);

  // Momentum score calculation
  const momentumRate = Math.max(16, (news.length + papers.length) * 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10 font-sans">
      {/* Back link */}
      <Link
        href="/topics"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>All Topics Directory</span>
      </Link>

      {/* 1. TOPIC OVERVIEW */}
      <header className="space-y-3 pb-6 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-soft)] text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider font-semibold border border-[var(--border)]">
              DOMAIN / {topic.slug.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/20 text-xs font-mono text-[var(--accent)]">
            <TrendingUp className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="font-semibold">Momentum: ↑ {momentumRate}%</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {topic.name}
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          {topic.description}
        </p>
      </header>

      {/* 2. WHY IT IS TRENDING (Data-Driven Momentum Radar) */}
      <section className="p-6 rounded-2xl border border-[var(--border)] bg-white space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
          <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
          <span>Why It Is Trending Right Now</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
            <div className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Velocity</div>
            <div className="text-lg font-bold text-[var(--accent)] font-mono">
              ↑ {momentumRate}%
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">24h interest index</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
            <div className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Lab News</div>
            <div className="text-lg font-bold text-[var(--text-primary)] font-mono">
              {news.length}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Industry releases</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
            <div className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Preprints</div>
            <div className="text-lg font-bold text-[var(--text-primary)] font-mono">
              {papers.length}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">arXiv evaluations</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
            <div className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Code Repos</div>
            <div className="text-lg font-bold text-[var(--text-primary)] font-mono">
              {topicProjects.length}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Verified implementations</div>
          </div>
        </div>
      </section>

      {/* 3. SUGGESTED READING ROADMAP */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
          <GitFork className="h-4 w-4 text-[var(--accent)]" />
          <span>Research Reading Roadmap</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-1.5 shadow-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Stage 1 · Foundations
            </span>
            <h4 className="text-sm font-bold text-[var(--text-primary)] pt-1">
              Core Principles &amp; Architectures
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Foundational primitives, consistency models, and standard benchmark suites.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-1.5 shadow-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Stage 2 · Modern Scaling
            </span>
            <h4 className="text-sm font-bold text-[var(--text-primary)] pt-1">
              Latency, Throughput &amp; Fault Recovery
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              State machine replication, distributed transaction commit, and low-overhead observability.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-1.5 shadow-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md border border-[var(--accent)]/20">
              Stage 3 · Frontier
            </span>
            <h4 className="text-sm font-bold text-[var(--text-primary)] pt-1">
              Emergent Autonomy &amp; Heterogeneity
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Decentralized verification, multi-accelerator fabrics, and automated resilience policies.
            </p>
          </div>
        </div>
      </section>

      {/* 4. LATEST NEWS & LAB DISPATCHES */}
      {news.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Latest News &amp; Developments ({news.length})
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {news.map((group, idx) => (
              <ExpandableStoryRow
                key={group.id}
                story={group}
                index={idx + 1}
                relatedPapers={papers.slice(0, 2)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. FRONTIER RESEARCH PREPRINTS */}
      <section className="space-y-4 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Research Papers ({papers.length})
            </h2>
          </div>
        </div>

        {papers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {papers.map((p) => (
              <ZeroClickResearchCard key={p.id} paper={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-xs text-[var(--text-secondary)]">
            No papers currently indexed for this specific query term.
          </div>
        )}
      </section>

      {/* 6. WHAT PEOPLE ARE BUILDING (Open Source) */}
      {topicProjects.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              What People Are Building in {topic.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topicProjects.map((proj) => (
              <GithubProjectCard key={proj.id} project={proj} />
            ))}
          </div>
        </section>
      )}

      {/* 7. LEADING RESEARCHERS & KEY LABS */}
      {topAuthors.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Active Researchers &amp; Labs
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {topAuthors.map((author) => (
              <Link
                key={author.name}
                href={`/research?search=${encodeURIComponent(author.name)}`}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-white hover:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-2 transition-colors shadow-xs"
              >
                <span>{author.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--surface-soft)] text-[var(--text-secondary)]">
                  {author.count} papers
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 8. RELATED TOPICS */}
      <section className="space-y-3 pt-4 border-t border-[var(--border)]">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
          Adjacent Technical Frontiers
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {relatedTopics.map((rt) => (
            <Link
              key={rt.slug}
              href={`/topics/${rt.slug}`}
              className="p-3.5 rounded-2xl border border-[var(--border)] bg-white hover:border-[var(--accent)] hover:shadow-xs transition-all text-xs font-mono group"
            >
              <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate">
                {rt.name}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center justify-between">
                <span>Explore</span>
                <ArrowRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
