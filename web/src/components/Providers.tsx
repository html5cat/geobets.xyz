"use client";

import { PropsWithChildren } from "react";
import { createConfig, WagmiProvider, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { porto } from "porto/wagmi";

const baseSepoliaRpc = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_HTTP;

const config = createConfig({
  chains: [baseSepolia],
  connectors: [porto()],
  transports: {
    [baseSepolia.id]: http(baseSepoliaRpc),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}


