"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";

export type LatLng = { lat: number; lng: number };

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
  }, [value, map]);
  return null;
}

export default function MapPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
}) {
  // A fresh map is created every time the component is shown, and destroyed when it is hidden.
  const [mountId, setMountId] = useState(0);

  useEffect(() => {
    setMountId((n) => n + 1);
    return () => setMountId(0);
  }, []);

  if (mountId === 0) {
    return <div className="skeleton h-[320px] rounded-2xl" role="status" aria-label="Loading map" />;
  }

  return (
    <MapContainer
      key={mountId}
      center={[33.6, 73.05]}
      zoom={11}
      scrollWheelZoom
      className="relative z-0 h-[320px] w-full rounded-2xl border border-gray-200"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      <Recenter value={value} />
      {value && (
        <CircleMarker
          center={[value.lat, value.lng]}
          radius={11}
          pathOptions={{ color: "#0b4f44", fillColor: "#f5a524", fillOpacity: 1, weight: 4 }}
        />
      )}
    </MapContainer>
  );
}