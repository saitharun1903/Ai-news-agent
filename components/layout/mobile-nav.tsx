"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Compass, BookOpen, Bookmark, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Today", href: "/", icon: Sparkles },
    { label: "Discover", href: "/news", icon: Compass },
    { label: "Research", href: "/research", icon: BookOpen },
    { label: "Saved", href: "/favorites", icon: Bookmark },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-white/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around font-sans shadow-navbar"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              active
                ? "text-[var(--accent)] font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <div className={`p-1 rounded-md transition-colors ${active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : ""}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
