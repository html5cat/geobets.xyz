import { ConnectWallet } from "@/components/ConnectWallet";
import { ImageGrid } from "@/components/ImageGrid";
import { LocalPhotosGrid } from "@/components/LocalPhotosGrid";

export default function Home() {
  return (
    <main className="min-h-screen p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">GeoBets.xyz</h1>
        <ConnectWallet />
      </div>
  <ImageGrid />
  <LocalPhotosGrid />
      <footer className="text-sm text-neutral-500">
        Built with Next.js, Wagmi, Viem, and Porto. Deploy contracts with Foundry.
      </footer>
    </main>
  );
}
