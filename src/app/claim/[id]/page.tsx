"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import {
  Gift,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";
import { Header } from "@/components/header";
import {
  getEscrowGiftById,
  claimEscrowGift,
  buildClaimTransaction,
  type EscrowGift,
} from "@/lib/escrow-utils";
import { toast } from "sonner";
import Link from "next/link";

type ClaimStatus = "loading" | "ready" | "claiming" | "success" | "error" | "already_claimed" | "expired" | "not_found" | "wrong_recipient";

export default function ClaimPage() {
  const params = useParams();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [gift, setGift] = useState<EscrowGift | null>(null);
  const [status, setStatus] = useState<ClaimStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [txSignature, setTxSignature] = useState<string>("");

  const giftId = params.id as string;

  useEffect(() => {
    const checkGift = async () => {
      if (!giftId) {
        setStatus("not_found");
        return;
      }

      const foundGift = await getEscrowGiftById(giftId);
      
      if (!foundGift) {
        setStatus("not_found");
        return;
      }

      if (foundGift.claimed) {
        setStatus("already_claimed");
        setGift(foundGift);
        return;
      }

      const slot = await connection.getSlot();
      const currentBlockTime = await connection.getBlockTime(slot);
      
      if (currentBlockTime) {
        const elapsed = currentBlockTime - foundGift.creationTimestamp;
        if (elapsed > 86400) {
          setStatus("expired");
          setGift(foundGift);
          toast.error("This gift has expired (24 hours)");
          return;
        }
      } else if (Date.now() > foundGift.expiresAt) {
        setStatus("expired");
        setGift(foundGift);
        toast.error("This gift has expired");
        return;
      }

      setGift(foundGift);
      setStatus("ready");
    };

    checkGift();
  }, [giftId, connection]);

  const handleClaim = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    
    if (!connected || !publicKey || !sendTransaction || !gift) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (publicKey.toBase58() !== gift.recipientPubKey) {
      setStatus("wrong_recipient");
      setErrorMessage("This gift is restricted to a different wallet address");
      toast.error("You are not the intended recipient");
      return;
    }

    setStatus("claiming");

    try {
      const claimTx = await buildClaimTransaction(
        connection,
        publicKey,
        gift.giftId
      );

      toast.info("Please sign the claim transaction in your wallet...");

      const signature = await sendTransaction(claimTx, connection);

      toast.info("Transaction sent, awaiting confirmation...");

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      const claimed = await claimEscrowGift(gift.id);
      if (!claimed) {
        throw new Error("Failed to mark gift as claimed");
      }
      
      setTxSignature(signature);
      setStatus("success");
      toast.success(`Successfully claimed ${gift.amount} USDC from escrow!`);

    } catch (error: any) {
      console.error("Claim error:", error);
      
      if (error?.message?.includes("User rejected")) {
        setStatus("ready");
        toast.error("Transaction rejected by user");
      } else if (error?.message?.includes("insufficient")) {
        setStatus("error");
        setErrorMessage("Insufficient funds for transaction fees");
        toast.error("Insufficient funds for fees");
      } else {
        setStatus("error");
        setErrorMessage(error?.message || "Transaction failed");
        toast.error("Claim failed");
      }
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-violet-400 animate-spin mb-4" />
            <p className="text-zinc-400">Loading gift details...</p>
          </div>
        );

      case "not_found":
        return (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Gift Not Found</h2>
            <p className="text-zinc-400 mb-6">This cash drop doesn&apos;t exist or the link is invalid.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create Your Own
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        );

      case "already_claimed":
        return (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Already Claimed</h2>
            <p className="text-zinc-400 mb-6">This cash drop has already been redeemed.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create Your Own
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-zinc-500/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Gift Expired</h2>
            <p className="text-zinc-400 mb-2">This cash drop has expired and can no longer be claimed.</p>
            <p className="text-sm text-zinc-500 mb-6">
              Expired on {gift && new Date(gift.expiresAt).toLocaleString()}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create Your Own
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        );

      case "wrong_recipient":
        return (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Wrong Wallet</h2>
            <p className="text-zinc-400 mb-2">This gift is restricted to a specific recipient address.</p>
            <p className="text-sm text-zinc-500 mb-2 font-mono">
              Expected: {gift?.recipientPubKey.slice(0, 8)}...{gift?.recipientPubKey.slice(-8)}
            </p>
            <p className="text-sm text-zinc-500 mb-6 font-mono">
              Connected: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create Your Own
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        );

      case "ready":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <Gift className="h-10 w-10 text-violet-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">You&apos;ve Got a Gift!</h2>
              <p className="text-zinc-400">Someone sent you a USDC cash drop</p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Amount</span>
                <span className="text-2xl font-bold text-white">
                  {gift?.amount} USDC
                </span>
              </div>
              
              {gift?.message && (
                <div className="pt-4 border-t border-zinc-700/50">
                  <p className="text-sm text-zinc-500 mb-1">Message from sender</p>
                  <p className="text-white italic">&quot;{gift.message}&quot;</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-zinc-700/50">
                <Shield className="h-4 w-4 text-violet-400" />
                <span className="text-sm text-zinc-400">Secured with PDA Escrow</span>
              </div>
            </div>

            {!connected ? (
              <div className="space-y-4">
                <p className="text-center text-zinc-400 text-sm">
                  Connect your wallet to claim this gift
                </p>
                <div className="flex justify-center">
                  <WalletButton />
                </div>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleClaim}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 text-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Claim {gift?.amount} USDC
              </Button>
            )}
          </div>
        );

      case "claiming":
        return (
          <div className="text-center py-12">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing Claim</h2>
            <p className="text-zinc-400 mb-4">Claiming USDC from escrow...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse delay-100" />
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse delay-200" />
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Claim Successful!</h2>
            <p className="text-zinc-400 mb-6">
              You received {gift?.amount} USDC
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              The funds have been transferred to your wallet
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Gift className="h-4 w-4 mr-2" />
                  Create Your Own
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Claim Failed</h2>
            <p className="text-zinc-400 mb-6">{errorMessage}</p>
            <Button
              onClick={() => setStatus("ready")}
              variant="outline"
              className="border-zinc-700 text-zinc-300"
            >
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.1),transparent_50%)]" />

      <Header />

      <div className="relative z-10 pt-24 pb-16 px-4 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 shadow-2xl shadow-violet-500/5">
            {renderContent()}
          </div>
        </motion.div>
      </div>
    </main>
  );
}