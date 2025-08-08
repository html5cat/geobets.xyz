/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MapContainer, TileLayer, Marker, useMapEvents} from "react-leaflet";
import L, { type DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  onPick: (p: { lat: number; lon: number }) => void;
  marker?: { lat: number; lon: number };
};

function ClickCapture({ onPick }: { onPick: Props["onPick"] }) {
  useMapEvents({
    click(e: any) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

const CustomIcon: DivIcon = L.divIcon({
  className: "",
  html: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='black' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z'/><circle cx='12' cy='11' r='2'/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function LeafletMap({ onPick, marker }: Props) {
  const center: [number, number] = [20, 0];
  return (
    <MapContainer center={center} zoom={2} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickCapture onPick={onPick} />
      {marker ? <Marker position={[marker.lat, marker.lon]} icon={CustomIcon as any} /> : null}
    </MapContainer>
  );
}


