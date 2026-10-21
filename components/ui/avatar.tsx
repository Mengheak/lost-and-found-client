"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import Image from "next/image";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "lg";
  decorative?: boolean;
};

export function Avatar({ src, name, size = "sm", decorative = false }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const photo = src?.trim();
  const showPhoto = !!photo && /^https?:\/\//i.test(photo) && failedSource !== photo;

  return (
    <span className={`user-avatar user-avatar--${size}`}>
      {showPhoto ? (
        // Google and signed storage URLs are loaded directly, without an image proxy cache.
        <Image
          unoptimized
          src={photo.toString()}
          alt={decorative ? "" : `${name}'s profile photo`}
          width={size === "lg" ? 96 : 32}
          height={size === "lg" ? 96 : 32}
          referrerPolicy="no-referrer"
          onError={() => setFailedSource(photo)}
        />
      ) : (
        <span
          className="user-avatar-fallback"
          role={decorative ? undefined : "img"}
          aria-label={decorative ? undefined : `${name}'s profile`}
          aria-hidden={decorative || undefined}
        >
          <UserRound size={size === "lg" ? 40 : 18} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
