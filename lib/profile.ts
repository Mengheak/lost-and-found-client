export function validateProfile(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Invalid profile.";
  const profile = value as Record<string, unknown>;
  if (typeof profile.name !== "string" || !profile.name.trim() || profile.name.length > 255)
    return "Enter a name between 1 and 255 characters.";
  if (typeof profile.phone !== "string" || profile.phone.length > 50)
    return "Phone must be no longer than 50 characters.";
  if (profile.removePhoto != null && typeof profile.removePhoto !== "boolean")
    return "Invalid photo option.";
  return null;
}
