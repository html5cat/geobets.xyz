import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { images, games as gamesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createWalletClient, createPublicClient, http, encodeAbiParameters, keccak256, parseAbiParameters, decodeEventLog } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { GEOBETS_GAME_ADDRESS, GEO_TOKEN_ADDRESS, geoBetsGameAbi } from "@/lib/contracts";

// Server deployer key to commit solution; DO NOT expose to client
const SERVER_PK = (process.env.SERVER_PRIVATE_KEY || "0x") as `0x${string}`;
const account = privateKeyToAccount(SERVER_PK);

const transport = http(process.env.BASE_SEPOLIA_RPC_HTTP);
const client = createWalletClient({ account, chain: baseSepolia, transport });
const pub = createPublicClient({ chain: baseSepolia, transport });

export async function POST(req: NextRequest) {
  const { imageId, commitMinutes = 15, revealMinutes = 30 } = await req.json();
  const [img] = await db.select().from(images).where(eq(images.id, imageId)).limit(1);
  if (!img) return NextResponse.json({ error: "image not found" }, { status: 404 });

  // Generate server secret
  const random = crypto.getRandomValues(new Uint8Array(32));
  const secret = ("0x" + Array.from(random).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;

  const now = Math.floor(Date.now() / 1000);
  const commitDeadline = now + commitMinutes * 60;
  const revealDeadline = now + revealMinutes * 60;

  // Construct solutionCommit = keccak256(abi.encode(latE6, lonE6, secret))
  const encoded = encodeAbiParameters(parseAbiParameters("int32 latE6, int32 lonE6, bytes32 secret"), [
    img.latE6,
    img.lonE6,
    secret as `0x${string}`,
  ]);
  const solutionCommit = keccak256(encoded);

  const hash = await client.writeContract({
    address: GEOBETS_GAME_ADDRESS,
    abi: geoBetsGameAbi,
    functionName: "createGame",
    args: [solutionCommit, GEO_TOKEN_ADDRESS, BigInt(commitDeadline), BigInt(revealDeadline)],
  });

  const receipt = await pub.waitForTransactionReceipt({ hash });
  let gameId: bigint | null = null;
  const gameCreatedAbi = [
    {
      type: "event",
      name: "GameCreated",
      inputs: [
        { name: "gameId", type: "uint256", indexed: true },
        { name: "host", type: "address", indexed: true },
        { name: "token", type: "address", indexed: false },
        { name: "commitDeadline", type: "uint64", indexed: false },
        { name: "revealDeadline", type: "uint64", indexed: false },
      ],
      anonymous: false,
    },
  ] as const;
  for (const log of receipt.logs) {
    try {
      const parsed = decodeEventLog({ abi: gameCreatedAbi, data: log.data, topics: log.topics });
      if (parsed.eventName === "GameCreated") {
        gameId = parsed.args.gameId;
        break;
      }
    } catch {}
  }

  if (gameId === null) {
    return NextResponse.json({ tx: hash, warning: "no_game_id_in_logs" });
  }

  // Store server-only details
  await db.insert(gamesTable).values({
    id: Number(gameId),
    imageId,
    hostAddress: account.address,
    solutionCommit,
    commitDeadline: Number(commitDeadline),
    revealDeadline: Number(revealDeadline),
    secret,
    solutionLatE6: img.latE6,
    solutionLonE6: img.lonE6,
  });

  return NextResponse.json({ tx: hash, gameId: String(gameId) });
}

export async function GET(req: NextRequest) {
  // /api/games?imageId=xyz returns open games for that image
  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");
  const now = Math.floor(Date.now() / 1000);
  if (imageId) {
    const rows = await db.select().from(gamesTable).where(eq(gamesTable.imageId, imageId));
    const live = rows.filter((g) => (g.commitDeadline as number) > now);
    return NextResponse.json({ games: live });
  }
  // List all live games
  const rows = await db.select().from(gamesTable);
  const live = rows.filter((g) => (g.commitDeadline as number) > now);
  return NextResponse.json({ games: live });
}


