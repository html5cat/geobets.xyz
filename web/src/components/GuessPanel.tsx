"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

const Map = dynamic(() => import("./LeafletMap"), { ssr: false });

export function GuessPanel() {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(5000); // bps

  const onPick = useCallback((p: { lat: number; lon: number }) => {
    setLat(p.lat);
    setLon(p.lon);
  }, []);

  const canSubmit = useMemo(() => lat !== null && lon !== null, [lat, lon]);

  return (
    <div className="grid gap-4">
      <div className="h-[420px] rounded overflow-hidden border">
        <Map onPick={onPick} marker={lat !== null && lon !== null ? { lat, lon } : undefined} />
      </div>
      <div className="flex items-center gap-4">
        <label className="text-sm w-32">Confidence</label>
        <input
          type="range"
          min={0}
          max={10000}
          step={100}
          value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value))}
          className="flex-1"
        />
        <span className="w-16 text-right text-sm">{(confidence / 100).toFixed(0)}%</span>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 border rounded" disabled={!canSubmit}>Commit Guess</button>
        <button className="px-4 py-2 border rounded" disabled={!canSubmit}>Reveal Guess</button>
      </div>
    </div>
  );
}


