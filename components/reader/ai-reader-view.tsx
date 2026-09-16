"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  List,
  X,
} from "lucide-react";
import { Paper, PaperChunk, PaperSection } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { bottomSheetVariants, backdropVariants } from "@/lib/motion";

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
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [mobileAssistantOpen, setMobileAssistantOpen] = useState(false);

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
      text: `Research Assistant active for "${paper.title}". I am grounded in the full text and methodology of this paper. Ask any question or select a suggested prompt below.`,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const assistantInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

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

  // User activity & Idle detection (pause after 60s of inactivity)
  const [isUserActive, setIsUserActive] = useState(true);

  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;

    const handleUserActivity = () => {
      setIsUserActive(true);
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        setIsUserActive(false);
      }, 60000); // 60 seconds inactivity threshold
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));
    
    // Initial arm
    idleTimeout = setTimeout(() => {
      setIsUserActive(false);
    }, 60000);

    return () => {
      clearTimeout(idleTimeout);
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, []);

  // Tab visibility listener: pause reading timer when user leaves tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Timer: log reading time only when tab is active, visible, and user is actively reading
  useEffect(() => {
    if (!isTabActive || !isUserActive) return;
    const timer = setInterval(() => {
      setSecondsRead((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTabActive, isUserActive]);

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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[var(--surface-soft)] overflow-hidden font-sans relative">
      {/* Top Toolbar */}
      <div className="flex h-12 md:h-13 items-center justify-between border-b border-[var(--border)] bg-white px-3 sm:px-4 z-10 shrink-0 shadow-xs gap-2">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/research/${paper.id}`}
            className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 py-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Overview</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            {paper.title}
          </span>
        </div>

        {/* Center: Reading Progress */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[var(--surface-soft)] text-[10px] sm:text-[11px] font-mono text-[var(--text-secondary)] border border-[var(--border)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            <span>Progress: {progressPercent}%</span>
          </div>

          <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode("reader")}
              className={`rounded-lg px-2 sm:px-2.5 py-0.5 transition-colors ${
                viewMode === "reader"
                  ? "bg-white text-[var(--text-primary)] shadow-xs font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Reader
            </button>
            <button
              onClick={() => setViewMode("pdf")}
              className={`rounded-lg px-2 sm:px-2.5 py-0.5 transition-colors ${
                viewMode === "pdf"
                  ? "bg-white text-[var(--text-primary)] shadow-xs font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              PDF
            </button>
          </div>
        </div>

        {/* Desktop/Tablet Right Actions */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          {/* Mark Read Toggle */}
          <button
            onClick={handleToggleComplete}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors shadow-xs active:scale-95 ${
              hasCompleted
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold"
                : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-emerald-700 hover:bg-emerald-50/50"
            }`}
            title="Mark paper as read to log completion"
          >
            <Check className={`h-3.5 w-3.5 ${hasCompleted ? "text-emerald-600 stroke-[2.5]" : "text-[var(--text-muted)]"}`} />
            <span className="hidden lg:inline">{hasCompleted ? "Completed" : "Mark Read"}</span>
          </button>

          {/* Favorite */}
          <button
            onClick={handleSaveFavorite}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors shadow-xs active:scale-95 ${
              favorited
                ? "border-rose-200 bg-rose-50 text-rose-600 font-semibold"
                : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50/50"
            }`}
            title="Save to permanent favorites"
          >
            <Heart className={`h-3.5 w-3.5 ${favorited ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>

          {/* Reading list queue */}
          <button
            onClick={handleSaveBookmark}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors shadow-xs active:scale-95 ${
              saved
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white font-semibold"
                : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
            }`}
            title="Queue in reading list"
          >
            <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
          </button>

          {/* Notes */}
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors shadow-xs active:scale-95"
          >
            <Highlighter className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden lg:inline">Notes</span>
          </button>

          {/* Assistant Toggle */}
          <button
            onClick={() => {
              setAssistantOpen((prev) => !prev);
              if (!assistantOpen) {
                setTimeout(() => assistantInputRef.current?.focus(), 100);
              }
            }}
            className={`flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-semibold transition-colors shadow-xs active:scale-95 ${
              assistantOpen
                ? "bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)]"
                : "border border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Reading Canvas & Panes */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* DESKTOP/TABLET PANE 1: Left Outline (240px) */}
        <aside className="hidden md:flex w-56 lg:w-60 flex-col border-r border-[var(--border)] bg-white shrink-0">
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
              className={`mt-2 w-full py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
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
        <main className="flex-1 flex flex-col bg-white overflow-y-auto relative font-sans pb-16 md:pb-0">
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
            <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
              {/* Paper Title Banner */}
              <div className="pb-5 sm:pb-6 border-b border-[var(--surface-soft)] space-y-2">
                <div className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider font-semibold">
                  {paper.primaryCategory} · {new Date(paper.publishedAt).getFullYear()}
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] leading-snug">
                  {paper.title}
                </h1>
                <div className="text-xs text-[var(--text-secondary)] font-sans">
                  {paper.authors.join(", ")}
                </div>
              </div>

              {/* Active Section */}
              {activeSection && (
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight pb-2 border-b border-[var(--surface-soft)] font-mono">
                    {activeSection.title}
                  </h2>
                  <div className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed space-y-4">
                    <p>{activeSection.content}</p>
                  </div>
                </div>
              )}

              {/* Saved Notes for this paper */}
              {notesList.length > 0 && (
                <div className="mt-8 sm:mt-12 pt-6 border-t border-[var(--border)] space-y-2">
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

        {/* DESKTOP/TABLET PANE 3: Right Grounded AI Research Assistant (Collapsible) */}
        {assistantOpen && (
          <aside className="hidden md:flex w-72 lg:w-88 flex-col border-l border-[var(--border)] bg-white shrink-0 font-sans shadow-xs">
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

            {/* Suggested Prompts */}
            <div className="p-3 border-t border-[var(--surface-soft)] bg-[var(--surface-soft)]">
              <div className="text-xs font-medium text-[var(--text-muted)] mb-2 px-1">
                Suggested Prompts
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  "Explain core methodology",
                  "Explain key equations & math",
                  "Summarize this section",
                  "Compare with baseline methods",
                  "What are the limitations?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleAsk(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors shadow-xs active:scale-95"
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
                className="p-2 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors shadow-xs active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* MOBILE FIXED READING TOOLBAR (Height 52px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--border)] px-3 py-2 shadow-lg flex items-center justify-between pb-safe">
        {/* Mobile Outline Toggle */}
        <button
          onClick={() => setMobileOutlineOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-xs font-semibold text-[var(--text-primary)] active:scale-95 touch-target"
        >
          <List className="h-4 w-4 text-[var(--accent)]" />
          <span>Outline</span>
        </button>

        {/* Mark Read */}
        <button
          onClick={handleToggleComplete}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors active:scale-95 touch-target ${
            hasCompleted
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-white text-[var(--text-secondary)] border-[var(--border)]"
          }`}
        >
          <Check className={`h-3.5 w-3.5 ${hasCompleted ? "text-emerald-600 stroke-[2.5]" : "text-slate-400"}`} />
          <span>{hasCompleted ? "Read" : "Mark Read"}</span>
        </button>

        {/* Notes Toggle */}
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          className="p-2 rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] active:scale-95 touch-target"
          title="Notes"
        >
          <Highlighter className="h-4 w-4 text-amber-500" />
        </button>

        {/* Mobile AI Assistant Trigger */}
        <button
          onClick={() => setMobileAssistantOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--text-primary)] text-white text-xs font-semibold active:scale-95 touch-target shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span>Ask AI</span>
        </button>
      </div>

      {/* MOBILE SLIDE-OVER DRAWER: OUTLINE */}
      <AnimatePresence>
        {mobileOutlineOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex justify-start font-sans">
            <motion.div
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setMobileOutlineOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="relative w-4/5 max-w-sm h-full bg-white border-r border-[var(--border)] shadow-2xl p-4 flex flex-col z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--surface-soft)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Paper Outline</h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">{sections.length} sections</p>
                </div>
                <button
                  onClick={() => setMobileOutlineOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--text-primary)] active:scale-95 touch-target"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2 space-y-1">
                {sections.map((sec) => {
                  const active = sec.id === activeSectionId;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        setViewMode("reader");
                        setMobileOutlineOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors active:scale-[0.98] ${
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
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM SHEET: GROUNDED AI ASSISTANT */}
      <AnimatePresence>
        {mobileAssistantOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end font-sans">
            <motion.div
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setMobileAssistantOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              variants={bottomSheetVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="relative w-full h-[85vh] bg-white rounded-t-3xl border-t border-[var(--border)] shadow-2xl flex flex-col z-10 overflow-hidden"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
            >
              {/* Grab Handle */}
              <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mt-3 mb-1" />

              {/* Sheet Header */}
              <div className="p-3.5 border-b border-[var(--surface-soft)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Document Assistant
                  </span>
                </div>
                <button
                  onClick={() => setMobileAssistantOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--text-primary)] active:scale-95 touch-target"
                >
                  <X className="h-4 w-4" />
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

              {/* Suggested Prompts */}
              <div className="p-2.5 border-t border-[var(--surface-soft)] bg-[var(--surface-soft)]">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    "Core methodology",
                    "Key equations",
                    "Summarize section",
                    "Baseline comparison",
                    "Limitations",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleAsk(prompt)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[var(--border)] text-[var(--text-primary)] whitespace-nowrap active:scale-95"
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
                className="p-3 border-t border-[var(--border)] flex items-center gap-2 bg-white"
              >
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Ask about this paper..."
                  className="flex-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] shadow-xs"
                />
                <button
                  type="submit"
                  disabled={isLoadingAnswer || !inputQuestion.trim()}
                  className="p-2 rounded-xl bg-[var(--text-primary)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors shadow-xs active:scale-95 touch-target"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
