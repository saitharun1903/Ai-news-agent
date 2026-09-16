"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GitBranch, Star, ExternalLink, Heart } from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";

export interface GithubProjectItem {
  id: string;
  name: string;
  repo: string;
  owner: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  lastUpdated: string;
  paperId?: string;
  paperTitle?: string;
}

interface GithubProjectCardProps {
  project: GithubProjectItem;
}

export function GithubProjectCard({ project }: GithubProjectCardProps) {
  const [favorited, setFavorited] = useState(false);

  if (!project) return null;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!favorited) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "project",
            entityId: project.id,
            title: `${project.owner}/${project.name}`,
            url: project.url,
            category: project.language,
            description: project.description,
            metadata: {
              githubUrl: project.url,
              stars: project.stars,
            },
          }),
        });
        setFavorited(true);
      } else {
        await fetch(`/api/favorites?entityType=project&entityId=${project.id}`, { method: "DELETE" });
        setFavorited(false);
      }
    } catch {}
  };

  return (
    <MotionCard3D
      maxTilt={1.5}
      translateZ={5}
      className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-card-hover transition-all duration-300 font-sans group"
    >
      <div>
        {/* Top: Owner & Stars */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5 truncate">
            <GitBranch className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
            <span className="truncate font-semibold text-[var(--text-primary)]">{project.owner}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-600 font-bold shrink-0">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span>{project.stars.toLocaleString()}</span>
            </div>

            <button
              onClick={handleFavorite}
              className={`p-1.5 rounded-xl border transition-colors ${
                favorited
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50/50"
              }`}
              title={favorited ? "Favorited" : "Save project to favorites"}
            >
              <Heart className={`h-3.5 w-3.5 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Repo Name */}
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 block text-base font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors font-mono truncate"
        >
          {project.name}
        </a>

        {/* Description */}
        <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-sans">
          {project.description}
        </p>
      </div>

      {/* Footer: Language & Open Action */}
      <div className="mt-5 pt-3.5 border-t border-[var(--border-subtle)] space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="font-semibold text-[var(--text-primary)]">{project.language}</span>
          </div>
          <span className="text-[var(--text-muted)]">{project.lastUpdated}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          {project.paperId ? (
            <Link
              href={`/reader/${project.paperId}`}
              className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent)] truncate max-w-[140px] underline font-medium"
              title={project.paperTitle}
            >
              Paper preprint ↗
            </Link>
          ) : (
            <span />
          )}

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[var(--text-primary)] hover:bg-[var(--accent)] text-xs font-semibold text-white transition-all shadow-xs"
          >
            <span>Open GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </MotionCard3D>
  );
}
