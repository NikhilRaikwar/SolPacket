"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Gift, Send, Inbox, Loader2, ExternalLink, CheckCircle, Clock, Copy, Plus, DollarSign, TrendingUp, BarChart, RefreshCw, QrCode, XCircle, Upload } from "lucide-react";
import { Header } from "@/components/header";
import { WalletButton } from "@/components/wallet-button";
import { Button } from "@/components/ui/button";
import { getEscrowGiftsBySender, getEscrowGiftsByRecipient, getEscrowGiftById, type EscrowGift } from "@/lib/escrow-utils";
import { GiftForm } from "@/components/gift-form";
import { USDC_MINT_DEVNET } from "@/lib/solana-config";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  
  const [sentGifts, setSentGifts] = useState<EscrowGift[]>([]);
  const [receivableGifts, setReceivableGifts] = useState<EscrowGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "create" | "claim" | "created" | "received">("overview");
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  const fetchData = async () => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
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
        console.error("Failed to fetch USDC balance:", error);
        setUsdcBalance(0);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Dashboard refreshed!");
  };

  useEffect(() => {
    fetchData();
  }, [connected, publicKey, connection]);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("No image selected");
      return;
    }

    // Reset the input so the same file can be selected again
    event.target.value = "";

    try {
      setVerifying(true);
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            toast.error("Failed to process image");
            setVerifying(false);
            URL.revokeObjectURL(imageUrl);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try to decode QR code with jsQR
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code && code.data) {
            console.log("QR Code detected:", code.data);
            await handleQRScan(code.data);
          } else {
            toast.error("No QR code found in image. Please try a clearer image.");
            setVerifying(false);
          }
        } catch (error) {
          console.error("QR scan error:", error);
          toast.error("Failed to scan QR code from image");
          setVerifying(false);
        } finally {
          URL.revokeObjectURL(imageUrl);
        }
      };

      img.onerror = () => {
        toast.error("Failed to load image. Please try a different image.");
        setVerifying(false);
        URL.revokeObjectURL(imageUrl);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file");
      setVerifying(false);
    }
  };

  const totalCreated = sentGifts.length;
  const totalSent = sentGifts.filter(g => g.claimed).reduce((sum, g) => sum + g.amount, 0);
  const totalReceived = receivableGifts.filter(g => g.claimed).reduce((sum, g) => sum + g.amount, 0);
  const activeGifts = sentGifts.filter(g => !g.claimed).length;
  const totalClaimedCount = receivableGifts.filter(g => g.claimed).length;

  const renderGiftCard = (gift: EscrowGift, isSent: boolean) => {
    const isExpired = Date.now() > gift.expiresAt;
    
    return (
      <motion.div
        key={gift.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 hover:border-violet-500/30 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {gift.amount} USDC
              </span>
              {gift.claimed && (
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Claimed
                </span>
              )}
              {!gift.claimed && isExpired && (
                <span className="px-2 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-xs font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expired
                </span>
              )}
              {!gift.claimed && !isExpired && (
                <span className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium">
                  Active
                </span>
              )}
            </div>
            
            {gift.message && (
              <p className="text-sm text-zinc-400 italic mb-3 truncate">"{gift.message}"</p>
            )}
            
            <div className="space-y-1 text-xs text-zinc-500">
              {isSent ? (
                <p className="font-mono truncate">
                  To: {gift.recipientPubKey.slice(0, 8)}...{gift.recipientPubKey.slice(-6)}
                </p>
              ) : (
                <p className="font-mono truncate">
                  From: {gift.senderPublicKey.slice(0, 8)}...{gift.senderPublicKey.slice(-6)}
                </p>
              )}
              <p>Created: {new Date(gift.creationTimestamp * 1000).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isSent && !gift.claimed && !isExpired && (
            <Button
              onClick={() => copyClaimLink(gift.giftId)}
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px] border-zinc-700 text-zinc-300 hover:bg-violet-500/10 hover:text-violet-400"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          )}
          
          {!isSent && !gift.claimed && !isExpired && (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/claim/${gift.giftId}`);
              }}
              className="flex-1 min-w-[120px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Gift className="h-4 w-4" />
              Claim Gift
            </Button>
          )}

          {gift.txSignature && (
            <a
              href={`https://explorer.solana.com/tx/${gift.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-zinc-700 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Creation Link
              </Button>
            </a>
          )}
          
          <a
            href={`https://explorer.solana.com/address/${gift.pdaAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-zinc-700 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              PDA Escrow Link
            </Button>
          </a>
        </div>
      </motion.div>
    );
  };

  return (
    <main className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.1),transparent_50%)]" />

      <Header />

      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Scan Gift QR Code</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowScanner(false);
                  setVerifying(false);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            {verifying ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-violet-400 animate-spin mb-4" />
                <p className="text-zinc-400">Verifying gift card...</p>
              </div>
            ) : (
              <>
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
                  <Scanner
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        handleQRScan(result[0].rawValue);
                      }
                    }}
                    onError={(error) => {
                      console.error("Scanner error:", error);
                      toast.error("Camera access failed. Please check permissions.");
                    }}
                    formats={["qr_code"]}
                    constraints={{
                      facingMode: "environment",
                    }}
                    components={{
                      audio: false,
                      finder: true,
                      tracker: false,
                    }}
                    styles={{
                      container: { width: "100%", height: "100%" },
                    }}
                  />
                </div>
                <p className="text-sm text-zinc-400 text-center">
                  Position the QR code within the frame to scan
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {!connected ? (
              <div className="text-center py-16">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                  <Gift className="h-10 w-10 text-violet-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-zinc-400 mb-6 px-4">
                  Connect your wallet to access your dashboard
                </p>
                <div className="flex justify-center">
                  <WalletButton />
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 text-violet-400 animate-spin mb-4" />
                <p className="text-zinc-400">Loading dashboard...</p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    Welcome, {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                  </h1>
                  <p className="text-zinc-400">Manage your USDC gift cards</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">USDC Balance</span>
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{usdcBalance.toFixed(2)}</p>
                    <p className="text-xs text-zinc-500 mt-1">USD Coin</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setActiveTab("created")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">Total Created</span>
                      <Send className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{totalCreated}</p>
                    <p className="text-xs text-zinc-500 mt-1">{totalSent.toFixed(2)} USDC sent (claimed)</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setActiveTab("received")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">Total Received</span>
                      <Inbox className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{receivableGifts.length}</p>
                    <p className="text-xs text-zinc-500 mt-1">{totalClaimedCount} claimed ({totalReceived.toFixed(2)} USDC)</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">Active Gifts</span>
                      <Gift className="h-5 w-5 text-violet-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{activeGifts}</p>
                    <p className="text-xs text-zinc-500 mt-1">Awaiting claim</p>
                  </motion.div>
                </div>

                <div className="flex gap-2 mb-6 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 min-w-[100px] py-3 px-4 sm:px-6 rounded-lg font-medium transition-all text-sm sm:text-base ${
                      activeTab === "overview"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <BarChart className="h-4 w-4" />
                      <span className="hidden sm:inline">Overview</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("create")}
                    className={`flex-1 min-w-[100px] py-3 px-4 sm:px-6 rounded-lg font-medium transition-all text-sm sm:text-base ${
                      activeTab === "create"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Create</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("claim")}
                    className={`flex-1 min-w-[100px] py-3 px-4 sm:px-6 rounded-lg font-medium transition-all text-sm sm:text-base ${
                      activeTab === "claim"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Gift className="h-4 w-4" />
                      <span>Claim</span>
                    </div>
                  </button>
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                          <Send className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />
                          Sent Gifts ({sentGifts.length})
                        </h3>
                        <Button
                          onClick={handleRefresh}
                          disabled={refreshing}
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 text-zinc-300 hover:bg-violet-500/10 hover:text-violet-400"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                      {sentGifts.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                          <Send className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-600 mx-auto mb-4" />
                          <p className="text-zinc-400">No sent gifts yet</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {sentGifts.slice(0, 4).map((gift) => renderGiftCard(gift, true))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <Inbox className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />
                        Received Gifts ({receivableGifts.length})
                      </h3>
                      {receivableGifts.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                          <Inbox className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-600 mx-auto mb-4" />
                          <p className="text-zinc-400">No received gifts yet</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {receivableGifts.slice(0, 4).map((gift) => renderGiftCard(gift, false))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "create" && (
                  <div className="max-w-2xl mx-auto">
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 shadow-2xl shadow-violet-500/5">
                      <GiftForm />
                    </div>
                  </div>
                )}

                {activeTab === "claim" && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setShowScanner(true)}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan Gift QR Code
                    </Button>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {receivableGifts.length === 0 ? (
                        <div className="col-span-full text-center py-16 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                          <Inbox className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-600 mx-auto mb-4" />
                          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Claimable Gifts</h3>
                          <p className="text-zinc-400">You don't have any gifts to claim</p>
                        </div>
                      ) : (
                        receivableGifts.map((gift) => renderGiftCard(gift, false))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "created" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          <Send className="h-6 w-6 text-amber-400" />
                          Created Gifts
                        </h3>
                        <p className="text-zinc-400 text-sm mt-1">
                          All gifts you've created
                        </p>
                      </div>
                      <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-zinc-300 hover:bg-violet-500/10 hover:text-violet-400"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    
                    {sentGifts.length === 0 ? (
                      <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                        <Send className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Created Gifts</h3>
                        <p className="text-zinc-400">Create your first gift card to get started</p>
                        <Button
                          onClick={() => setActiveTab("create")}
                          className="mt-4 bg-gradient-to-r from-violet-600 to-indigo-600"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Gift
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {sentGifts.map((gift) => renderGiftCard(gift, true))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "received" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          <Inbox className="h-6 w-6 text-blue-400" />
                          Received Gifts
                        </h3>
                        <p className="text-zinc-400 text-sm mt-1">
                          All gifts sent to your wallet
                        </p>
                      </div>
                      <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-zinc-300 hover:bg-violet-500/10 hover:text-violet-400"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    
                    {receivableGifts.length === 0 ? (
                      <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                        <Inbox className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Received Gifts</h3>
                        <p className="text-zinc-400">You haven't received any gifts yet</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {receivableGifts.map((gift) => renderGiftCard(gift, false))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}