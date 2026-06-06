import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@hashgraph/sdk";
import { getBalance } from "./balance.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface TokenRow {
  id: string;
  balance: number;
  type: string;
}

export interface ReportAnalysis {
  accountHealth: { status: "HEALTHY" | "AT_RISK" | "INACTIVE"; description: string };
  tokenPortfolio: { tokens: TokenRow[]; totalUnits: number; summary: string };
  activityAssessment: string;
  insights: { title: string; description: string }[];
  disclaimer: string;
}

export interface WalletReport {
  accountId: string;
  generatedAt: string;
  hbars: string;
  tokens: TokenRow[];
  analysis: ReportAnalysis;
}

export async function generateWalletReport(
  client: Client,
  accountId: string
): Promise<WalletReport> {
  const balanceData = await getBalance(client, accountId);

  const tokens: TokenRow[] = balanceData.tokens
    ? Object.entries(balanceData.tokens).map(([id, val]) => ({
        id,
        balance: Number(val),
        type: "HTS Token",
      }))
    : [];

  const tokenLines = tokens
    .map((t) => `  ${t.id}: ${t.balance} units`)
    .join("\n");

  const onChainContext = `Account: ${accountId}
HBAR Balance: ${balanceData.hbars}
Token holdings (${tokens.length}):
${tokenLines || "  None"}
Network: Hedera Testnet
Timestamp: ${new Date().toISOString()}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a Hedera blockchain analyst. Analyse the data below and return ONLY valid JSON — no markdown, no code fences.

Required shape:
{
  "accountHealth": { "status": "HEALTHY"|"AT_RISK"|"INACTIVE", "description": "2-3 sentences" },
  "tokenPortfolio": {
    "tokens": [{ "id": "0.0.X", "balance": 123, "type": "HTS Token"|"NFT" }],
    "totalUnits": 0,
    "summary": "1-2 sentences"
  },
  "activityAssessment": "2-3 sentences",
  "insights": [
    { "title": "Short title", "description": "1-2 sentences" },
    { "title": "Short title", "description": "1-2 sentences" },
    { "title": "Short title", "description": "1-2 sentences" }
  ],
  "disclaimer": "Report based on Hedera Testnet snapshot data. Not financial advice."
}

Rules: exactly 3 insights, totalUnits = sum of all balances, mark tokens with balance ≤ 10 as NFT type.

Data:
${onChainContext}`,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text.trim() : "{}";

  let analysis: ReportAnalysis;
  try {
    analysis = JSON.parse(raw);
    // Merge real token data into portfolio so IDs are always accurate
    analysis.tokenPortfolio.tokens = tokens.map((t) => ({
      ...t,
      type: t.balance <= 10 ? "NFT" : "HTS Token",
    }));
    analysis.tokenPortfolio.totalUnits = tokens.reduce(
      (sum, t) => sum + t.balance,
      0
    );
  } catch {
    analysis = {
      accountHealth: { status: "HEALTHY", description: raw },
      tokenPortfolio: { tokens, totalUnits: 0, summary: "" },
      activityAssessment: "",
      insights: [],
      disclaimer: "Report based on Hedera Testnet snapshot data. Not financial advice.",
    };
  }

  return { accountId, generatedAt: new Date().toISOString(), hbars: balanceData.hbars, tokens, analysis };
}
