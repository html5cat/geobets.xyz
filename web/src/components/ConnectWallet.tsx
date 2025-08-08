"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWallet() {
  const { address } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">{address.slice(0, 6)}…{address.slice(-4)}</span>
        <button className="px-3 py-1 rounded border" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  const portoConnector = connectors.find((c) => c.name.toLowerCase().includes("porto"));
  return (
    <button
      className="px-3 py-1 rounded border"
      onClick={() => portoConnector && connect({ connector: portoConnector })}
      disabled={isPending}
    >
      {isPending ? "Connecting…" : "Connect"}
    </button>
  );
}


