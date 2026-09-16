"use client";

import React, { useState } from "react";
import { AppNavbar } from "@/components/layout/app-navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { DesktopBriefingPopup } from "@/components/layout/desktop-briefing-popup";
import { PageTransition } from "@/components/motion/page-transition";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

  // Expose global opener for Cmd+K
  if (typeof window !== "undefined") {
    (window as any).__openCommandPalette = () => setCommandOpen(true);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col font-sans antialiased selection:bg-blue-600/15 selection:text-blue-900">
      {/* Top Application Navbar */}
      <AppNavbar
        onOpenSearch={() => setCommandOpen(true)}
        onOpenBriefing={() => {
          window.location.href = "/today";
        }}
      />

      {/* Main Centered Content Workspace */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-12">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Command Palette */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Desktop Briefing Popup */}
      <DesktopBriefingPopup
        onOpenFullBriefing={() => {
          window.location.href = "/today";
        }}
      />
    </div>
  );
}
