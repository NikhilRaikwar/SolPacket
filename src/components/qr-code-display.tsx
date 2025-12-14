"use client";

import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, Shield, ExternalLink } from "lucide-react";
import { type EscrowGift } from "@/lib/escrow-utils";

interface QRCodeDisplayProps {
  gift: EscrowGift;
}

export function QRCodeDisplay({ gift }: QRCodeDisplayProps) {
  const generateClaimUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `${baseUrl}/claim/${gift.id}`;
  };

  const claimUrl = generateClaimUrl();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Gift Created & USDC Escrowed!</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Your USDC Cash Drop</h3>
        <p className="text-zinc-400">Share this QR code with the recipient to claim</p>
      </div>

      <div className="flex justify-center">
        <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-violet-500/20">
          <QRCodeSVG
            id="qr-code-svg"
            value={claimUrl}
            size={240}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#1e1b4b"
            imageSettings={{
              src: "/solana-logo.svg",
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Shield className="h-4 w-4 text-violet-400" />
          <span>Secured on Solana with PDA Escrow</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Amount</p>
            <p className="text-white font-medium">{gift.amount} USDC</p>
            <p className="text-xs text-amber-400 mt-1">Expires in 24 hours</p>
          </div>
          <div>
            <p className="text-zinc-500">Recipient</p>
            <p className="text-white font-medium font-mono text-xs">
              {gift.recipientPubKey.slice(0, 4)}...{gift.recipientPubKey.slice(-4)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Restricted claim</p>
          </div>
        </div>
        {gift.message && (
          <div>
            <p className="text-zinc-500 text-sm">Message</p>
            <p className="text-white">{gift.message}</p>
          </div>
        )}
        {gift.txSignature && (
          <div>
            <p className="text-zinc-500 text-sm mb-1">Transaction</p>
            <a
              href={`https://explorer.solana.com/tx/${gift.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-mono"
            >
              View on Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <p className="text-sm text-indigo-200 leading-relaxed">
          <strong>Wallet Compatibility:</strong> Recipients can scan this QR with Phantom, Solflare, or any Solana-compatible wallet to claim directly.
        </p>
      </div>
    </div>
  );
}