import React from "react";
import Link from "next/link";
import { LunorLogo } from "@/components/brand/lunor-logo";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center font-sans space-y-6">
      <LunorLogo size="lg" className="mx-auto" />
      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
          404 · Page Not Found
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Lost in the Frontier
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          The research page or publication you requested could not be located. Explore today&apos;s briefing or return to the intelligence feed.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href="/">
          <Button className="gap-2 bg-[var(--text-primary)] text-white hover:bg-[var(--accent)] rounded-xl font-semibold shadow-xs text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Lunor</span>
          </Button>
        </Link>
        <Link href="/news">
          <Button variant="outline" className="gap-2 border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-soft)] rounded-xl font-semibold text-xs">
            <Compass className="h-4 w-4 text-[var(--accent)]" />
            <span>Discover News</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
