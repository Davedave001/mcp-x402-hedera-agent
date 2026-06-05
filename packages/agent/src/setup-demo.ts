/**
 * One-time setup script — run once to create the demo HCS topic and NFT
 * collection on Hedera testnet using your operator account.
 *
 * Usage:
 *   cd packages/agent
 *   npx tsx src/setup-demo.ts
 *
 * Copy the printed IDs into packages/ui/src/components/TaskSelector.tsx.
 */
import "dotenv/config";
import {
  TopicCreateTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
} from "@hashgraph/sdk";
import { createClient } from "./agent.js";

const client = createClient();

console.log("Creating HCS topic…");
const topicTx = await new TopicCreateTransaction()
  .setTopicMemo("Hedera x402 Agent — demo topic")
  .execute(client);
const topicReceipt = await topicTx.getReceipt(client);
const topicId = topicReceipt.topicId!.toString();
console.log(`✓ Topic created: ${topicId}`);

console.log("Creating NFT token collection…");
const tokenTx = await new TokenCreateTransaction()
  .setTokenName("Hedera x402 Agent NFT")
  .setTokenSymbol("X402NFT")
  .setTokenType(TokenType.NonFungibleUnique)
  .setSupplyType(TokenSupplyType.Infinite)
  .setTreasuryAccountId(client.operatorAccountId!)
  .setSupplyKey(client.operatorPublicKey!)
  .execute(client);
const tokenReceipt = await tokenTx.getReceipt(client);
const tokenId = tokenReceipt.tokenId!.toString();
console.log(`✓ NFT token created: ${tokenId}`);

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Copy these IDs into TaskSelector.tsx:

  send_hcs_message → topicId: "${topicId}"
  mint_nft         → tokenId: "${tokenId}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

client.close();
