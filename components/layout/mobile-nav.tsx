"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Compass,
  BookOpen,
  Bookmark,
  Menu,
  X,
  History,
  FileText,
  TrendingUp,
  Hash,
  User,
  Settings,
  ChevronRight,
} from "lucide-react";
import { bottomSheetVariants, backdropVariants } from "@/lib/motion";
import { LunorLogo } from "@/components/brand/lunor-logo";

export function MobileNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Lock body scroll when more drawer is open
  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMoreOpen]);

  const primaryItems = [
    { label: "Today", href: "/", icon: Sparkles, match: (p: string) => p === "/" || p === "/today" },
    { label: "Discover", href: "/news", icon: Compass, match: (p: string) => p.startsWith("/news") },
    { label: "Research", href: "/research", icon: BookOpen, match: (p: string) => p.startsWith("/research") || p.startsWith("/reader") },
    { label: "Saved", href: "/favorites", icon: Bookmark, match: (p: string) => p.startsWith("/favorites") || p.startsWith("/reading-list") },
  ];

  const moreItems = [
    {
      label: "Topics Directory",
      href: "/topics",
      description: "14 core computer science disciplines",
      icon: Hash,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "10-Day Archive",
      href: "/archive",
      description: "Historical daily intelligence snapshots",
      icon: History,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Captured Notes",
      href: "/notes",
      description: "Personal highlights and research memos",
      icon: FileText,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Reading Insights",
      href: "/insights",
      description: "Reading habit heatmap and analytics",
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Account & Settings",
      href: "/profile",
      description: "Preferences and notification configuration",
      icon: Settings,
      color: "text-slate-600 bg-slate-100",
    },
  ];

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Fixed Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-white/95 backdrop-blur-md px-1 pt-1.5 font-sans shadow-navbar"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-transform active:scale-95 ${
                  active
                    ? "text-[var(--accent)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="leading-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* 5th Item: More Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-expanded={isMoreOpen}
            aria-label="More navigation options"
            className={`w-full min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-transform active:scale-95 ${
              isMoreActive || isMoreOpen
                ? "text-[var(--accent)] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <div
              className={`p-1.5 rounded-lg transition-colors ${
                isMoreActive || isMoreOpen ? "bg-[var(--accent-soft)] text-[var(--accent)]" : ""
              }`}
            >
              <Menu className="h-4 w-4" />
            </div>
            <span className="leading-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Drawer / Bottom Sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end font-sans">
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Bottom Sheet Surface */}
            <motion.div
              variants={bottomSheetVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="relative w-full max-h-[85vh] bg-white rounded-t-3xl border-t border-[var(--border)] shadow-2xl p-5 overflow-y-auto z-10 space-y-4"
              style={{
                paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
              }}
            >
              {/* Grab Handle */}
              <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--surface-soft)]">
                <div className="flex items-center gap-2.5">
                  <LunorLogo size={28} />
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      Lunor Workspace
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Explore deeper technical intelligence modules
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-soft)] active:scale-95 touch-target"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Links List with 48px touch targets */}
              <div className="space-y-1.5">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                        isActive
                          ? "bg-[var(--surface-soft)] border-[var(--border)] font-semibold text-[var(--text-primary)]"
                          : "border-transparent hover:bg-[var(--surface-soft)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2.5 rounded-xl ${item.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {item.label}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {item.description}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

