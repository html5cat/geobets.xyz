import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const photosDir = path.join(process.cwd(), "..", "photos");
  let files: string[] = [];
  try {
    files = fs.readdirSync(photosDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  } catch {}
  return NextResponse.json({ files });
}
