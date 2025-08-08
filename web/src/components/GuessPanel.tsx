"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther, keccak256, encodeAbiParameters, parseAbiParameters, toHex } from "viem";
import { GEO_TOKEN_ADDRESS, GEOBETS_GAME_ADDRESS, geoTokenAbi, geoBetsGameAbi } from "@/lib/contracts";
import { useGameStore } from "@/store/game";

type MapProps = { onPick: (p: { lat: number; lon: number }) => void; marker?: { lat: number; lon: number } };
const Map = dynamic<MapProps>(() => import("@/components/LeafletMap").then((m) => m.default), { ssr: false });

export function GuessPanel() {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const gameId = useGameStore((s) => s.gameId);
  const setGameId = useGameStore((s) => s.setGameId);
  const selectedImageId = useGameStore((s) => s.selectedImageId);
  const [amount, setAmount] = useState<string>("10");
  const [salt, setSalt] = useState<string>("");

  const { address } = useAccount();
  const { data: balance } = useReadContract({
    address: GEO_TOKEN_ADDRESS,
    abi: geoTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const { data: allowance } = useReadContract({
    address: GEO_TOKEN_ADDRESS,
    abi: geoTokenAbi,
    functionName: "allowance",
    args: address ? [address, GEOBETS_GAME_ADDRESS] : undefined as any,
  });
  // const decimals = 18n;
  const { writeContract, writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: isPendingTx } = useWaitForTransactionReceipt({ hash: txHash });

  const onPick = useCallback((p: { lat: number; lon: number }) => {
    setLat(p.lat);
    setLon(p.lon);
  }, []);

  const canSubmit = useMemo(() => lat !== null && lon !== null && gameId, [lat, lon, gameId]);

  return (
    <div className="grid gap-4">
      <div className="h-[420px] rounded overflow-hidden border">
        <Map onPick={onPick} marker={lat !== null && lon !== null ? { lat, lon } : undefined} />
      </div>
      <div className="flex items-center gap-4">
        <input className="border rounded px-2 py-1 flex-1" placeholder="Game ID" value={gameId} onChange={(e) => setGameId(e.target.value)} />
        <div className="text-sm">Image: {selectedImageId || "(none)"}</div>
      </div>
      <div className="flex items-center gap-4">
        <input className="border rounded px-2 py-1 w-40" placeholder="Amount GEO" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button className="px-3 py-1 border rounded" onClick={() => writeContract({ address: GEO_TOKEN_ADDRESS, abi: geoTokenAbi, functionName: "claim" })}>Claim GEO</button>
        <div className="text-sm text-neutral-600">Bal: {balance ? Number(balance) / 1e18 : 0}</div>
        {(() => {
          const needed = Number(amount || '0');
          const allowed = allowance ? Number(allowance) / 1e18 : 0;
          if (needed > 0 && allowed < needed) {
            return (
              <button className="px-3 py-1 border rounded" onClick={() => writeContract({ address: GEO_TOKEN_ADDRESS, abi: geoTokenAbi, functionName: 'approve', args: [GEOBETS_GAME_ADDRESS, BigInt(1e24)] })}>Approve</button>
            );
          }
          return null;
        })()}
      </div>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 border rounded"
          disabled={!canSubmit || isPendingTx}
          onClick={async () => {
            if (lat == null || lon == null) return;
            const saltHex = (salt && salt.startsWith("0x") ? salt : toHex(salt || crypto.getRandomValues(new Uint8Array(32)) as unknown as string)) as `0x${string}`;
            setSalt(saltHex);
            const encoded = encodeAbiParameters(parseAbiParameters("int32,int32,bytes32"), [
              Math.trunc(lat * 1e6),
              Math.trunc(lon * 1e6),
              saltHex,
            ]);
            const betCommit = keccak256(encoded);
            const hash = await writeContractAsync({
              address: GEOBETS_GAME_ADDRESS,
              abi: geoBetsGameAbi,
              functionName: "commitGuess",
              args: [BigInt(gameId), betCommit, BigInt(parseEther(amount))],
            });
            // store off-chain bet metadata
            try {
              await fetch("/api/bets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId, player: address, amountWei: parseEther(amount).toString(), commit: betCommit, commitTx: hash, imageId: selectedImageId }),
              });
            } catch {}
          }}
        >
          {isPendingTx ? "Submitting…" : "Commit Guess"}
        </button>
        <button
          className="px-4 py-2 border rounded"
          disabled={!canSubmit || !salt || isPendingTx}
          onClick={async () => {
            if (lat == null || lon == null || !salt) return;
            writeContract({
              address: GEOBETS_GAME_ADDRESS,
              abi: geoBetsGameAbi,
              functionName: "revealGuess",
              args: [BigInt(gameId), Math.trunc(lat * 1e6), Math.trunc(lon * 1e6), salt as `0x${string}`],
            });
            // Persist reveal metadata off-chain
            try {
              await fetch('/api/bets', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ gameId, player: address, latE6: Math.trunc(lat * 1e6), lonE6: Math.trunc(lon * 1e6) }) });
            } catch {}
          }}
        >
          Reveal Guess
        </button>
      </div>
    </div>
  );
}


