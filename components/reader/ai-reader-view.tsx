"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  Send,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Bookmark,
  Heart,
  FileText,
  Clock,
  Highlighter,
  MessageSquare,
  Check,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
} from "lucide-react";
import { Paper, PaperChunk, PaperSection } from "@/lib/db/types";
import { Button } from "@/components/ui/button";

interface AIReaderViewProps {
  paper: Paper;
  chunks: PaperChunk[];
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sourceSection?: string;
}

export function AIReaderView({ paper, chunks }: AIReaderViewProps) {
  // Navigation & Outline
  const sections = paper.outline || [];
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || "sec_abstract");
  const [viewMode, setViewMode] = useState<"reader" | "pdf">("reader");
  const [assistantOpen, setAssistantOpen] = useState(true);

  // Reading Session & Heartbeat Tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsRead, setSecondsRead] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const [saved, setSaved] = useState(false);
  const [favorited, setFavorited] = useState(false);

  // Assistant State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `Research Assistant active for "${paper.title}". I am grounded in the full text and methodology of this paper. Ask any question or click a prompt shortcut below.`,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const assistantInputRef = useRef<HTMLInputElement>(null);

  // Note taking
  const [noteText, setNoteText] = useState("");
  const [notesList, setNotesList] = useState<any[]>([]);
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Initialize dedicated reading session on mount
  useEffect(() => {
    let mounted = true;
    fetch("/api/reading-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        paperId: paper.id,
        paperTitle: paper.title,
      }),
    })
      .then((res) => res.json())
      .then((session) => {
        if (mounted && session?.id) {
          setSessionId(session.id);
          if (session.completed) {
            setHasCompleted(true);
          }
          if (session.timeSpentSeconds) {
            setSecondsRead(session.timeSpentSeconds);
          }
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [paper.id, paper.title]);

  // Tab visibility listener: pause reading timer when user leaves tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Timer: log reading time only when tab is active and visible
  useEffect(() => {
    if (!isTabActive) return;
    const timer = setInterval(() => {
      setSecondsRead((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTabActive]);

  // 15-second heartbeat to /api/reading-sessions
  useEffect(() => {
    if (!sessionId || !isTabActive || secondsRead === 0 || secondsRead % 15 !== 0) return;
    
    const progress = Math.min(100, Math.round((secondsRead / (paper.readingTimeMinutes * 60)) * 100));
    fetch("/api/reading-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "heartbeat",
        sessionId,
        deltaSeconds: 15,
        progressPercent: progress,
        completed: hasCompleted,
      }),
    }).catch(() => {});
  }, [secondsRead, sessionId, isTabActive, paper.readingTimeMinutes, hasCompleted]);

  // Unload / unmount session cleanup
  useEffect(() => {
    const handleEndSession = () => {
      if (sessionId) {
        fetch("/api/reading-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end", sessionId }),
          keepalive: true,
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleEndSession);
    return () => {
      window.removeEventListener("beforeunload", handleEndSession);
      handleEndSession();
    };
  }, [sessionId]);

  const handleToggleComplete = async () => {
    const nextCompleted = !hasCompleted;
    setHasCompleted(nextCompleted);

    if (sessionId) {
      if (nextCompleted) {
        await fetch("/api/reading-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            sessionId,
            paperId: paper.id,
          }),
        }).catch(() => {});
      } else {
        await fetch("/api/reading-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "heartbeat",
            sessionId,
            deltaSeconds: 0,
            completed: false,
          }),
        }).catch(() => {});
      }
    }
  };

  // Fetch existing notes
  useEffect(() => {
    fetch(`/api/notes?paperId=${paper.id}`)
      .then((r) => r.json())
      .then((data) => setNotesList(data || []))
      .catch(() => {});
  }, [paper.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async (queryToAsk?: string) => {
    const q = queryToAsk || inputQuestion;
    if (!q.trim()) return;

    const userMsg: ChatMessage = { role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsLoadingAnswer(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: paper.id,
          question: q,
          activeSection: activeSectionId,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer || "Unable to extract response." },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error generating response: ${err.message}` },
      ]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: paper.id,
          paperTitle: paper.title,
          sectionTitle: sections.find((s) => s.id === activeSectionId)?.title || "General",
          note: noteText,
          topic: paper.primaryCategory,
        }),
      });
      const newNote = await res.json();
      setNotesList((prev) => [newNote, ...prev]);
      setNoteText("");
      setShowNoteInput(false);
    } catch {}
  };

  const handleSaveBookmark = async () => {
    try {
      if (!saved) {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: paper.id,
            itemType: "paper",
            title: paper.title,
            url: `/reader/${paper.id}`,
            category: paper.primaryCategory,
          }),
        });
        setSaved(true);
      } else {
        await fetch(`/api/bookmarks?itemId=${paper.id}`, { method: "DELETE" });
        setSaved(false);
      }
    } catch {}
  };

  const handleSaveFavorite = async () => {
    try {
      if (!favorited) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "paper",
            entityId: paper.id,
            title: paper.title,
            url: `/reader/${paper.id}`,
            category: paper.primaryCategory,
            description: paper.whyItMatters || paper.coreContribution || paper.abstract.slice(0, 160),
            metadata: {
              pdfUrl: paper.pdfUrl,
              githubUrl: paper.githubUrl,
              arxivId: paper.arxivId,
            },
          }),
        });
        setFavorited(true);
      } else {
        await fetch(`/api/favorites?entityType=paper&entityId=${paper.id}`, { method: "DELETE" });
        setFavorited(false);
      }
    } catch {}
  };

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];
  const minutesRead = Math.floor(secondsRead / 60);
  const secondsRemainder = secondsRead % 60;
  const progressPercent = Math.min(
    100,
    Math.round((secondsRead / (paper.readingTimeMinutes * 60)) * 100)
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[var(--surface-soft)] overflow-hidden font-sans">
      {/* Top Toolbar */}
      <div className="flex h-12 items-center justify-between border-b border-[var(--border)] bg-white px-4 z-10 shrink-0 shadow-xs">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={`/research/${paper.id}`}
            className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-md">
            {paper.title}
          </span>
        </div>

        {/* Center: Reading Progress */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-soft)] text-[11px] font-mono text-[var(--text-secondary)] border border-[var(--border)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            <span>Progress: {progressPercent}%</span>
          </div>

          <div className="hidden lg:flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode("reader")}
              className={`rounded-lg px-2.5 py-0.5 transition-colors ${
                viewMode === "reader"
                  ? "bg-white text-[var(--text-primary)] shadow-xs font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Reader
            </button>
            <button
              onClick={() => setViewMode("pdf")}
              className={`rounded-lg px-2.5 py-0.5 transition-colors ${
                viewMode === "pdf"
                  ? "bg-white text-[var(--text-primary)] shadow-xs font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              PDF
            </button>
          </div>
        </div>

        {/* Right Actions: [Mark Read] [Favorite] [Queue] [Notes] [Ask AI] */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mark Read Toggle */}
          <button
            onClick={handleToggleComplete}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors shadow-xs ${
              hasCompleted
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold"
                : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-emerald-700 hover:bg-emerald-50/50"
            }`}
            title="Mark paper as read to log completion"
          >
            <Check className={`h-3.5 w-3.5 ${hasCompleted ? "text-emerald-600 stroke-[2.5]" : "text-[var(--text-muted)]"}`} />
            <span className="hidden sm:inline">{hasCompleted ? "Completed" : "Mark Read"}</span>
          </button>

          {/* Favorite */}
          <button
            onClick={handleSaveFavorite}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors shadow-xs ${
              favorited
                ? "border-rose-200 bg-rose-50 text-rose-600 font-semibold"
                : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50/50"
            }`}
            title="Save to permanent favorites"
          >
            <Heart className={`h-3.5 w-3.5 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
            <span className="hidden sm:inline">{favorited ? "Favorited" : "Favorite"}</span>
          </button>

          {/* Reading list queue */}
          <button
            onClick={handleSaveBookmark}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors shadow-xs ${
              saved
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white font-semibold"
                : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
            }`}
            title="Queue in reading list"
          >
            <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">{saved ? "Queued" : "Queue"}</span>
          </button>

          {/* Notes */}
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors shadow-xs"
          >
            <Highlighter className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          {/* Assistant Toggle */}
          <button
            onClick={() => {
              setAssistantOpen(true);
              assistantInputRef.current?.focus();
            }}
            className="flex items-center gap-1 rounded-xl bg-[var(--text-primary)] text-white px-3 py-1 text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Assistant</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* PANE 1: Left Outline (250px) */}
        <aside className="hidden md:flex w-60 flex-col border-r border-[var(--border)] bg-white shrink-0">
          <div className="p-3 border-b border-[var(--surface-soft)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Paper Outline
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {sections.length} sections
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sections.map((sec) => {
              const active = sec.id === activeSectionId;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSectionId(sec.id);
                    setViewMode("reader");
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                    active
                      ? "bg-[var(--text-primary)] text-white font-semibold shadow-xs"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span className="truncate">{sec.title}</span>
                  {sec.pageNumber && (
                    <span className="text-[10px] opacity-60 font-mono">p.{sec.pageNumber}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Habit Progress in Left Pane */}
          <div className="p-3 border-t border-[var(--surface-soft)] bg-[var(--surface-soft)] text-xs">
            <div className="flex items-center justify-between mb-1 text-[11px] text-[var(--text-secondary)]">
              <span className="font-medium">Time in paper</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {minutesRead}:{secondsRemainder < 10 ? `0${secondsRemainder}` : secondsRemainder}
              </span>
            </div>
            <button
              onClick={handleToggleComplete}
              className={`mt-2 w-full py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                hasCompleted
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                  : "border border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
              }`}
            >
              <Check className={`h-3 w-3 ${hasCompleted ? "text-emerald-600 stroke-[2.5]" : ""}`} />
              <span>{hasCompleted ? "Completed Today" : "Mark Completed"}</span>
            </button>
          </div>
        </aside>

        {/* PANE 2: Center Reading Canvas */}
        <main className="flex-1 flex flex-col bg-white overflow-y-auto relative font-sans">
          {/* Note Input Drawer */}
          {showNoteInput && (
            <div className="border-b border-amber-200 bg-amber-50/80 p-4 animate-in fade-in duration-150">
              <div className="text-xs font-semibold text-amber-900 mb-1.5 font-mono">
                Save Research Note for &ldquo;{activeSection?.title}&rdquo;
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Record key equation, architectural insight, or observation..."
                className="w-full rounded-xl border border-amber-200 bg-white p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[70px] shadow-xs"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={() => setShowNoteInput(false)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNote} className="text-xs bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)]">
                  Save Note
                </Button>
              </div>
            </div>
          )}

          {viewMode === "reader" ? (
            <div className="mx-auto max-w-3xl w-full px-6 py-10 space-y-8">
              {/* Paper Title Banner */}
              <div className="pb-6 border-b border-[var(--surface-soft)] space-y-2">
                <div className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider font-semibold">
                  {paper.primaryCategory} · {new Date(paper.publishedAt).getFullYear()}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] leading-snug">
                  {paper.title}
                </h1>
                <div className="text-xs text-[var(--text-secondary)] font-sans">
                  {paper.authors.join(", ")}
                </div>
              </div>

              {/* Active Section */}
              {activeSection && (
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight pb-2 border-b border-[var(--surface-soft)] font-mono">
                    {activeSection.title}
                  </h2>
                  <div className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed space-y-4">
                    <p>{activeSection.content}</p>
                  </div>
                </div>
              )}

              {/* Saved Notes for this paper */}
              {notesList.length > 0 && (
                <div className="mt-12 pt-6 border-t border-[var(--border)] space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                    My Saved Notes ({notesList.length})
                  </div>
                  <div className="space-y-2">
                    {notesList.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs shadow-xs"
                      >
                        <div className="text-[10px] text-[var(--text-secondary)] font-mono mb-1">
                          {n.sectionTitle} · {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-[var(--text-primary)] font-medium">{n.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full w-full flex flex-col">
              <iframe
                src={`https://arxiv.org/pdf/${paper.arxivId}.pdf`}
                className="w-full h-full border-0"
                title="arXiv PDF Viewer"
              />
            </div>
          )}
        </main>

        {/* PANE 3: Right Grounded AI Research Assistant (340px) */}
        {assistantOpen && (
          <aside className="w-80 sm:w-96 flex flex-col border-l border-[var(--border)] bg-white shrink-0 font-sans shadow-xs">
            {/* Assistant Header */}
            <div className="p-3.5 border-b border-[var(--surface-soft)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Document Assistant
                </span>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[var(--text-primary)]"
                title="Collapse Assistant"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl p-3.5 max-w-[90%] leading-relaxed ${
                      m.role === "user"
                        ? "bg-[var(--text-primary)] text-white font-medium"
                        : "bg-[var(--surface-soft)] text-[var(--text-primary)] border border-[var(--border)]"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isLoadingAnswer && (
                <div className="flex items-center gap-2 p-3 text-xs text-[var(--accent)] font-medium">
                  <span className="inline-block animate-spin">⟳</span>
                  <span>Retrieving paper chunks &amp; synthesizing answer...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt Shortcuts */}
            <div className="p-3 border-t border-[var(--surface-soft)] bg-[var(--surface-soft)]">
              <div className="text-xs font-medium text-[var(--text-muted)] mb-2 px-1">
                Prompt Shortcuts
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  "Explain core methodology",
                  "Explain key equations & math",
                  "Summarize this section",
                  "Compare with baseline methods",
                  "Define key technical terms",
                  "What are the limitations?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleAsk(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors shadow-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="p-3 border-t border-[var(--border)] flex items-center gap-2"
            >
              <input
                ref={assistantInputRef}
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask anything about this paper..."
                className="flex-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-xs"
              />
              <button
                type="submit"
                disabled={isLoadingAnswer || !inputQuestion.trim()}
                className="p-2 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
