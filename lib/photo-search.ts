import type { Item } from "./items";
import { validatePhotos } from "./report-item";

export interface PhotoSearchResults {
  matches: { item: Item; score: number }[];
}

export function validateSearchPhoto(files: File[]): string | null {
  if (files.length !== 1) return "Choose one photo to search.";
  return validatePhotos(files);
}

export function photoSearchError(status: number): string {
  if ([400, 413, 415, 422].includes(status))
    return "Use a valid JPG, PNG or WebP photo, up to 5 MB and 20 million pixels.";
  if (status === 429) return "Too many searches. Please wait a moment and try again.";
  return "Photo search is temporarily unavailable. Please try again.";
}
