import "dotenv/config";
import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export function createAgent(): HederaAgentKit {
  return new HederaAgentKit({
    accountId: process.env.HEDERA_ACCOUNT_ID!,
    privateKey: process.env.HEDERA_PRIVATE_KEY!,
    network: (process.env.HEDERA_NETWORK as "testnet" | "mainnet") ?? "testnet",
  });
}
