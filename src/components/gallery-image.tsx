"use client";

import { useState } from "react";
import { ImageSquare } from "@phosphor-icons/react/dist/ssr";

interface GalleryImageProps {
  src: string;
  alt: string;
}

function ensureHttps(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

export function GalleryImage({ src, alt }: GalleryImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface to-brand-secondary/5">
        <ImageSquare weight="duotone" className="w-10 h-10 text-text-muted/20 mb-1" />
        <span className="text-xs text-text-muted/30 font-medium">Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={ensureHttps(src)}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
