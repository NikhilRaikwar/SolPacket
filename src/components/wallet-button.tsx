"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface WalletButtonProps {
  disableRedirect?: boolean;
}

export function WalletButton({ disableRedirect = false }: WalletButtonProps) {
  const { connected } = useWallet();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (connected && !disableRedirect && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/dashboard");
    }
  }, [connected, disableRedirect, router]);

  if (!mounted) {
    return (
      <div className="wallet-adapter-wrapper">
        <button className="wallet-adapter-button wallet-adapter-button-trigger">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-adapter-wrapper">
      <WalletMultiButton>Connect Wallet</WalletMultiButton>
    </div>
  );
}