"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
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
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  getEscrowGiftById,
  claimEscrowGift,
  buildClaimTransaction,
  type EscrowGift,
} from "@/lib/escrow-utils";
import { toast } from "sonner";
import Link from "next/link";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

type ClaimStatus = "loading" | "ready" | "claiming" | "success" | "error" | "already_claimed" | "expired" | "not_found" | "wrong_recipient" | "scanning";

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [gift, setGift] = useState<EscrowGift | null>(null);
  const [status, setStatus] = useState<ClaimStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showScanner, setShowScanner] = useState<boolean>(false);

  const giftId = params.id as string;

  useEffect(() => {
    const checkGift = async () => {
      if (!giftId || giftId === "scan") {
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

      if (Date.now() > foundGift.expiresAt) {
        setStatus("expired");
        setGift(foundGift);
        return;
      }

      setGift(foundGift);
      setStatus("ready");
    };

    checkGift();
  }, [giftId, connection]);

  const handleClaim = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
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

      toast.info("Please sign the claim transaction...");

      const signature = await sendTransaction(claimTx, connection);

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
      
      setStatus("success");
      toast.success(`Successfully claimed ${gift.amount} USDC!`);

    } catch (error: any) {
      console.error("Claim error:", error);
      setStatus("ready");
      toast.error(error?.message || "Claim failed");
    }
  };

  const handleQRScan = async (result: string) => {
    try {
      const url = new URL(result);
      const pathSegments = url.pathname.split("/");
      const scannedGiftId = pathSegments[pathSegments.length - 1];
      
      if (scannedGiftId) {
        setShowScanner(false);
        router.push(`/claim/${scannedGiftId}`);
      } else {
        toast.error("Invalid QR code");
      }
    } catch (error) {
      toast.error("Invalid QR code format");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-8" />
            <p className="text-muted-foreground font-heading italic tracking-tighter text-xl text-center">INITIALIZING CLAIM...</p>
          </div>
        );

      case "not_found":
        return (
          <div className="text-center py-12">
            <div className="h-24 w-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center mx-auto mb-8 text-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4 font-heading tracking-tighter">GIFT NOT FOUND</h2>
            <p className="text-muted-foreground mb-10 font-sans">This packet doesn't exist or the link has been corrupted.</p>
            <div className="space-y-4">
              <Button
                onClick={() => setShowScanner(true)}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-widest"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Scan QR Code
              </Button>
              <Link href="/" className="block">
                <Button variant="secondary" className="w-full h-14 rounded-2xl border border-border">
                  Back to Traditions
                </Button>
              </Link>
            </div>
          </div>
        );

      case "already_claimed":
        return (
          <div className="text-center py-12">
            <div className="h-24 w-24 rounded-[2rem] bg-amber-500/10 flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="h-12 w-12 text-amber-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4 font-heading tracking-tighter text-center">ALREADY SEALED</h2>
            <p className="text-muted-foreground mb-10 font-sans">This packet has already been claimed by its recipient.</p>
            <Link href="/dashboard" className="block">
              <Button className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-widest">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        );

      case "expired":
        return (
          <div className="text-center py-12 text-center">
            <div className="h-24 w-24 rounded-[2rem] bg-zinc-500/10 flex items-center justify-center mx-auto mb-8">
              <Clock className="h-12 w-12 text-zinc-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4 font-heading tracking-tighter">GIFT EXPIRED</h2>
            <p className="text-muted-foreground mb-10 font-sans">The 24-hour window for this packet has closed.</p>
            <Link href="/" className="block">
              <Button variant="secondary" className="w-full h-14 rounded-2xl border border-border">
                Start New Tradition
              </Button>
            </Link>
          </div>
        );

      case "wrong_recipient":
        return (
          <div className="text-center py-12">
            <div className="h-24 w-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center mx-auto mb-8 text-center">
              <User className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4 font-heading tracking-tighter">WRONG WALLET</h2>
            <p className="text-muted-foreground mb-10 font-sans">You are not the intended recipient of this packet.</p>
            <p className="text-xs font-mono text-muted-foreground mb-10">Connected: {publicKey?.toBase58().slice(0, 8)}...</p>
            <Link href="/dashboard" className="block">
              <Button variant="secondary" className="w-full h-14 rounded-2xl border border-border">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        );

      case "ready":
        return (
          <div className="space-y-10">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="h-32 w-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto mb-8 relative group"
              >
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/40 transition-colors" />
                <Gift className="h-16 w-16 text-primary relative z-10" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading tracking-tighter text-center">YOU&apos;VE GOT A <span className="text-primary italic">PACKET</span></h2>
              <p className="text-muted-foreground text-lg text-center">A private gift awaits your signature.</p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-background border border-border relative overflow-hidden group">
              <div className="absolute inset-0 bg-mesh opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative z-10 space-y-8 text-center">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AMOUNT</span>
                  <span className="text-5xl font-black font-heading tracking-tighter">
                    {gift?.amount} <span className="text-primary italic">USDC</span>
                  </span>
                </div>
                
                {gift?.message && (
                  <div className="pt-8 border-t border-border/50 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-4">MESSAGE</span>
                    <p className="text-xl italic font-serif leading-relaxed text-foreground/90">&quot;{gift.message}&quot;</p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/50">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secured via Solana Escrow</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {!connected ? (
                <div className="space-y-6 text-center">
                  <p className="text-muted-foreground text-sm font-sans uppercase tracking-widest font-bold text-center">Connect to Claim</p>
                  <div className="flex justify-center scale-125">
                    <WalletButton disableRedirect />
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleClaim}
                  className="w-full h-20 rounded-[1.5rem] bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Sparkles className="h-6 w-6 mr-3" />
                  CLAIM NOW
                </Button>
              )}
            </div>
          </div>
        );

      case "claiming":
        return (
          <div className="text-center py-20 text-center">
            <div className="relative h-32 w-32 mx-auto mb-10">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Gift className="h-12 w-12 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 font-heading tracking-tighter italic">UNLOCKING...</h2>
            <p className="text-muted-foreground text-lg text-center">Awaiting Solana network confirmation</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="h-32 w-32 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center mx-auto mb-10 relative"
            >
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse" />
              <CheckCircle className="h-16 w-16 text-emerald-500 relative z-10" />
            </motion.div>
            <h2 className="text-5xl font-bold mb-4 font-heading tracking-tighter text-center">SEAL BROKEN</h2>
            <p className="text-muted-foreground text-xl mb-12 text-center">
              {gift?.amount} USDC successfully transferred to your vault.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <Link href="/dashboard" className="block w-full">
                <Button className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-widest text-lg">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background relative overflow-hidden grainy">
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />

      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black font-heading italic tracking-tighter">SCAN QR</h3>
              <button
                onClick={() => setShowScanner(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black border border-border">
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    handleQRScan(result[0].rawValue);
                  }
                }}
                onError={(error) => {
                  console.error("Scanner error:", error);
                  toast.error("Camera access failed.");
                }}
                formats={["qr_code"]}
                constraints={{ facingMode: "environment" }}
                styles={{ container: { width: "100%", height: "100%" } }}
              />
            </div>
          </motion.div>
        </div>
      )}

      <div className="relative z-10 pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl"
        >
          <div className="p-10 rounded-[3rem] bg-card border border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="h-32 w-32 text-primary" />
            </div>
            {renderContent()}
            </div>
          </motion.div>
        </div>
        <Footer />
      </main>
    );
  }