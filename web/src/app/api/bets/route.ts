import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bets } from "@/db/schema";

export async function POST(req: NextRequest) {
  const { gameId, player, amountWei, commit, commitTx, imageId } = await req.json();
  if (!gameId || !player || !amountWei || !commit) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  await db.insert(bets).values({
    id: `${gameId}:${player}`,
    gameId: Number(gameId),
    player,
    amountWei: BigInt(amountWei),
    commit,
    commitTx,
  });
  return NextResponse.json({ ok: true });
}


