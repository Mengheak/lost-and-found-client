"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import Image from "next/image";

export function ItemPhoto({ src, alt }: { src?: string; alt: string }) {
  const [failedSource, setFailedSource] = useState<string>();
  if (!src || failedSource === src) return <div className="item-photo photo-placeholder">
    <ImageOff size={32} aria-hidden="true" /><span>Photo unavailable</span></div>;

  return <Image 
            className="item-photo" 
            src={src} 
            alt={alt} 
            loading="lazy" 
            referrerPolicy="no-referrer" 
            width={1000}
            height={1000}
            onError={() => setFailedSource(src)} 
          />;
}
