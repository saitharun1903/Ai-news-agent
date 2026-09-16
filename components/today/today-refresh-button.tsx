"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TodayRefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={refreshing}
      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] px-5 py-2.5 text-sm font-semibold shadow-sm transition-all"
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      <span>{refreshing ? "Checking Feed..." : "Check Again"}</span>
    </Button>
  );
}
