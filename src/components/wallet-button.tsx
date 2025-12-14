"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface WalletButtonProps {
  disableRedirect?: boolean;
}

export function WalletButton({ disableRedirect = false }: WalletButtonProps) {
  const { connected } = useWallet();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (connected && !disableRedirect && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/dashboard");
    }
  }, [connected, disableRedirect, router]);

  return (
    <div className="wallet-adapter-wrapper" suppressHydrationWarning>
      <WalletMultiButton suppressHydrationWarning />
    </div>
  );
}