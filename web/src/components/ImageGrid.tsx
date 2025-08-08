"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useGameStore } from "@/store/game";

type Img = { id: string; url: string };
type Game = { id: number; imageId: string; commitDeadline: number };

export function ImageGrid() {
  const [images, setImages] = useState<Img[]>([]);
  const selected = useGameStore((s) => s.selectedImageId);
  const setSelectedImageId = useGameStore((s) => s.setSelectedImageId);
  const setGameId = useGameStore((s) => s.setGameId);
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    fetch("/api/games").then(r=>r.json()).then(d=> setGames(d.games || []));
  }, []);

  useEffect(() => {
    fetch("/api/images").then((r) => r.json()).then((d) => setImages(d.images || []));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-medium">Pick a photo</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
        {images.map((img) => {
          const openGames = games.filter(g=> g.imageId === img.id);
          const soonest = openGames.length ? Math.min(...openGames.map(g=> g.commitDeadline)) : null;
          const minsLeft = soonest ? Math.max(0, Math.floor((soonest*1000 - Date.now())/60000)) : null;
          return (
            <div key={img.id} className={`relative group border rounded overflow-hidden ${selected === img.id ? 'ring-2 ring-blue-500' : ''}`}>
              <Link href={`/images/${img.id}`} onClick={()=> setSelectedImageId(img.id)}>
                <img src={img.url} alt={img.id} className="w-full h-32 object-contain bg-white" />
              </Link>
              {openGames.length > 0 && (
                <div className="absolute top-1 left-1 text-[10px] bg-black/70 text-white px-1 rounded">
                  {openGames.length} open{minsLeft !== null && ` • ${minsLeft}m`}
                </div>
              )}
              <div className="absolute inset-0 flex flex-col justify-end gap-1 p-1 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/40 to-transparent">
                {openGames[0] && (
                  <button className="text-xs bg-white/90 rounded px-2 py-1" onClick={()=> { setGameId(String(openGames[0].id)); setSelectedImageId(img.id); location.href = `/images/${img.id}`; }}>Join</button>
                )}
                <button className="text-xs bg-white/90 rounded px-2 py-1" onClick={async ()=> {
                  setSelectedImageId(img.id);
                  const r = await fetch('/api/games', { method:'POST', headers:{'Content-Type':'application/json', 'x-server-key': process.env.NEXT_PUBLIC_SERVER_KEY || ''}, body: JSON.stringify({ imageId: img.id })});
                  const d = await r.json();
                  if (d.gameId) { setGameId(String(d.gameId)); location.href = `/images/${img.id}`; }
                }}>Start</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


