import React from "react";

export default function NewsLoading() {
  return (
    <div className="w-full space-y-6 font-sans animate-pulse pt-1">
      <div className="pb-5 border-b border-[var(--border)] space-y-2">
        <div className="h-3.5 w-16 bg-slate-200 rounded-md" />
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="h-4 w-80 bg-slate-100 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-2xl border border-[var(--border)] bg-white p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-100 rounded-md" />
            <div className="h-5 w-full bg-slate-200 rounded-md" />
            <div className="h-3 w-full bg-slate-100 rounded-md" />
            <div className="h-3 w-2/3 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
