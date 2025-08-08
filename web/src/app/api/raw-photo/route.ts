import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) return NextResponse.json({ error: 'file_required' }, { status: 400 });
  if (!/^[A-Za-z0-9_.-]+$/.test(file)) return NextResponse.json({ error: 'bad_name' }, { status: 400 });
  const photosDir = path.join(process.cwd(), "..", "photos");
  const full = path.join(photosDir, file);
  if (!full.startsWith(photosDir)) return NextResponse.json({ error: 'bad_path' }, { status: 400 });
  try {
    const data = fs.readFileSync(full);
    const ext = file.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return new NextResponse(data, { status: 200, headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
}
