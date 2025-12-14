import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claim Gift | SOLPACKET - USDC Gift Cards",
  description: "Claim your USDC gift card on Solana. Securely claim gifts from escrow by connecting your wallet on SOLPACKET.",
  keywords: ["Claim USDC", "Solana Gift", "Crypto Gift Claim", "QR Code Claim", "SOLPACKET"],
};

export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
