"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapCoordinates, parseCoordinates, type Coordinates } from "@/lib/location";
import { Button } from "@/components/ui/button";

export default function LocationMap({
  value,
  onChange,
  disabled,
}: {
  value: Coordinates;
  onChange: (value: Coordinates) => void;
  disabled: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { scrollWheelZoom: false }).setView(
      [11.5564, 104.9282],
      6,
    );
    map.current = instance;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on("tileerror", () => setTileError(true))
      .addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const select = (event: L.LeafletMouseEvent) => {
      if (!disabled) onChange(mapCoordinates(event.latlng.lat, event.latlng.lng));
    };
    instance.on("click", select);
    return () => {
      instance.off("click", select);
    };
  }, [disabled, onChange]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const point = parseCoordinates(value);
    if (!point) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      marker.current = L.marker(point, {
        icon: L.divIcon({
          className: "location-pin",
          html: '<span aria-hidden="true"></span>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        title: "Selected report location",
        alt: "Selected report location",
      }).addTo(instance);
    } else marker.current.setLatLng(point);
    instance.setView(point, Math.max(instance.getZoom(), 15), { animate: false });
  }, [value]);

  return (
    <div className="section-stack">
      <div
        ref={container}
        className="location-map"
        role="region"
        aria-label="Choose report location on map"
        aria-describedby="location-map-help"
      />
      <p id="location-map-help" className="muted">
        Tap the map to place a pin. You can also focus the map, use arrow keys to move, then select
        the center.
      </p>
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={() => {
          const center = map.current?.getCenter();
          if (center) onChange(mapCoordinates(center.lat, center.lng));
        }}
      >
        Use map center
      </Button>
      {tileError && (
        <p role="status">
          Some map tiles could not load. You can still use your current location or enter
          coordinates below.
        </p>
      )}
    </div>
  );
}
