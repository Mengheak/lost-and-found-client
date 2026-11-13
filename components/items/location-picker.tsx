"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseCoordinates, type Coordinates } from "@/lib/location";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <p role="status">Loading map…</p>,
});

export function LocationPicker({
  value,
  onChange,
  onLocate,
  locating,
  disabled,
  editing,
  error,
}: {
  value: Coordinates;
  onChange: (value: Coordinates) => void;
  onLocate: () => void;
  locating: boolean;
  disabled: boolean;
  editing: boolean;
  error: string;
}) {
  const point = parseCoordinates(value);
  return (
    <section className="section-stack location-picker" aria-labelledby="location-heading">
      <div>
        <h3 id="location-heading">Item location (optional)</h3>
        <p className="muted">
          Choose where the item was lost or found. This pin will be public; an approximate location
          is fine.
        </p>
      </div>
      <Button variant="secondary" onClick={onLocate} loading={locating} disabled={disabled}>
        <MapPin size={18} aria-hidden="true" /> Use my current location
      </Button>
      <LocationMap value={value} onChange={onChange} disabled={disabled || locating} />
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <p role="status" className="muted">
        {point
          ? `Location selected: ${point[0].toFixed(5)}, ${point[1].toFixed(5)}`
          : "No location selected. Choose a point on the map or use your current location."}
      </p>
      {!editing && (value.lat || value.lng) && (
        <Button
          variant="ghost"
          disabled={disabled || locating}
          onClick={() => onChange({ lat: "", lng: "" })}
        >
          Remove location
        </Button>
      )}
      <details>
        <summary>Enter coordinates manually</summary>
        <div className="report-grid">
          <Input
            label="Latitude"
            type="number"
            min={-90}
            max={90}
            step="any"
            value={value.lat}
            disabled={disabled || locating}
            onChange={(e) => onChange({ ...value, lat: e.target.value })}
          />
          <Input
            label="Longitude"
            type="number"
            min={-180}
            max={180}
            step="any"
            value={value.lng}
            disabled={disabled || locating}
            onChange={(e) => onChange({ ...value, lng: e.target.value })}
          />
        </div>
      </details>
    </section>
  );
}
