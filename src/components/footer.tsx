"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Github, Rocket } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-24 px-6 border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <Link href="/" className="flex items-center gap-3 mb-6 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-colors" />
              <Image 
                src="/logo.png" 
                alt="SOLPACKET Logo" 
                width={36} 
                height={36} 
                className="rounded-xl relative z-10" 
              />
            </div>
            <h3 className="text-xl font-black font-heading italic tracking-tighter group-hover:text-primary transition-colors">
              SOLPACKET
            </h3>
          </Link>
          <p className="text-muted-foreground text-sm max-w-xs font-sans">
            Securing the tradition of gifting with the speed of Solana.
          </p>
        </div>

        <div className="flex gap-4">
          <a 
            href="https://twitter.com/NikhilRaikwarr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <Twitter className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </a>
          <a 
            href="https://github.com/NikhilRaikwar/solpacket" 
            target="_blank" 
            rel="noopener noreferrer"
            className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <Github className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </a>
        </div>

        <div className="text-center md:text-right">
          <p className="text-muted-foreground text-[10px] mb-4 font-sans uppercase tracking-[0.2em] font-bold">
            © 2026 SolPacket Labs
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Rocket className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[10px] text-primary font-black uppercase tracking-tighter">
              Powered by Solana
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
