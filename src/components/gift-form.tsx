"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { Gift, Sparkles, MessageSquare, Loader2, User, CheckCircle, DollarSign } from "lucide-react";
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

export function GiftForm({ onSuccess }: { onSuccess?: () => void }) {
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
      
      // Trigger analytics refresh in parent
      if (onSuccess) {
        onSuccess();
      }

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
      <div className="space-y-10">
        <div className="text-center">
          <div className="h-20 w-20 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold font-heading italic tracking-tighter">GIFT SEALED</h2>
          <p className="text-muted-foreground text-sm">Your USDC is now locked in escrow.</p>
        </div>
        
        <div className="bg-background rounded-[2rem] p-8 border border-border">
          <QRCodeDisplay gift={createdGift} />
        </div>

        <Button
          onClick={resetForm}
          variant="secondary"
          className="w-full h-14 rounded-2xl border border-border font-bold uppercase tracking-widest"
        >
          Create Another
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Gift className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold font-heading italic tracking-tighter uppercase">FORGE PACKET</h2>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Digital traditions on Solana</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="recipient" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">RECIPIENT WALLET</Label>
          <Input
            id="recipient"
            placeholder="Address..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="h-14 rounded-2xl bg-background border-border/50 font-mono text-sm focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">AMOUNT (USDC)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 rounded-2xl bg-background border-border/50 pl-12 font-bold focus:border-primary/50 transition-colors"
              />
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            </div>
            {usdcBalance !== null && (
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Balance: {usdcBalance.toFixed(2)} USDC</p>
            )}
          </div>

          <div className="space-y-4">
            <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">MESSAGE</Label>
            <Textarea
              id="message"
              placeholder="Private note..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-14 min-h-[3.5rem] rounded-2xl bg-background border-border/50 resize-none py-4 focus:border-primary/50 transition-colors italic"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleCreateGift}
        disabled={!connected || isLoading || !amount || !recipientAddress}
        className="w-full h-20 rounded-[1.5rem] bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-6 w-6 mr-3 animate-spin" />
            SEALING...
          </>
        ) : (
          <>
            <Sparkles className="h-6 w-6 mr-3" />
            MINT PACKET
          </>
        )}
      </Button>

      {!connected && (
        <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Connect wallet to begin ceremony
        </p>
      )}
    </div>
  );
}