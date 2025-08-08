"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/store/game";

type Img = { id: string; url: string };

export function ImageGrid() {
  const [images, setImages] = useState<Img[]>([]);
  const selected = useGameStore((s) => s.selectedImageId);
  const setSelectedImageId = useGameStore((s) => s.setSelectedImageId);

  useEffect(() => {
    fetch("/api/images").then((r) => r.json()).then((d) => setImages(d.images || []));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-medium">Pick a photo</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
        {images.map((img) => (
          <Link
            key={img.id}
            href={`/images/${img.id}`}
            className={`border rounded overflow-hidden block ${selected === img.id ? 'ring-2 ring-blue-500' : ''}`}
          >
            <img src={img.url} alt={img.id} className="w-full h-32 object-contain bg-white" />
          </Link>
        ))}
      </div>
    </div>
  );
}


