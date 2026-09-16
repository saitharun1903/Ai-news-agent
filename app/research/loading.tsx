import React from "react";

export default function ResearchLoading() {
  return (
    <div className="w-full space-y-6 font-sans animate-pulse pt-1">
      {/* Header */}
      <div className="pb-5 border-b border-[var(--border)] space-y-2">
        <div className="h-3.5 w-20 bg-slate-200 rounded-md" />
        <div className="h-8 w-56 bg-slate-200 rounded-xl" />
        <div className="h-4 w-full max-w-lg bg-slate-100 rounded-md" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
        <div className="h-10 w-32 bg-slate-100 rounded-xl hidden sm:block" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-24 bg-slate-100 rounded-xl shrink-0" />
        ))}
      </div>

      {/* 3 Paper Cards Skeleton */}
      <div className="space-y-4 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-200 rounded-md" />
              <div className="h-4 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="h-5 w-4/5 bg-slate-200 rounded-md" />
            <div className="h-3.5 w-full bg-slate-100 rounded-md" />
            <div className="h-3.5 w-3/4 bg-slate-100 rounded-md" />
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-20 bg-slate-100 rounded-lg" />
              <div className="h-6 w-20 bg-slate-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
