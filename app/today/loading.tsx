import React from "react";

export default function TodayLoading() {
  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-8 font-sans animate-pulse pt-2">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-[var(--border)]">
        <div className="h-4 w-40 bg-slate-200 rounded-md" />
        <div className="h-9 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 bg-slate-100 rounded-md" />
      </div>

      {/* Habit card skeleton */}
      <div className="h-20 rounded-2xl border border-[var(--border)] bg-white p-4" />

      {/* Featured story skeleton */}
      <div className="h-64 rounded-3xl border border-[var(--border)] bg-white p-6 space-y-4">
        <div className="h-5 w-32 bg-slate-200 rounded-md" />
        <div className="h-8 w-4/5 bg-slate-200 rounded-xl" />
        <div className="h-4 w-full bg-slate-100 rounded-md" />
        <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 rounded-2xl border border-[var(--border)] bg-white p-5 space-y-3">
            <div className="h-4 w-20 bg-slate-200 rounded-md" />
            <div className="h-5 w-full bg-slate-200 rounded-md" />
            <div className="h-3 w-full bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
