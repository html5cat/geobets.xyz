import { NextResponse } from "next/server";
import { db } from "@/db";
import { images } from "@/db/schema";

export async function GET() {
  const rows = await db.select({ id: images.id, url: images.publicUrl }).from(images);
  return NextResponse.json({ images: rows.map((r) => ({ id: r.id, url: r.url })) });
}


