"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { GEO_TOKEN_ADDRESS, geoTokenAbi } from "@/lib/contracts";

export default function ProfilePage() {
  const { address } = useAccount();
  const { data: balance } = useReadContract({ address: GEO_TOKEN_ADDRESS, abi: geoTokenAbi, functionName: "balanceOf", args: address ? [address] : undefined });
  const { writeContract } = useWriteContract();

  return (
    <main className="p-6 grid gap-6">
      <h2 className="text-xl font-semibold">Profile</h2>
      <div className="grid gap-2">
        <div>Address: {address || "(not connected)"}</div>
        <div>GEO Balance: {balance ? Number(balance) / 1e18 : 0}</div>
        <button className="px-3 py-1 border rounded w-fit" onClick={() => writeContract({ address: GEO_TOKEN_ADDRESS, abi: geoTokenAbi, functionName: "claim" })}>Claim GEO</button>
      </div>
      <div>
        <h3 className="font-medium">Betting History</h3>
        <div className="text-sm text-neutral-500">Coming soon</div>
      </div>
    </main>
  );
}


