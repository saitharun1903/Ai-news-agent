"use client";

import React from "react";
import { GithubProjectCard, GithubProjectItem } from "@/components/cards/github-project-card";
import { Code2 } from "lucide-react";

interface OpenSourceStreamProps {
  projects: GithubProjectItem[];
}

export function OpenSourceStream({ projects }: OpenSourceStreamProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <section className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-semibold text-xs tracking-wide uppercase text-[var(--text-primary)]">
            Open source projects
          </span>
          <span className="text-[var(--border)] text-xs hidden sm:inline">·</span>
          <span className="text-xs text-[var(--text-secondary)] hidden sm:inline">
            Code repositories from today&apos;s papers
          </span>
        </div>

        <span className="text-xs text-[var(--text-secondary)] font-medium">
          {projects.length} repositories
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {projects.map((proj) => (
          <GithubProjectCard key={proj.id} project={proj} />
        ))}
      </div>
    </section>
  );
}
