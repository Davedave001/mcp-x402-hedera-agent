import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "./agent.js";
import { getBalance } from "./tools/balance.js";
import { transferHbar } from "./tools/transfer.js";
import { sendHcsMessage } from "./tools/hcs-message.js";
import { mintNft } from "./tools/nft-mint.js";

const server = new McpServer({ name: "hedera-agent", version: "1.0.0" });
const client = createClient();

server.tool(
  "hedera_get_balance",
  { accountId: z.string().describe("Hedera account ID e.g. 0.0.12345") },
  async ({ accountId }) => {
    const result = await getBalance(client, accountId);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "hedera_transfer_hbar",
  {
    toAccountId: z.string().describe("Recipient Hedera account ID"),
    amount: z.number().describe("Amount in HBAR"),
  },
  async ({ toAccountId, amount }) => {
    const result = await transferHbar(client, toAccountId, amount);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "hedera_send_hcs_message",
  {
    topicId: z.string().describe("HCS topic ID e.g. 0.0.9146759"),
    message: z.string().describe("Message content to submit to the topic"),
  },
  async ({ topicId, message }) => {
    const result = await sendHcsMessage(client, topicId, message);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "hedera_mint_nft",
  {
    tokenId: z.string().describe("NFT token collection ID e.g. 0.0.9146760"),
    metadata: z.record(z.unknown()).describe("NFT metadata as a JSON object"),
  },
  async ({ tokenId, metadata }) => {
    const result = await mintNft(client, tokenId, metadata);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
