"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { GuessPanel } from "@/components/GuessPanel";

export default function ImageGamePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const [img, setImg] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch("/api/images").then((r) => r.json()).then((d) => {
      const f = (d.images as Array<{ id: string; url: string }>).find((x) => x.id === id);
      setImg(f || null);
    });
  }, [id]);

  if (!img) return <div className="p-6">Loading…</div>;

  return (
    <main className="p-6 grid gap-6">
      <img src={img.url} alt={img.id} className="w-full max-h-[420px] object-contain bg-white rounded border" />
      <GuessPanel />
    </main>
  );
}


