"use client";

import { ThemeProvider } from "next-themes";
import { SolanaProvider } from "./solana-provider";
import { type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SolanaProvider>{children}</SolanaProvider>
    </ThemeProvider>
  );
}
