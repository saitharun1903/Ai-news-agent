"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight, BookOpen, Layers } from "lucide-react";
import { MotionCard3D } from "@/components/motion/motion-card-3d";
import { spring } from "@/lib/motion";

interface DesktopBriefingPopupProps {
  onOpenFullBriefing?: () => void;
}

export function DesktopBriefingPopup({ onOpenFullBriefing }: DesktopBriefingPopupProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [briefingData, setBriefingData] = useState<{
    dateStr: string;
    storyCount: number;
    paperCount: number;
    topicCount: number;
    leadTitle: string;
    paperOfDayTitle: string;
    keyTakeaway: string;
  } | null>(null);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const dismissedDate = localStorage.getItem("rp_briefing_dismissed");
    const snoozeUntil = localStorage.getItem("rp_briefing_snooze");

    if (snoozeUntil && Number(snoozeUntil) > Date.now()) {
      return;
    }

    if (dismissedDate === todayStr) {
      return;
    }

    fetch("/api/briefing")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.topStories && data.topStories.length > 0) {
          const dateFormatted = new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          });
          setBriefingData({
            dateStr: dateFormatted,
            storyCount: data.topStories.length,
            paperCount: data.recommendedPapers?.length || (data.paperOfDay ? 1 : 0),
            topicCount: 3,
            leadTitle: data.topStories[0]?.title || "",
            paperOfDayTitle: data.paperOfDay?.title || "Foundational AI Preprint",
            keyTakeaway: data.synthesis ? data.synthesis.slice(0, 135) + "..." : "",
          });

          setTimeout(() => {
            setIsVisible(true);
          }, 1200);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    localStorage.setItem("rp_briefing_dismissed", todayStr);
    setIsVisible(false);
  };

  const handleOpen = () => {
    setIsVisible(false);
    if (onOpenFullBriefing) {
      onOpenFullBriefing();
    } else {
      router.push("/today");
    }
  };

  if (!briefingData) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          aria-label="Desktop Daily Briefing"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={spring.gentle}
          className="hidden md:block fixed bottom-6 right-6 z-50 w-88 max-w-[calc(100vw-2rem)] font-sans"
        >
          <MotionCard3D maxTilt={1.5} translateZ={8} className="rounded-3xl shadow-modal">
            <motion.div
              layoutId="daily-briefing-surface"
              className="rounded-3xl border border-[var(--border)] bg-white p-5 backdrop-blur-md shadow-card-hover space-y-3.5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-subtle" />
                  <span className="text-xs font-semibold tracking-wider uppercase text-[var(--accent)]">
                    RESEARCHPULSE
                  </span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="rounded-xl p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"
                  title="Dismiss for today"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title & Badge */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-[var(--accent)] tracking-wide uppercase">
                  Today · {briefingData.dateStr}
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
                  {briefingData.leadTitle}
                </h3>
              </div>

              {/* Metrics Pills */}
              <div className="grid grid-cols-3 gap-2 py-1 text-center font-sans">
                <div className="p-2.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)]">
                  <div className="text-sm font-semibold text-[var(--accent)]">+{briefingData.storyCount}</div>
                  <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Developments</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)]">
                  <div className="text-sm font-semibold text-[var(--accent)]">+{briefingData.paperCount}</div>
                  <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Papers</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)]">
                  <div className="text-sm font-semibold text-[var(--accent)]">+{briefingData.topicCount}</div>
                  <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Domains</div>
                </div>
              </div>

              {/* Key Takeaway */}
              {briefingData.keyTakeaway && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                  {briefingData.keyTakeaway}
                </p>
              )}

              {/* Open Briefing CTA Button */}
              <button
                onClick={handleOpen}
                className="w-full py-2.5 px-4 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent)] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs group"
              >
                <span>Open Today&apos;s Briefing</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </MotionCard3D>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
