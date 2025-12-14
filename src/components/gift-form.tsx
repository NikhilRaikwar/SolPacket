"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { Gift, Sparkles, MessageSquare, Loader2, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { USDC_MINT_DEVNET } from "@/lib/solana-config";
import {
  generateGiftId,
  derivePDA,
  buildUSDCEscrowTransaction,
  saveEscrowGift,
  type EscrowGift,
} from "@/lib/escrow-utils";
import { QRCodeDisplay } from "./qr-code-display";
import { toast } from "sonner";
import Link from "next/link";

export function GiftForm() {
  const router = useRouter();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdGift, setCreatedGift] = useState<EscrowGift | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchUSDCBalance = async () => {
      if (!publicKey || !connection) return;
      try {
        const ata = await getAssociatedTokenAddress(USDC_MINT_DEVNET, publicKey);
        const account = await getAccount(connection, ata);
        setUsdcBalance(Number(account.amount) / 1_000_000);
      } catch (error) {
        console.error("Failed to fetch USDC balance:", error);
        setUsdcBalance(0);
      }
    };

    if (connected && publicKey) {
      fetchUSDCBalance();
    }
  }, [connected, publicKey, connection]);

  const validateRecipientAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateGift = async () => {
    if (!connected || !publicKey || !sendTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (usdcBalance !== null && amountNum > usdcBalance) {
      toast.error("Insufficient USDC balance");
      return;
    }

    if (!recipientAddress || !validateRecipientAddress(recipientAddress)) {
      toast.error("Please enter a valid recipient wallet address");
      return;
    }

    setIsLoading(true);

    try {
      const giftId = generateGiftId();
      const recipientPubKey = new PublicKey(recipientAddress);
      const [pdaAddress] = derivePDA(giftId);

      const transaction = await buildUSDCEscrowTransaction(
        connection,
        publicKey,
        recipientPubKey,
        giftId,
        amountNum
      );

      const signature = await sendTransaction(transaction, connection);

      toast.info("Transaction sent, awaiting confirmation...");

      await connection.confirmTransaction(signature, "confirmed");

      const escrowGift: EscrowGift = {
        id: giftId,
        giftId,
        pdaAddress: pdaAddress.toBase58(),
        recipientPubKey: recipientAddress,
        amount: amountNum,
        tokenSymbol: "USDC",
        message: message || undefined,
        senderPublicKey: publicKey.toBase58(),
        creationTimestamp: Math.floor(Date.now() / 1000),
        txSignature: signature,
        claimed: false,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      await saveEscrowGift(escrowGift);
      setCreatedGift(escrowGift);

      toast.success("Gift card created with USDC escrow!");

      if (usdcBalance !== null) {
        setUsdcBalance(usdcBalance - amountNum);
      }
    } catch (error: any) {
      console.error("Failed to create gift:", error);

      if (error?.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else if (error?.message?.includes("insufficient")) {
        toast.error("Insufficient funds for transaction");
      } else {
        toast.error("Failed to create gift. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCreatedGift(null);
    setAmount("");
    setMessage("");
    setRecipientAddress("");
  };

  if (createdGift) {
    return (
      <div className="space-y-6">
        <QRCodeDisplay gift={createdGift} />
        <div className="flex gap-3">
          <Button
            onClick={resetForm}
            variant="outline"
            className="flex-1 border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
          >
            Create Another Gift
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard">
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white -ml-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
          <Gift className="h-6 w-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Create Cash Drop</h2>
          <p className="text-sm text-zinc-400">Send USDC gift cards via escrow</p>
        </div>
      </div>

      {usdcBalance !== null && (
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <p className="text-sm text-zinc-400">Available USDC Balance</p>
          <p className="text-2xl font-bold text-white">{usdcBalance.toFixed(2)} USDC</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-zinc-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Amount (USDC)
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500"
            aria-label="Enter USDC amount"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient" className="text-zinc-300 flex items-center gap-2">
            <User className="h-4 w-4" />
            Recipient Wallet Address
          </Label>
          <Input
            id="recipient"
            type="text"
            placeholder="Enter Solana wallet address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 font-mono text-sm"
            aria-label="Enter recipient wallet address"
          />
          <p className="text-xs text-zinc-500">Only this wallet will be able to claim the gift</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-zinc-300 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Message (Optional)
          </Label>
          <Textarea
            id="message"
            placeholder="Happy holidays! Here's a little something..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 min-h-[80px]"
            aria-label="Enter optional message"
          />
        </div>
      </div>

      <Button
        onClick={handleCreateGift}
        disabled={!connected || isLoading || !amount || !recipientAddress}
        className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Creating Escrow...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Create USDC Gift Card
          </>
        )}
      </Button>

      {!connected && (
        <p className="text-center text-sm text-zinc-500">
          Connect your wallet to create a cash drop
        </p>
      )}
    </div>
  );
}