"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

export function ItemPhoto({ src, alt }: { src?: string; alt: string }) {
  const [failedSource, setFailedSource] = useState<string>();
  if (!src || failedSource === src) return <div className="item-photo photo-placeholder"><ImageOff size={32} aria-hidden="true" /><span>Photo unavailable</span></div>;
  // Signed storage URLs must be requested directly, without Next's image cache.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="item-photo" src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedSource(src)} />;
}
