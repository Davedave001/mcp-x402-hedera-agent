import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@hashgraph/sdk";
import { getBalance } from "./balance.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function generateWalletReport(client: Client, accountId: string) {
  // 1. Pull live on-chain data via Hedera Agent Kit tools
  const balanceData = await getBalance(client, accountId);

  const tokenCount = balanceData.tokens
    ? Object.keys(balanceData.tokens).length
    : 0;

  const onChainContext = `
Hedera Account: ${accountId}
HBAR Balance: ${balanceData.hbars}
Token Holdings: ${tokenCount} token type(s)
${
  tokenCount > 0
    ? "Token details: " + JSON.stringify(balanceData.tokens, null, 2)
    : "No token holdings detected."
}
Network: Hedera Testnet
Data fetched: ${new Date().toISOString()}
  `.trim();

  // 2. Generate AI report using Claude
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a Hedera blockchain analyst. Generate a concise, insightful wallet intelligence report for the following on-chain data. Include: account health, token portfolio summary, activity assessment, and 2-3 actionable insights. Keep it professional and under 300 words.

On-chain data:
${onChainContext}`,
      },
    ],
  });

  const reportText =
    message.content[0].type === "text" ? message.content[0].text : "";

  return {
    accountId,
    generatedAt: new Date().toISOString(),
    onChainData: balanceData,
    report: reportText,
    model: "claude-sonnet-4-6",
  };
}
