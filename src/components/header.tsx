"use client";

import { Zap } from "lucide-react";
import { WalletButton } from "./wallet-button";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="SOLPACKET Logo" width={32} height={32} className="rounded-lg" />
          <h1 className="text-2xl font-black text-white tracking-tight">SOLPACKET</h1>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="h-3 w-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Devnet</span>
          </div>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}