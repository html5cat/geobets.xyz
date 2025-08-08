import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bets } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { betsQuerySchema, createBetCommitSchema, revealPatchSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); } // eslint-disable-line @typescript-eslint/no-explicit-any
  const parsed = createBetCommitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request", issues: parsed.error.issues }, { status: 400 });
  const { gameId, player, amountWei, commit, commitTx } = parsed.data;
  await db.insert(bets).values({
    id: `${gameId}:${player}`,
    gameId: Number(gameId),
    player,
    amountWei: BigInt(amountWei),
    commit,
    commitTx,
  }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qp = Object.fromEntries(searchParams.entries());
  const parsed = betsQuerySchema.safeParse(qp);
  if (!parsed.success) return NextResponse.json({ error: "bad_request", issues: parsed.error.issues }, { status: 400 });
  const { player, game } = parsed.data;
  const whereClauses: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (player) whereClauses.push(eq(bets.player, player));
  if (game) whereClauses.push(eq(bets.gameId, Number(game)));
  let rows;
  if (whereClauses.length === 0) {
    rows = await db.select().from(bets).limit(100);
  } else if (whereClauses.length === 1) {
    rows = await db.select().from(bets).where(whereClauses[0]).limit(200);
  } else {
    rows = await db.select().from(bets).where(and(...whereClauses)).limit(200);
  }
  return NextResponse.json({ bets: rows });
}

export async function PATCH(req: NextRequest) {
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); } // eslint-disable-line @typescript-eslint/no-explicit-any
  const parsed = revealPatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request", issues: parsed.error.issues }, { status: 400 });
  const { gameId, player, latE6, lonE6, revealTx } = parsed.data;
  await db.update(bets).set({
    revealedLatE6: latE6,
    revealedLonE6: lonE6,
    revealTx: revealTx,
  }).where(and(eq(bets.gameId, Number(gameId)), eq(bets.player, player)));
  return NextResponse.json({ ok: true });
}


