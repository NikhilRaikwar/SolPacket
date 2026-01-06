"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Gift, Send, Inbox, Loader2, ExternalLink, CheckCircle, Clock, Copy, Plus, DollarSign, RefreshCw, QrCode, XCircle } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WalletButton } from "@/components/wallet-button";
import { Button } from "@/components/ui/button";
import { getEscrowGiftsBySender, getEscrowGiftsByRecipient, getEscrowGiftById, type EscrowGift } from "@/lib/escrow-utils";
import { GiftForm } from "@/components/gift-form";
import { USDC_MINT_DEVNET } from "@/lib/solana-config";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

function DashboardContent() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [sentGifts, setSentGifts] = useState<EscrowGift[]>([]);
  const [receivableGifts, setReceivableGifts] = useState<EscrowGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "create" | "claim">("overview");
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const walletAddress = publicKey.toBase58();
      
      const [sent, received] = await Promise.all([
        getEscrowGiftsBySender(walletAddress),
        getEscrowGiftsByRecipient(walletAddress),
      ]);

      setSentGifts(sent);
      setReceivableGifts(received);

      try {
        const ata = await getAssociatedTokenAddress(USDC_MINT_DEVNET, publicKey);
        const account = await getAccount(connection, ata);
        setUsdcBalance(Number(account.amount) / 1_000_000);
      } catch (error) {
        setUsdcBalance(0);
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [connected, publicKey, connection]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
    toast.success("Dashboard refreshed!");
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "create" || tab === "overview" || tab === "claim") {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!connected && publicKey === null) {
      router.push("/");
    }
  }, [connected, publicKey, router]);

  const copyClaimLink = (giftId: string) => {
    const url = `${window.location.origin}/claim/${giftId}`;
    navigator.clipboard.writeText(url);
    toast.success("Claim link copied!");
  };

  const handleQRScan = async (result: string) => {
    try {
      setVerifying(true);
      const url = new URL(result);
      const pathSegments = url.pathname.split("/");
      const scannedGiftId = pathSegments[pathSegments.length - 1];
      
      if (!scannedGiftId) {
        toast.error("Invalid QR code");
        setVerifying(false);
        return;
      }

      const gift = await getEscrowGiftById(scannedGiftId);
      
      if (!gift) {
        toast.error("Gift card not found");
        setVerifying(false);
        return;
      }

      if (gift.claimed) {
        toast.error("This gift has already been claimed");
        setVerifying(false);
        return;
      }

      if (Date.now() > gift.expiresAt) {
        toast.error("This gift has expired");
        setVerifying(false);
        return;
      }

      if (!publicKey) {
        toast.error("Please connect your wallet first");
        setVerifying(false);
        return;
      }

      if (gift.recipientPubKey !== publicKey.toBase58()) {
        toast.error("This gift is not for your wallet address");
        setVerifying(false);
        return;
      }

      toast.success("Gift verified! Redirecting to claim page...");
      setShowScanner(false);
      setVerifying(false);
      router.push(`/claim/${scannedGiftId}`);
    } catch (error) {
      toast.error("Invalid QR code format");
      setVerifying(false);
    }
  };

  const totalCreated = sentGifts.length;
  const activeGifts = sentGifts.filter(g => !g.claimed).length;

  const renderGiftCard = (gift: EscrowGift, isSent: boolean) => {
    const isExpired = Date.now() > gift.expiresAt;
    
    return (
      <motion.div
        key={gift.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-[2rem] bg-card border border-border/50 hover:border-primary/30 transition-all group"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-3xl font-bold font-heading">
                {gift.amount} <span className="text-primary italic">USDC</span>
              </span>
              <div className="flex gap-2">
                {gift.claimed && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                    Claimed
                  </span>
                )}
                {!gift.claimed && isExpired && (
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest border border-border">
                    Expired
                  </span>
                )}
                {!gift.claimed && !isExpired && (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    Active
                  </span>
                )}
              </div>
            </div>
            
            {gift.message && (
              <p className="text-sm text-muted-foreground italic mb-4">"{gift.message}"</p>
            )}
            
            <div className="space-y-1 text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
              {isSent ? (
                <p>To: {gift.recipientPubKey.slice(0, 12)}...{gift.recipientPubKey.slice(-8)}</p>
              ) : (
                <p>From: {gift.senderPublicKey.slice(0, 12)}...{gift.senderPublicKey.slice(-8)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {isSent && !gift.claimed && !isExpired && (
            <Button
              onClick={() => copyClaimLink(gift.giftId)}
              variant="secondary"
              className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy Link
            </Button>
          )}
          
          {!isSent && !gift.claimed && !isExpired && (
            <Button
              onClick={() => router.push(`/claim/${gift.giftId}`)}
              className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              <Gift className="h-3 w-3 mr-2" />
              Claim
            </Button>
          )}

          <div className="flex gap-2">
            {gift.txSignature && (
              <a
                href={`https://explorer.solana.com/tx/${gift.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-secondary border border-border hover:bg-primary/10 hover:text-primary transition-all"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <main className="min-h-screen bg-background relative overflow-hidden grainy">
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

      <Header />

      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black font-heading italic text-foreground tracking-tighter">SCAN QR</h3>
              <button
                onClick={() => {
                  setShowScanner(false);
                  setVerifying(false);
                }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            {verifying ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
                <p className="text-muted-foreground font-medium">Verifying gift card...</p>
              </div>
            ) : (
              <div className="space-y-6">
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
                    components={{ audio: false, finder: true, tracker: false }}
                    styles={{ container: { width: "100%", height: "100%" } }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center font-sans">
                  Position the QR code within the frame to claim
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <div className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {!connected ? (
              <div className="text-center py-32 bg-card/50 backdrop-blur-md border border-border rounded-[3rem]">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-8">
                  <Gift className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-4xl font-bold mb-6">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-10 max-w-sm mx-auto">
                  Access your private dashboard and manage your red packets.
                </p>
                <div className="flex justify-center scale-125">
                  <WalletButton />
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
                <p className="text-muted-foreground font-heading italic text-xl">INITIALIZING DASHBOARD...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                  <div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">
                      HELLO, <span className="text-primary italic font-light">{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">Manage your digital traditions on Solana.</p>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      variant="secondary"
                      className="rounded-2xl h-14 px-8 border border-border hover:bg-muted"
                    >
                      <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="bg-primary text-primary-foreground h-14 px-8 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <Plus className="h-5 w-5" />
                      CREATE NEW
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                  {[
                    { label: "USDC BALANCE", value: usdcBalance.toFixed(2), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "TOTAL SENT", value: totalCreated, icon: Send, color: "text-primary", bg: "bg-primary/10" },
                    { label: "TOTAL RECEIVED", value: receivableGifts.length, icon: Inbox, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "ACTIVE PACKETS", value: activeGifts, icon: Gift, color: "text-amber-500", bg: "bg-amber-500/10" }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 rounded-[2.5rem] bg-card border border-border/50 group transition-all"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                        <div className={cn("p-2 rounded-xl", stat.bg)}>
                          <stat.icon className={cn("h-4 w-4", stat.color)} />
                        </div>
                      </div>
                      <p className="text-4xl font-bold font-heading">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-2 mb-12 p-2 bg-secondary/50 backdrop-blur-md rounded-[2rem] border border-border/50 w-fit">
                  {["overview", "create", "claim"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "px-8 py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest transition-all",
                        activeTab === tab 
                          ? "bg-primary text-primary-foreground shadow-xl" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {activeTab === "overview" && (
                    <div className="grid lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <h3 className="text-3xl font-bold font-heading italic tracking-tighter">RECENT SENT</h3>
                        {sentGifts.length === 0 ? (
                          <div className="py-20 text-center rounded-[2.5rem] border border-dashed border-border">
                            <p className="text-muted-foreground uppercase tracking-widest text-xs font-black">Empty Vault</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {sentGifts.slice(0, 3).map((gift) => renderGiftCard(gift, true))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-8">
                        <h3 className="text-3xl font-bold font-heading italic tracking-tighter">RECENT RECEIVED</h3>
                        {receivableGifts.length === 0 ? (
                          <div className="py-20 text-center rounded-[2.5rem] border border-dashed border-border">
                            <p className="text-muted-foreground uppercase tracking-widest text-xs font-black">Empty Inbox</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {receivableGifts.slice(0, 3).map((gift) => renderGiftCard(gift, false))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "create" && (
                    <div className="max-w-3xl">
                      <div className="p-10 rounded-[3rem] bg-card border border-border shadow-2xl">
                        <GiftForm onSuccess={() => fetchData(true)} />
                      </div>
                    </div>
                  )}

                  {activeTab === "claim" && (
                    <div className="space-y-12">
                      <button
                        onClick={() => setShowScanner(true)}
                        className="w-full h-32 rounded-[2.5rem] bg-primary/10 border border-primary/20 border-dashed hover:bg-primary/20 transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <QrCode className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-black font-heading uppercase tracking-widest text-primary">Open Scanner</span>
                      </button>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        {receivableGifts.length === 0 ? (
                          <div className="col-span-full py-32 text-center rounded-[3rem] bg-card/50 border border-border">
                            <p className="text-muted-foreground uppercase tracking-widest font-black">No Packets Found</p>
                          </div>
                        ) : (
                          receivableGifts.map((gift) => renderGiftCard(gift, false))
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
        <p className="text-muted-foreground font-heading italic text-xl">LOADING DASHBOARD...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
