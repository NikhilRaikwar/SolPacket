import { Connection, PublicKey } from "@solana/web3.js";

export const NETWORK = "devnet";
export const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || "d8e6c21f-7aff-4084-9d2e-faa6d962e246";
export const SOLANA_RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const SOLANA_WSS_ENDPOINT = `wss://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const HELIUS_API_BASE = `https://api-devnet.helius-rpc.com`;

export const getConnection = () => new Connection(SOLANA_RPC_ENDPOINT, { wsEndpoint: SOLANA_WSS_ENDPOINT });

export const USDC_MINT_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export const ESCROW_PROGRAM_ID = new PublicKey("AiebTbnydag8QCPFhapiuPzd5hy8MvKNXeVVYR2dZ94Z");

export function getTransactionApiUrl(apiKey?: string): string {
  const key = apiKey || HELIUS_API_KEY;
  return `${HELIUS_API_BASE}/v0/transactions/?api-key=${key}`;
}

export function getAddressTransactionsUrl(address: string, apiKey?: string): string {
  const key = apiKey || HELIUS_API_KEY;
  return `${HELIUS_API_BASE}/v0/addresses/${address}/transactions/?api-key=${key}`;
}