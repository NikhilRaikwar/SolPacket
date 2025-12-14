"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletButton() {
  return (
    <div className="wallet-adapter-wrapper">
      <WalletMultiButton />
    </div>
  );
}