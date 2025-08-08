import { db } from "./index";
import { images } from "./schema";
import { eq } from "drizzle-orm";

const STOCK: Array<{
  id: string;
  title: string;
  publicUrl: string;
  storageKey: string;
  latE6: number;
  lonE6: number;
}> = [
  {
    id: "nyc_times_square",
    title: "Times Square, NYC",
    publicUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200",
    storageKey: "stock/nyc_times_square.jpg",
    latE6: 40758600,
    lonE6: -73985100,
  },
  {
    id: "paris_eiffel",
    title: "Eiffel Tower, Paris",
    publicUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200",
    storageKey: "stock/paris_eiffel.jpg",
    latE6: 48858000,
    lonE6: 2249400,
  },
  {
    id: "tokyo_shibuya",
    title: "Shibuya Crossing, Tokyo",
    publicUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200",
    storageKey: "stock/tokyo_shibuya.jpg",
    latE6: 35659400,
    lonE6: 139700400,
  },
  {
    id: "sydney_opera",
    title: "Sydney Opera House",
    publicUrl: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=1200",
    storageKey: "stock/sydney_opera.jpg",
    latE6: -33857000,
    lonE6: 151215300,
  },
];

async function main() {
  for (const it of STOCK) {
    const existing = await db.select().from(images).where(eq(images.id, it.id));
    if (existing.length === 0) {
      await db.insert(images).values(it);
      console.log("Inserted:", it.id);
    } else {
      console.log("Exists:", it.id);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


