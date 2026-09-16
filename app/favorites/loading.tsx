import React from "react";

export default function FavoritesLoading() {
  return (
    <div className="w-full space-y-6 font-sans animate-pulse pt-1">
      {/* Header */}
      <div className="pb-5 border-b border-[var(--border)] space-y-2">
        <div className="h-3.5 w-28 bg-slate-200 rounded-md" />
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-full max-w-md bg-slate-100 rounded-md" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 bg-slate-100 rounded-xl" />
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3 pt-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-slate-200 rounded-md" />
              <div className="h-4 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
            <div className="h-3.5 w-full bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
