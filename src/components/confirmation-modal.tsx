"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Coins, User, MessageSquare } from "lucide-react";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  amount: string;
  token: string;
  recipientAddress: string;
  message?: string;
  isLoading?: boolean;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  amount,
  token,
  recipientAddress,
  message,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-violet-400" />
            Confirm Gift Creation
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Review the details before creating your gift. This will deduct funds from your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-3">
            <div className="flex items-start gap-3">
              <Coins className="h-5 w-5 text-violet-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-zinc-400">Amount</p>
                <p className="text-xl font-bold text-white">
                  {amount} {token}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-indigo-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-zinc-400">Recipient Address</p>
                <p className="text-sm font-mono text-white break-all">
                  {recipientAddress}
                </p>
              </div>
            </div>

            {message && (
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-400">Message</p>
                  <p className="text-sm text-zinc-300">{message}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-200 leading-relaxed">
              <strong>Important:</strong> You will be prompted to approve a transaction in your
              wallet. Funds will be escrowed on-chain until the recipient claims them within 24
              hours.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          >
            {isLoading ? "Processing..." : "Confirm & Sign Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
