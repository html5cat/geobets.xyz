"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  onPick: (p: { lat: number; lon: number }) => void;
  marker?: { lat: number; lon: number };
};

function ClickCapture({ onPick }: { onPick: Props["onPick"] }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

export default function LeafletMap({ onPick, marker }: Props) {
  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickCapture onPick={onPick} />
      {marker ? <Marker position={[marker.lat, marker.lon]} /> : null}
    </MapContainer>
  );
}


