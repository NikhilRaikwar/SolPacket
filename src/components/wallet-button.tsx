"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface WalletButtonProps {
  disableRedirect?: boolean;
}

export function WalletButton({ disableRedirect = false }: WalletButtonProps) {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected && !disableRedirect) {
      router.push("/dashboard");
    }
  }, [connected, disableRedirect, router]);

  return (
    <div className="wallet-adapter-wrapper">
      <WalletMultiButton>Connect Wallet</WalletMultiButton>
    </div>
  );
}