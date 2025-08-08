"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GuessPanel } from "@/components/GuessPanel";
import { useGameStore } from "@/store/game";
import { Countdown } from "@/components/Countdown";
import Image from "next/image";

export default function ImageGamePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const [img, setImg] = useState<{ id: string; url: string } | null>(null);
  const [games, setGames] = useState<Array<{ id:number; commitDeadline:number; revealDeadline:number }>>([]);
  const gameId = useGameStore(s=> s.gameId);
  const setGameId = useGameStore(s=> s.setGameId);
  const setDeadlines = useGameStore(s=> s.setDeadlines);

  useEffect(() => {
    if (!id) return;
    fetch("/api/images").then((r) => r.json()).then((d) => {
      const f = (d.images as Array<{ id: string; url: string }>).find((x) => x.id === id);
      setImg(f || null);
    });
    fetch(`/api/games?imageId=${id}`).then(r=>r.json()).then(d=> setGames(d.games || []));
  }, [id]);

  useEffect(()=> {
    if (games.length === 1 && !gameId) {
      const g = games[0];
      setGameId(String(g.id));
      setDeadlines(g.commitDeadline, g.revealDeadline);
    }
  }, [games, gameId, setGameId, setDeadlines]);

  if (!img) return <div className="p-6">Loading…</div>;

  return (
    <main className="p-6 grid gap-6">
      <Image src={img.url} alt={img.id} className="w-full max-h-[420px] object-contain bg-white rounded border" />
      {games.length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {games.map(g => (
            <button key={g.id} className={`px-2 py-1 border rounded ${String(g.id)===gameId ? 'bg-blue-600 text-white':'bg-white'}`} onClick={()=> { setGameId(String(g.id)); setDeadlines(g.commitDeadline, g.revealDeadline); }}>
              Game {g.id}
            </button>
          ))}
        </div>
      )}
      {gameId && (
        <div className="flex gap-4 text-sm">
          <Countdown target={games.find(g=> String(g.id)===gameId)?.commitDeadline || 0} label="Commit" />
          <Countdown target={games.find(g=> String(g.id)===gameId)?.revealDeadline || 0} label="Reveal" />
        </div>
      )}
      <GuessPanel />
    </main>
  );
}


