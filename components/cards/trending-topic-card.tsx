"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";

interface TrendingTopicCardProps {
  topic: {
    id: string;
    name: string;
    slug: string;
    growthRate: string;
    storiesCount: number;
    papersCount: number;
    projectsCount: number;
  };
}

export function TrendingTopicCard({ topic }: TrendingTopicCardProps) {
  if (!topic) return null;

  return (
    <MotionCard3D
      maxTilt={1.5}
      translateZ={4}
      className="rounded-3xl border border-[var(--border)] bg-white p-5 flex flex-col justify-between shadow-sm hover:shadow-card-hover transition-all duration-300 font-sans group"
    >
      <div>
        {/* Header: Name + Velocity */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
            {topic.name}
          </span>
          <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{topic.growthRate}</span>
          </span>
        </div>

        {/* Real Data Metrics */}
        <div className="mt-3.5 space-y-2 text-xs font-mono text-[var(--text-secondary)]">
          <div className="flex items-center justify-between">
            <span>New stories</span>
            <span className="font-bold text-[var(--text-primary)]">{topic.storiesCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Research papers</span>
            <span className="font-bold text-[var(--text-primary)]">{topic.papersCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>GitHub projects</span>
            <span className="font-bold text-[var(--text-primary)]">{topic.projectsCount}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <Link
          href={`/topics/${topic.slug}`}
          className="flex items-center justify-between text-xs font-mono font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors"
        >
          <span>Explore domain</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </MotionCard3D>
  );
}
