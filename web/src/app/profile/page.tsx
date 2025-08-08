"use client";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";

type Bet = { gameId: number; player: string; amountWei: string; commitTx?: string; revealTx?: string; revealedLatE6?: number; revealedLonE6?: number; createdAt?: string };

export default function ProfilePage() {
  const { address } = useAccount();
  const [bets, setBets] = useState<Bet[]>([]);
  useEffect(()=> {
    if (!address) return;
    fetch(`/api/bets?player=${address}`).then(r=>r.json()).then(d=> setBets(d.bets || []));
  }, [address]);

  if (!address) return <div className="p-6">Connect wallet to view history.</div>;
  return (
    <main className="p-6 grid gap-6">
      <h1 className="text-xl font-semibold">Your Bets</h1>
      <table className="text-sm border-collapse">
        <thead>
          <tr className="text-left border-b"><th className="pr-4 py-1">Game</th><th className="pr-4">Amount GEO</th><th className="pr-4">Commit</th><th className="pr-4">Reveal</th><th>Status</th></tr>
        </thead>
        <tbody>
          {bets.map(b => {
            const amount = Number(b.amountWei) / 1e18;
            const status = b.revealTx ? 'Revealed' : 'Committed';
            return (
              <tr key={b.gameId+':'+b.player} className="border-b">
                <td className="pr-4 py-1">{b.gameId}</td>
                <td className="pr-4">{amount}</td>
                <td className="pr-4">{b.commitTx ? <Link className="underline" href={`https://sepolia.basescan.org/tx/${b.commitTx}`}>tx</Link> : '-'}</td>
                <td className="pr-4">{b.revealTx ? <Link className="underline" href={`https://sepolia.basescan.org/tx/${b.revealTx}`}>tx</Link> : '-'}</td>
                <td>{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}


