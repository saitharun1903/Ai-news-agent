"use client";

import { useState, useEffect } from "react";

/**
 * Intelligent network-aware prefetching hook (Requirements 12 & 13)
 * If user is on 4G / Wi-Fi: returns true (prefetch allowed)
 * If user has Save-Data enabled or is on slow-2g / 2g: returns false (saves mobile bandwidth)
 */
export function useNetworkAwarePrefetch(): boolean {
  const [shouldPrefetch, setShouldPrefetch] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = (navigator as any).connection;
      if (
        conn?.saveData === true ||
        conn?.effectiveType === "slow-2g" ||
        conn?.effectiveType === "2g"
      ) {
        setShouldPrefetch(false);
      }
    }
  }, []);

  return shouldPrefetch;
}
