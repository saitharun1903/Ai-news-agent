"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Bookmark,
  Bell,
  User,
  Command,
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
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg py-1"
            aria-label="ResearchPulse Home"
          >
            <div className="h-8 w-8 rounded-lg bg-[var(--text-primary)] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs group-hover:bg-[var(--accent)] transition-colors">
              RP
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                ResearchPulse
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Primary Horizontal Navigation + More Dropdown */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-1 bg-[var(--surface-soft)] p-1 rounded-xl border border-[var(--border)]"
        >
          {primaryNavItems.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs transition-all font-medium ${
                  isActive
                    ? "bg-white text-[var(--text-primary)] font-semibold shadow-2xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-[var(--accent)]" />
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
              className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all font-medium ${
                isSecondaryActive
                  ? "bg-white text-[var(--text-primary)] font-semibold shadow-2xs"
                  : isMoreOpen
                  ? "bg-white/80 text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>More</span>
              <ChevronDown
                className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-150 ${
                  isMoreOpen ? "rotate-180" : ""
                }`}
              />
              {isSecondaryActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-[var(--accent)]" />
              )}
            </button>

            {isMoreOpen && (
              <div
                role="menu"
                className="absolute left-0 mt-2 w-64 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 z-50 font-sans"
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
                      <div className={`p-1.5 rounded-md mt-0.5 ${
                        isActive ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                      }`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
                        <span className="text-[11px] text-[var(--text-muted)] leading-tight font-normal">
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Search Trigger (Cmd+K) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--surface-soft)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-2xs font-sans group"
            title="Search (Cmd+K)"
            aria-label="Search papers and news"
          >
            <Search className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
            <span className="hidden sm:inline font-medium">Search</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-soft)] text-[var(--text-muted)] border border-[var(--border)]">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
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
