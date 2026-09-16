import React from "react";

export default function ProfileLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 font-sans animate-pulse pt-2">
      {/* Profile Header */}
      <div className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="h-20 w-20 rounded-2xl bg-slate-200 shrink-0" />
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="h-7 w-48 bg-slate-200 rounded-lg mx-auto sm:mx-0" />
            <div className="h-4 w-36 bg-slate-100 rounded-md mx-auto sm:mx-0" />
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <div className="h-5 w-24 bg-slate-100 rounded-full" />
              <div className="h-5 w-32 bg-slate-100 rounded-full" />
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border)]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-slate-50 p-4 space-y-2">
              <div className="h-3 w-16 bg-slate-200 rounded-md" />
              <div className="h-6 w-20 bg-slate-200 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Form sections */}
      <div className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8 space-y-6">
        <div className="h-5 w-40 bg-slate-200 rounded-md" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-slate-100 rounded-xl" />
          <div className="h-10 w-full bg-slate-100 rounded-xl" />
          <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
