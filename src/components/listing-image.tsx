"use client";

import { useState } from "react";
import { ImageSquare } from "@phosphor-icons/react/dist/ssr";

interface ListingImageProps {
  src: string;
  alt: string;
  compact?: boolean;
  fill?: boolean;
}

export function ListingImage({ src, alt, compact = false, fill = false }: ListingImageProps) {
  const [failed, setFailed] = useState(false);

  const heightClass = fill ? "h-full" : compact ? "h-40" : "h-48";

  if (failed) {
    return (
      <div className={`relative w-full flex flex-col items-center justify-center bg-gradient-to-br from-surface to-brand-secondary/5 border-b border-border/50 ${heightClass}`}>
        <ImageSquare weight="duotone" className="w-12 h-12 text-text-muted/25 mb-2" />
        <span className="text-xs font-medium text-text-muted/40">Photo coming soon</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden bg-surface ${fill ? "" : "border-b border-border/50"} ${heightClass}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
