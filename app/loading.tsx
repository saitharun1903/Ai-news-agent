import React from "react";

export default function GlobalLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 font-sans animate-pulse pt-2">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-slate-200 rounded-md" />
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-full max-w-md bg-slate-100 rounded-md" />
      </div>

      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 rounded-2xl border border-[var(--border)] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-100 rounded-md" />
              <div className="h-4 w-12 bg-slate-100 rounded-md" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
            <div className="h-3 w-full bg-slate-100 rounded-md" />
            <div className="h-3 w-2/3 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
