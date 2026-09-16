"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { dropdownVariants } from "@/lib/motion";
import { LunorLogo } from "@/components/brand/lunor-logo";
import {
  Search,
  Bookmark,
  Bell,
  User,
  ChevronDown,
  History,
  FileText,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface AppNavbarProps {
  onOpenSearch?: () => void;
  onOpenBriefing?: () => void;
}

export function AppNavbar({ onOpenSearch, onOpenBriefing }: AppNavbarProps) {
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on click outside or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  const primaryNavItems = [
    { label: "Today", href: "/", match: (p: string) => p === "/" || p === "/today" },
    { label: "Discover", href: "/news", match: (p: string) => p.startsWith("/news") },
    { label: "Research", href: "/research", match: (p: string) => p.startsWith("/research") || p.startsWith("/reader") },
    { label: "Topics", href: "/topics", match: (p: string) => p.startsWith("/topics") },
    { label: "Saved", href: "/favorites", match: (p: string) => p.startsWith("/favorites") || p.startsWith("/reading-list") },
  ];

  const secondaryNavItems = [
    {
      label: "Archive",
      href: "/archive",
      description: "10-day rolling snapshot archive",
      icon: History,
      match: (p: string) => p.startsWith("/archive"),
    },
    {
      label: "Notes",
      href: "/notes",
      description: "Personal highlights and memos",
      icon: FileText,
      match: (p: string) => p.startsWith("/notes"),
    },
    {
      label: "Insights",
      href: "/insights",
      description: "Reading habit metrics and streak heatmap",
      icon: TrendingUp,
      match: (p: string) => p.startsWith("/insights"),
    },
  ];

  const isSecondaryActive = secondaryNavItems.some((item) => item.match(pathname));

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 bg-white/95 backdrop-blur-md border-b border-[var(--border)] ${
        hasScrolled ? "shadow-navbar" : ""
      }`}
    >
      <div className="max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-xl py-1 touch-target"
            aria-label="Lunor Home"
          >
            <LunorLogo size={32} />
            <span className="font-bold text-base sm:text-lg tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              Lunor
            </span>
          </Link>
        </div>

        {/* Center: Primary Horizontal Navigation + More Dropdown */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-[var(--surface-soft)] p-1 rounded-xl border border-[var(--border)]"
        >
          {primaryNavItems.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 lg:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "text-[var(--text-primary)] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {/* Smooth shared active pill background */}
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-lg bg-white shadow-2xs z-0"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                {/* Active accent dot indicator */}
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-dot"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-[var(--accent)] z-10"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}

          {/* More Dropdown (Secondary Navigation) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              aria-expanded={isMoreOpen}
              aria-haspopup="true"
              className={`relative flex items-center gap-1 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSecondaryActive
                  ? "text-[var(--text-primary)] font-semibold"
                  : isMoreOpen
                  ? "bg-white/80 text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {isSecondaryActive && (
                <motion.span
                  layoutId="navbar-active-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-2xs z-0"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">More</span>
              <ChevronDown
                className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-150 relative z-10 ${
                  isMoreOpen ? "rotate-180" : ""
                }`}
              />
              {isSecondaryActive && (
                <motion.span
                  layoutId="navbar-active-dot"
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-[var(--accent)] z-10"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
            </button>

            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  role="menu"
                  variants={dropdownVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="absolute left-0 mt-2 w-64 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-lg z-50 font-sans"
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Workspace
                  </div>
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.match(pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setIsMoreOpen(false)}
                        className={`flex items-start gap-3 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                          isActive
                            ? "bg-[var(--surface-soft)] text-[var(--text-primary)] font-semibold"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-md mt-0.5 ${
                            isActive
                              ? "bg-[var(--accent)] text-white"
                              : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] leading-tight font-normal">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--surface-soft)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-2xs font-sans group active:scale-95 touch-target"
            title="Search"
            aria-label="Search papers and news"
          >
            <Search className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
            <span className="font-medium">Search</span>
          </button>

          {/* Daily Briefing / Notifications Trigger */}
          <button
            type="button"
            onClick={onOpenBriefing}
            className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"
            title="Today's Briefing"
            aria-label="Today's Briefing"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          </button>

          {/* Profile / Settings */}
          <Link
            href="/profile"
            className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent ${
              pathname.startsWith("/profile") || pathname.startsWith("/settings")
                ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border-[var(--accent)]/20"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
            }`}
            title="Profile & Settings"
          >
            <div className="h-6 w-6 rounded-full bg-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center font-semibold text-[11px]">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="hidden md:inline text-xs">Account</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
