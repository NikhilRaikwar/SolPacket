import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | SOLPACKET - Manage USDC Gift Cards",
  description: "Manage your USDC gift cards on Solana. View sent and received gifts, create new gift cards, and claim gifts with QR codes on SOLPACKET.",
  keywords: ["Solana Dashboard", "USDC Gifts", "Crypto Gift Management", "Claim Gifts", "Create Gift Cards"],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
