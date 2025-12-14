"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface WalletButtonProps {
  disableRedirect?: boolean;
}

export function WalletButton({ disableRedirect = false }: WalletButtonProps) {
  const { connected } = useWallet();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && connected && !disableRedirect) {
      router.push("/dashboard");
    }
  }, [mounted, connected, disableRedirect, router]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="wallet-adapter-wrapper">
      <WalletMultiButton />
    </div>
  );
}