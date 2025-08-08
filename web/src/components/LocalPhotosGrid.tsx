"use client";
import { useEffect, useState } from "react";

export function LocalPhotosGrid() {
  const [files, setFiles] = useState<string[]>([]);
  useEffect(()=> { fetch('/api/photo-list').then(r=>r.json()).then(d=> setFiles(d.files||[])); }, []);
  if (!files.length) return null;
  return (
    <div>
      <h2 className="text-xl font-medium mt-8">Source Photos</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
        {files.map(f => (
          <div key={f} className="border rounded overflow-hidden bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/raw-photo?file=${encodeURIComponent(f)}`} alt={f} className="w-full h-32 object-cover" />
            <div className="text-[10px] p-1 truncate" title={f}>{f}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
