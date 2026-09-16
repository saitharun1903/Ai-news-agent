"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Sparkles, X, ChevronRight, BookOpen } from "lucide-react";
import { PrerequisiteConcept } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { modalVariants, backdropVariants } from "@/lib/motion";

interface ExplainModalProps {
  paperTitle: string;
  prerequisites: PrerequisiteConcept[];
  isOpen: boolean;
  onClose: () => void;
  onProceedToRead?: () => void;
}

export function ExplainBeforeYouReadModal({
  paperTitle,
  prerequisites,
  isOpen,
  onClose,
  onProceedToRead,
}: ExplainModalProps) {
  const [selectedConcept, setSelectedConcept] = useState<PrerequisiteConcept | null>(
    prerequisites[0] || null
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal / Bottom Sheet Card */}
          <motion.div
            variants={modalVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="relative w-full max-w-2xl rounded-t-3xl sm:rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
          >
            {/* Grab handle for mobile */}
            <div className="sm:hidden w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--surface-soft)]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 font-mono">
                    Explain Before You Read
                  </span>
                </div>
                <h3 className="mt-1 text-base sm:text-lg font-bold text-[var(--text-primary)] line-clamp-1">
                  Prerequisites for &ldquo;{paperTitle}&rdquo;
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Master the underlying concepts below to read this research paper with full comprehension.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] touch-target active:scale-95"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

        {/* Two-Column Concept Explorer */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4 flex-1 overflow-y-auto">
          {/* Left Column: List of prerequisites */}
          <div className="md:col-span-2 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] px-1 font-mono">
              Required Knowledge ({prerequisites.length})
            </div>
            {prerequisites.map((p, idx) => {
              const active = selectedConcept?.concept === p.concept;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedConcept(p)}
                  className={`w-full flex items-center justify-between rounded-xl p-3 text-left text-xs transition-all border ${
                    active
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white shadow-xs"
                      : "border-[var(--border)] bg-[var(--surface-soft)] hover:bg-white text-[var(--text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    {p.status === "Mastered" ? (
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 ${
                          active ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      />
                    ) : (
                      <AlertCircle
                        className={`h-3.5 w-3.5 shrink-0 ${
                          active ? "text-amber-300" : "text-amber-500"
                        }`}
                      />
                    )}
                    <span className="font-medium truncate">{p.concept}</span>
                  </div>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 ${active ? "opacity-100" : "opacity-40"}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected concept explainer */}
          <div className="md:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 flex flex-col justify-between">
            {selectedConcept ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                    Concept Breakdown
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium font-mono ${
                      selectedConcept.status === "Mastered"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {selectedConcept.status}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {selectedConcept.concept}
                </h4>

                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  {selectedConcept.description}
                </p>

                <div className="mt-4 rounded-xl bg-white p-4 border border-[var(--border)] shadow-xs">
                  <span className="text-[11px] font-semibold text-[var(--text-primary)] block mb-1">
                    How it works in practice:
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {selectedConcept.briefExplanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 py-12">
                Select a concept on the left to review its explanation.
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
              Reviewing this core intuition will make the paper methodology significantly easier to follow.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--surface-soft)]">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              if (onProceedToRead) onProceedToRead();
            }}
            className="gap-1.5 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)] font-semibold"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Proceed to Paper Reader</span>
          </Button>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
