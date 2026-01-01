"use client";

import { Zap } from "lucide-react";
import { WalletButton } from "./wallet-button";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/dashboard";
  const isClaimPage = pathname?.startsWith("/claim");
  const { connected, disconnect } = useWallet();
  const [showDisconnect, setShowDisconnect] = useState(false);

  const handleDisconnect = async () => {
    await disconnect();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-colors" />
            <Image src="/logo.png" alt="SOLPACKET Logo" width={36} height={36} className="rounded-xl relative z-10" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors font-heading italic">
            SOLPACKET
          </h1>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/#process" className="hover:text-foreground transition-colors">Process</Link>
            <Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Devnet</span>
            </div>
            {isDashboard && connected ? (
              <div
                className="relative"
                onMouseEnter={() => setShowDisconnect(true)}
                onMouseLeave={() => setShowDisconnect(false)}
              >
                {showDisconnect ? (
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <div className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground cursor-pointer">
                    Connected
                  </div>
                )}
              </div>
            ) : (
              <WalletButton disableRedirect={isClaimPage} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}