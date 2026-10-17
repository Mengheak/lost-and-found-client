export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateReport(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Invalid report.";
  const v = value as Record<string, unknown>;
  if (v.type !== "LOST" && v.type !== "FOUND") return "Choose lost or found.";
  if (typeof v.name !== "string" || !v.name.trim() || v.name.length > 255)
    return "Enter an item name (up to 255 characters).";
  if (
    typeof v.categoryId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.categoryId)
  )
    return "Choose a category.";
  for (const [key, max] of Object.entries({
    description: 10000,
    brand: 100,
    color: 50,
    storageLocation: 255,
  })) {
    if (v[key] != null && (typeof v[key] !== "string" || (v[key] as string).length > max))
      return `Check ${key} (maximum ${max} characters).`;
  }
  for (const [key, max] of [
    ["locationLat", 90],
    ["locationLng", 180],
  ] as const) {
    if (
      v[key] != null &&
      (typeof v[key] !== "number" || !Number.isFinite(v[key]) || Math.abs(v[key] as number) > max)
    )
      return "Enter valid location coordinates.";
  }
  if ((v.locationLat == null) !== (v.locationLng == null))
    return "Provide both latitude and longitude.";
  if (
    v.dateTime != null &&
    (typeof v.dateTime !== "string" || !Number.isFinite(Date.parse(v.dateTime)))
  )
    return "Enter a valid date and time.";
  if (
    v.rewardAmount != null &&
    (v.type !== "LOST" ||
      typeof v.rewardAmount !== "number" ||
      !Number.isFinite(v.rewardAmount) ||
      v.rewardAmount < 0)
  )
    return "Enter a valid reward for a lost item.";
  if (v.storageLocation != null && v.type !== "FOUND")
    return "Storage location is only for found items.";
  if (v.photoUrls != null) return "Upload photos using the file picker.";
  return null;
}

export function validatePhotos(files: File[]): string | null {
  if (files.length > MAX_PHOTOS) return "Choose up to 10 photos.";
  if (files.some((file) => !PHOTO_TYPES.includes(file.type))) return "Use JPG, PNG or WebP photos.";
  if (files.some((file) => file.size === 0 || file.size > MAX_PHOTO_BYTES))
    return "Each photo must be nonempty and no larger than 5 MB.";
  return null;
}
