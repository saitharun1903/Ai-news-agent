"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, Layers } from "lucide-react";

export interface VisualImageProps {
  src?: string;
  alt?: string;
  entityType?: "article" | "paper" | "project" | "topic" | "group" | "articleGroup" | string;
  entityId?: string;
  fallbackTitle?: string;
  fallbackTopic?: string;
  aspectRatio?: "16:9" | "4:3" | "3:2" | "1:1" | "wide";
  sourceType?: "official" | "project" | "paper_figure" | "generated";
  className?: string;
  showBadge?: boolean;
  priority?: boolean;
  onUnavailable?: () => void;
}

export function VisualImage({
  src: initialSrc,
  alt: initialAlt,
  entityType,
  entityId,
  fallbackTitle,
  fallbackTopic,
  aspectRatio = "16:9",
  sourceType: initialSourceType = "generated",
  className = "",
  showBadge = true,
  priority = false,
  onUnavailable,
}: VisualImageProps) {
  const [src, setSrc] = useState<string | undefined>(initialSrc);
  const [alt, setAlt] = useState<string>(initialAlt || fallbackTitle || "Technical Visualization");
  const [sourceType, setSourceType] = useState(initialSourceType);
  const [loaded, setLoaded] = useState(false);
  const [hasAttemptedFallback, setHasAttemptedFallback] = useState(false);

  const ratioClass = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "3:2": "aspect-[3/2]",
    "1:1": "aspect-square",
    wide: "aspect-[21/9]",
  }[aspectRatio];

  useEffect(() => {
    if (initialSrc) {
      setSrc(initialSrc);
      return;
    }

    if (entityType && entityId) {
      let active = true;
      fetch(`/api/visuals?entityType=${entityType}&entityId=${entityId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Visual not found");
          return res.json();
        })
        .then((data) => {
          if (active && data?.url) {
            setSrc(data.url);
            if (data.altText) setAlt(data.altText);
            if (data.sourceType) setSourceType(data.sourceType);
          }
        })
        .catch(() => {
          if (active) {
            // Fallback to topic-based generated visual from API
            const safeTopic = encodeURIComponent(fallbackTopic || "computing");
            const safeTitle = encodeURIComponent(fallbackTitle || alt);
            setSrc(`/api/visuals?entityType=topic&entityId=${safeTopic}&title=${safeTitle}`);
            setSourceType("generated");
          }
        });

      return () => {
        active = false;
      };
    }
  }, [initialSrc, entityType, entityId, fallbackTopic, fallbackTitle, alt]);

  // Handle image load error: try technical fallback or notify parent for typography-first card
  const handleError = () => {
    if (!hasAttemptedFallback) {
      setHasAttemptedFallback(true);
      // Attempt contextual technical SVG endpoint
      const safeTopic = encodeURIComponent(fallbackTopic || "systems");
      const safeTitle = encodeURIComponent(fallbackTitle || alt);
      setSrc(`/api/visuals?entityType=topic&entityId=${safeTopic}&title=${safeTitle}`);
      setSourceType("generated");
    } else {
      // If even fallback fails, notify parent to switch to typography-first layout
      if (onUnavailable) {
        onUnavailable();
      }
    }
  };

  // If no source and no entity, do not render a broken placeholder rectangle
  if (!src && !entityType && !fallbackTitle) {
    return null;
  }

  const isDataUri = src?.startsWith("data:");

  return (
    <div
      className={`relative w-full ${ratioClass} rounded-2xl overflow-hidden bg-[var(--surface-soft)] border border-[var(--border)] select-none group ${className}`}
    >
      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-[var(--surface-soft)] animate-pulse flex items-center justify-center">
          <Layers className="h-5 w-5 text-[var(--accent)] opacity-40 animate-spin" />
        </div>
      )}

      {src && (
        isDataUri ? (
          // SVG Data URIs render natively in standard img without Next.js optimization pipeline
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.01] ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            className={`object-cover transition-all duration-300 group-hover:scale-[1.01] ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            unoptimized={src.includes("githubassets.com") || src.includes(".svg")}
          />
        )
      )}

      {/* Subtle Source Badge */}
      {showBadge && loaded && sourceType === "generated" && (
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-[var(--border)] text-[10px] font-semibold text-[var(--accent)] shadow-xs flex items-center gap-1 pointer-events-none">
          <Sparkles className="h-2.5 w-2.5 text-[var(--accent)]" />
          <span>Technical Diagram</span>
        </div>
      )}

      {showBadge && loaded && sourceType === "official" && (
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-[var(--border)] text-[10px] font-semibold text-[var(--text-primary)] shadow-xs flex items-center gap-1 pointer-events-none">
          <span>Official Source Visual</span>
        </div>
      )}

      {showBadge && loaded && sourceType === "project" && (
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-[var(--border)] text-[10px] font-semibold text-[var(--text-primary)] shadow-xs flex items-center gap-1 pointer-events-none">
          <span>Repository Preview</span>
        </div>
      )}
    </div>
  );
}
