import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface PinMarkerProps {
  position: [number, number];
  color: string;
  label?: string;
}

function createPinIcon(color: string): L.DivIcon {
  const svg = `
    <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
      <circle cx="14" cy="14" r="3" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

export function PinMarker({ position, color, label }: PinMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    const icon = createPinIcon(color);
    const marker = L.marker(position, { icon }).addTo(map);

    if (label) {
      marker.bindPopup(label);
    }

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [position, color, label, map]);

  return null;
}
