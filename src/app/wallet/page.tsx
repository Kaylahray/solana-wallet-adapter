"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="border hover:border-slate-900 rounded">
        <WalletMultiButton className="!bg-orange-900 hover:!bg-black transition-all duration-200 !rounded-lg" />
      </div>
    </main>
  );
}
