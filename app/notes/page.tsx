import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getEffectiveUserId } from "@/lib/supabase/server";
import { FileText, BookOpen, Trash2, ArrowRight, Download, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function NotesPage() {
  const userId = await getEffectiveUserId();
  const notes = await db.getNotes(undefined, userId);

  // Group notes by topic
  const groupedByTopic = new Map<string, typeof notes>();
  for (const n of notes) {
    const list = groupedByTopic.get(n.topic) || [];
    list.push(n);
    groupedByTopic.set(n.topic, list);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            <FileText className="h-3.5 w-3.5 text-amber-500" />
            <span>Personal AI Knowledge Base</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            My Research Notes
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Insights, architectural equations, and concept notes captured while reading papers.
          </p>
        </div>

        <div className="text-xs text-[var(--text-secondary)] font-mono">
          <span className="font-semibold text-[var(--text-primary)]">{notes.length}</span> recorded notes
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-8">
          {Array.from(groupedByTopic.entries()).map(([topic, topicNotes]) => (
            <div key={topic} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span>{topic}</span>
                <span className="text-[var(--text-secondary)] font-normal">({topicNotes.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-[var(--border)] bg-white p-5 flex flex-col justify-between space-y-3 shadow-xs hover:border-[var(--accent)] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="font-mono truncate max-w-[200px]">{note.sectionTitle || "General"}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>

                      <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 mb-2">
                        <Link href={`/reader/${note.paperId}`} className="hover:underline">
                          {note.paperTitle}
                        </Link>
                      </h4>

                      <div className="rounded-xl bg-[var(--surface-soft)] p-3.5 text-xs text-[var(--text-primary)] font-sans leading-relaxed whitespace-pre-wrap border border-[var(--border)]">
                        {note.note}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--surface-soft)] flex items-center justify-between text-xs">
                      <Link
                        href={`/reader/${note.paperId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Return to Reader</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No research notes captured yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              Open any research paper in the Reader and click the &ldquo;Notes&rdquo; button to record insights, formulas, and definitions.
            </p>
          </div>
          <Link href="/research">
            <Button size="sm" className="gap-2 text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)]">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Browse Papers</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
