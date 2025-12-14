import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { ESCROW_PROGRAM_ID, USDC_MINT_DEVNET } from "./solana-config";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabase";
import IDL from "../../target/idl/zk_escrow.json";

export interface EscrowGift {
  id: string;
  giftId: string;
  pdaAddress: string;
  recipientPubKey: string;
  amount: number;
  tokenSymbol: string;
  message?: string;
  senderPublicKey: string;
  creationTimestamp: number;
  txSignature?: string;
  claimed: boolean;
  expiresAt: number;
}

export function derivePDA(giftId: string): [PublicKey, number] {
  const seeds = [Buffer.from("escrow"), Buffer.from(giftId)];
  return PublicKey.findProgramAddressSync(seeds, ESCROW_PROGRAM_ID);
}

export function deriveVaultPDA(giftId: string): [PublicKey, number] {
  const seeds = [Buffer.from("vault"), Buffer.from(giftId)];
  return PublicKey.findProgramAddressSync(seeds, ESCROW_PROGRAM_ID);
}

export async function buildUSDCEscrowTransaction(
  connection: Connection,
  sender: PublicKey,
  recipientPubKey: PublicKey,
  giftId: string,
  amountUSDC: number
): Promise<VersionedTransaction> {
  const amount = new BN(Math.floor(amountUSDC * 1_000_000));

  const [escrowStatePDA, escrowBump] = derivePDA(giftId);
  const [vaultPDA] = deriveVaultPDA(giftId);

  const senderATA = await getAssociatedTokenAddress(USDC_MINT_DEVNET, sender);

  const provider = new AnchorProvider(connection, {} as any, {});
  const program = new Program(IDL as any, provider);

  const ix = await program.methods
    .initializeGift(giftId, amount, recipientPubKey, escrowBump)
    .accounts({
      escrowState: escrowStatePDA,
      vault: vaultPDA,
      sender,
      senderTokenAccount: senderATA,
      mint: USDC_MINT_DEVNET,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const { blockhash } = await connection.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey: sender,
    recentBlockhash: blockhash,
    instructions: [ix],
  }).compileToV0Message();

  return new VersionedTransaction(message);
}

export async function buildClaimTransaction(
  connection: Connection,
  recipientPubKey: PublicKey,
  giftId: string
): Promise<Transaction> {
  const [escrowStatePDA] = derivePDA(giftId);
  const [vaultPDA] = deriveVaultPDA(giftId);

  const recipientATA = await getAssociatedTokenAddress(USDC_MINT_DEVNET, recipientPubKey);

  const instructions: TransactionInstruction[] = [];

  try {
    await getAccount(connection, recipientATA);
  } catch {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        recipientPubKey,
        recipientATA,
        recipientPubKey,
        USDC_MINT_DEVNET
      )
    );
  }

  const provider = new AnchorProvider(connection, {} as any, {});
  const program = new Program(IDL as any, provider);

  const claimIx = await program.methods
    .claimGift()
    .accounts({
      escrowState: escrowStatePDA,
      vault: vaultPDA,
      recipient: recipientPubKey,
      recipientTokenAccount: recipientATA,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  instructions.push(claimIx);

  const transaction = new Transaction();
  transaction.add(...instructions);

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = recipientPubKey;

  return transaction;
}

export function generateGiftId(): string {
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function saveEscrowGift(gift: EscrowGift): Promise<void> {
  const { error } = await supabase
    .from("gifts")
    .upsert(
      {
        id: gift.id,
        recipient: gift.recipientPubKey,
        sender: gift.senderPublicKey,
        amount: gift.amount.toString(),
        token: gift.tokenSymbol,
        pda: gift.pdaAddress,
        message: gift.message,
        claimed: gift.claimed,
        claimed_at: gift.claimed ? new Date().toISOString() : null,
        tx_signature: gift.txSignature,
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("Failed to save gift:", error);
    throw new Error("Failed to save gift to database");
  }
}

export async function getAllEscrowGifts(): Promise<EscrowGift[]> {
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch gifts:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    giftId: row.id,
    pdaAddress: row.pda,
    recipientPubKey: row.recipient,
    amount: parseFloat(row.amount),
    tokenSymbol: row.token,
    message: row.message,
    senderPublicKey: row.sender || "",
    creationTimestamp: Math.floor(new Date(row.created_at).getTime() / 1000),
    txSignature: row.tx_signature,
    claimed: row.claimed,
    expiresAt: new Date(row.created_at).getTime() + 24 * 60 * 60 * 1000,
  }));
}

export async function getEscrowGiftsBySender(senderAddress: string): Promise<EscrowGift[]> {
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .eq("sender", senderAddress)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch sender gifts:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    giftId: row.id,
    pdaAddress: row.pda,
    recipientPubKey: row.recipient,
    amount: parseFloat(row.amount),
    tokenSymbol: row.token,
    message: row.message,
    senderPublicKey: row.sender || "",
    creationTimestamp: Math.floor(new Date(row.created_at).getTime() / 1000),
    txSignature: row.tx_signature,
    claimed: row.claimed,
    expiresAt: new Date(row.created_at).getTime() + 24 * 60 * 60 * 1000,
  }));
}

export async function getEscrowGiftsByRecipient(recipientAddress: string): Promise<EscrowGift[]> {
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .eq("recipient", recipientAddress)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch recipient gifts:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    giftId: row.id,
    pdaAddress: row.pda,
    recipientPubKey: row.recipient,
    amount: parseFloat(row.amount),
    tokenSymbol: row.token,
    message: row.message,
    senderPublicKey: row.sender || "",
    creationTimestamp: Math.floor(new Date(row.created_at).getTime() / 1000),
    txSignature: row.tx_signature,
    claimed: row.claimed,
    expiresAt: new Date(row.created_at).getTime() + 24 * 60 * 60 * 1000,
  }));
}

export async function getEscrowGiftById(id: string): Promise<EscrowGift | null> {
  const { data, error } = await supabase.from("gifts").select("*").eq("id", id).single();

  if (error || !data) {
    console.error("Failed to fetch gift:", error);
    return null;
  }

  return {
    id: data.id,
    giftId: data.id,
    pdaAddress: data.pda,
    recipientPubKey: data.recipient,
    amount: parseFloat(data.amount),
    tokenSymbol: data.token,
    message: data.message,
    senderPublicKey: data.sender || "",
    creationTimestamp: Math.floor(new Date(data.created_at).getTime() / 1000),
    txSignature: data.tx_signature,
    claimed: data.claimed,
    expiresAt: new Date(data.created_at).getTime() + 24 * 60 * 60 * 1000,
  };
}

export async function claimEscrowGift(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("gifts")
    .update({
      claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("claimed", false);

  if (error) {
    console.error("Failed to claim gift:", error);
    return false;
  }

  return true;
}
