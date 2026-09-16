import React from "react";

export default function TopicsLoading() {
  return (
    <div className="w-full space-y-6 font-sans animate-pulse pt-1">
      {/* Header */}
      <div className="pb-6 border-b border-[var(--border)] space-y-2">
        <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
        <div className="h-8 w-60 bg-slate-200 rounded-xl" />
        <div className="h-4 w-full max-w-md bg-slate-100 rounded-md" />
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-slate-100 rounded-xl" />
              <div className="h-4 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-100 rounded-md" />
              <div className="h-3.5 w-4/5 bg-slate-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
