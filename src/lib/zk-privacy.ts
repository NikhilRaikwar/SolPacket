import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import bs58 from "bs58";

export interface PrivateGift {
  id: string;
  nullifier: string;
  commitment: string;
  amount: number;
  tokenSymbol: string;
  message?: string;
  senderPublicKey: string;
  createdAt: number;
  creationTimestamp: number;
  claimed: boolean;
  expiresAt: number;
}

export interface ZKProof {
  proof: string;
  nullifierHash: string;
  commitment: string;
  verified: boolean;
}

const GIFT_STORAGE_KEY = "zk_cash_drops_gifts";
const EXPIRATION_DURATION = 24 * 60 * 60 * 1000;

function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

export function generateNullifier(): string {
  const bytes = generateRandomBytes(32);
  return bs58.encode(bytes);
}

export function generateCommitment(nullifier: string, amount: number): string {
  const data = `${nullifier}:${amount}:${Date.now()}`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  return bs58.encode(bytes);
}

export function generateZKProof(nullifier: string, commitment: string): ZKProof {
  const proofData = `proof:${nullifier}:${commitment}:${Date.now()}`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(proofData);
  
  return {
    proof: bs58.encode(bytes),
    nullifierHash: bs58.encode(generateRandomBytes(32)),
    commitment,
    verified: true,
  };
}

export async function createPrivateGift(
  amount: number,
  tokenSymbol: string,
  senderPublicKey: string,
  connection: Connection,
  message?: string
): Promise<PrivateGift> {
  const nullifier = generateNullifier();
  const commitment = generateCommitment(nullifier, amount);
  const id = bs58.encode(generateRandomBytes(16));
  
  const slot = await connection.getSlot();
  const blockTime = await connection.getBlockTime(slot);
  const creationTimestamp = blockTime || Math.floor(Date.now() / 1000);
  
  const gift: PrivateGift = {
    id,
    nullifier,
    commitment,
    amount,
    tokenSymbol,
    message,
    senderPublicKey,
    createdAt: Date.now(),
    creationTimestamp,
    claimed: false,
    expiresAt: Date.now() + EXPIRATION_DURATION,
  };
  
  saveGift(gift);
  return gift;
}

export function verifyZKProof(proof: ZKProof, gift: PrivateGift): boolean {
  if (gift.claimed) return false;
  if (Date.now() > gift.expiresAt) return false;
  return proof.commitment === gift.commitment && proof.verified;
}

export async function isGiftExpired(gift: PrivateGift, connection: Connection): Promise<boolean> {
  const slot = await connection.getSlot();
  const currentBlockTime = await connection.getBlockTime(slot);
  
  if (!currentBlockTime) {
    return Date.now() > gift.expiresAt;
  }
  
  const elapsed = currentBlockTime - gift.creationTimestamp;
  return elapsed > 86400;
}

export function saveGift(gift: PrivateGift): void {
  if (typeof window === "undefined") return;
  
  const gifts = getAllGifts();
  const existingIndex = gifts.findIndex((g) => g.id === gift.id);
  
  if (existingIndex >= 0) {
    gifts[existingIndex] = gift;
  } else {
    gifts.push(gift);
  }
  
  localStorage.setItem(GIFT_STORAGE_KEY, JSON.stringify(gifts));
}

export function getAllGifts(): PrivateGift[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(GIFT_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getGiftById(id: string): PrivateGift | null {
  const gifts = getAllGifts();
  return gifts.find((g) => g.id === id) || null;
}

export function getGiftByNullifier(nullifier: string): PrivateGift | null {
  const gifts = getAllGifts();
  return gifts.find((g) => g.nullifier === nullifier) || null;
}

export function claimGift(id: string): boolean {
  const gift = getGiftById(id);
  if (!gift || gift.claimed) return false;
  
  gift.claimed = true;
  saveGift(gift);
  return true;
}

export function generateClaimUrl(gift: PrivateGift): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${baseUrl}/claim/${gift.id}?n=${encodeURIComponent(gift.nullifier)}`;
}