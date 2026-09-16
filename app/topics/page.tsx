import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { Hash, ArrowRight, BookOpen, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

export default async function TopicsIndexPage() {
  const papers = await db.getPapers();
  const groups = await db.getArticleGroups();

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1">
          <Hash className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span>Knowledge Domains</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          Research Topics
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
          Explore specialized subdomains, foundational literature, dynamic research roadmaps, and latest developments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {siteConfig.topics.map((t) => {
          const topicPapers = papers.filter(
            (p) =>
              p.primaryCategory.toLowerCase().includes(t.slug) ||
              p.categories.some((c) => c.toLowerCase().includes(t.slug))
          );
          const topicNews = groups.filter((g) => g.topic.toLowerCase().includes(t.slug));

          return (
            <Link
              key={t.slug}
              href={`/topics/${t.slug}`}
              className="group rounded-2xl border border-[var(--border)] bg-white p-6 transition-all hover:border-[var(--accent)] hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-primary)] font-mono border border-[var(--border)]">
                    <Hash className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">
                    {topicPapers.length} papers
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {t.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--surface-soft)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>{topicNews.length} news stories</span>
                <span className="flex items-center gap-1 font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  <span>View topic</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
