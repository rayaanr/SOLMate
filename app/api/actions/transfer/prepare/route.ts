import { NextRequest } from "next/server";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Initialize connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "confirmed"
);

// Resolve recipient (handles both pubkeys and .sol domains)
async function resolveRecipient(recipient: string): Promise<PublicKey> {
  // Remove @ prefix if present
  const cleanRecipient = recipient.startsWith("@")
    ? recipient.slice(1)
    : recipient;

  // Try to parse as base58 pubkey first
  try {
    return new PublicKey(cleanRecipient);
  } catch {
    // If it ends with .sol, try to resolve via SNS
    if (cleanRecipient.endsWith(".sol")) {
      // For now, throw an error - we'll implement SNS resolution later
      throw new Error(
        `SNS domain resolution not yet implemented for ${cleanRecipient}. Please use a wallet address.`
      );
    }
    throw new Error(`Invalid recipient format: ${recipient}`);
  }
}

// Get token info by symbol or mint address
async function getTokenInfo(
  tokenIdentifier: string
): Promise<{ mint: PublicKey; decimals: number; symbol: string } | null> {
  // Common tokens on Solana mainnet
  const commonTokens: Record<string, { mint: string; decimals: number }> = {
    USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
    USDT: { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
    SOL: { mint: "So11111111111111111111111111111111111111112", decimals: 9 }, // Wrapped SOL
  };

  // Check if it's a known symbol
  if (commonTokens[tokenIdentifier.toUpperCase()]) {
    const token = commonTokens[tokenIdentifier.toUpperCase()];
    return {
      mint: new PublicKey(token.mint),
      decimals: token.decimals,
      symbol: tokenIdentifier.toUpperCase(),
    };
  }

  // Try to parse as mint address
  try {
    const mintPk = new PublicKey(tokenIdentifier);
    const mintInfo = await getMint(connection, mintPk);
    return {
      mint: mintPk,
      decimals: mintInfo.decimals,
      symbol: tokenIdentifier, // Use mint address as symbol for now
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fromPubkey, recipient, amount, token } = (await req.json()) as {
      fromPubkey: string; // user wallet pubkey
      recipient: string; // pubkey or @handle
      amount: string; // human units, e.g., "5"
      token?: string | null; // token symbol or mint address, null for SOL
    };

    const from = new PublicKey(fromPubkey);
    const to = await resolveRecipient(recipient);

    const { blockhash } = await connection.getLatestBlockhash("finalized");
    const instructions: any[] = [];
    let preview: Record<string, any> = {};
    let lamportFeeEstimate = 5000; // Base fee estimate

    if (!token || token.toLowerCase() === "sol") {
      // Native SOL transfer
      const lamports = Math.round(Number(amount) * LAMPORTS_PER_SOL);
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports,
        })
      );

      preview = {
        type: "SOL_TRANSFER",
        from: from.toBase58(),
        to: to.toBase58(),
        amount: Number(amount),
        symbol: "SOL",
        description: `Transfer ${amount} SOL to ${recipient}`,
      };
    } else {
      // SPL token transfer
      const tokenInfo = await getTokenInfo(token);
      if (!tokenInfo) {
        throw new Error(`Unknown token: ${token}`);
      }

      const { mint: mintPk, decimals, symbol } = tokenInfo;

      // Build ATAs
      const fromAta = await getAssociatedTokenAddress(
        mintPk,
        from,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const toAta = await getAssociatedTokenAddress(
        mintPk,
        to,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check if recipient ATA exists
      const toAtaInfo = await connection.getAccountInfo(toAta);
      if (!toAtaInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            from,
            toAta,
            to,
            mintPk,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
        lamportFeeEstimate += 2039280; // ATA creation cost
      }

      // Amount in base units
      const baseAmount = Math.round(Number(amount) * Math.pow(10, decimals));

      instructions.push(
        createTransferInstruction(
          fromAta,
          toAta,
          from,
          baseAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      preview = {
        type: "SPL_TRANSFER",
        mint: mintPk.toBase58(),
        from: from.toBase58(),
        to: to.toBase58(),
        amount: Number(amount),
        symbol,
        decimals,
        description: `Transfer ${amount} ${symbol} to ${recipient}`,
      };
    }

    // Build versioned transaction (unsigned)
    const messageV0 = new TransactionMessage({
      payerKey: from,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    // Get fee estimate
    try {
      const fee = await connection.getFeeForMessage(messageV0, "confirmed");
      if (fee?.value) {
        lamportFeeEstimate = fee.value;
      }
    } catch (error) {
      console.warn("Could not get fee estimate:", error);
    }

    // Serialize transaction to base64
    const txBase64 = Buffer.from(transaction.serialize()).toString("base64");

    // Create intent with expiry
    const intent = {
      intentId: crypto.randomUUID(),
      txBase64,
      preview,
      expiresAt: Date.now() + 120_000, // 2 minutes
      feeLamports: lamportFeeEstimate,
      createdAt: Date.now(),
    };

    // TODO: Store intent in Redis/DB with TTL
    // For now, we'll return everything for the frontend to handle

    return new Response(JSON.stringify(intent), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Transaction preparation error:", error);
    return new Response(
      JSON.stringify({
        error: (error instanceof Error ? error.message : "Failed to prepare transaction"),
        details: (error instanceof Error ? error.toString() : String(error)),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
