export type Coordinates = { lat: string; lng: string };

export function parseCoordinates(value: Coordinates): [number, number] | null {
  if (!value.lat.trim() || !value.lng.trim()) return null;
  const lat = Number(value.lat);
  const lng = Number(value.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [lat, lng]
    : null;
}

export function mapCoordinates(lat: number, lng: number): Coordinates {
  return {
    lat: Math.max(-90, Math.min(90, lat)).toFixed(6),
    lng: (((((lng + 180) % 360) + 360) % 360) - 180).toFixed(6),
  };
}
