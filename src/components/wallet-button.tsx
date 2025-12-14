"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export function WalletButton() {
  return (
    <div className="wallet-adapter-wrapper">
      <WalletMultiButton>Connect Wallet</WalletMultiButton>
    </div>
  );
}