import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createAgent } from "./agent";
import { getBalance } from "./tools/balance";
import { transferHbar } from "./tools/transfer";

export const server = new McpServer({ name: "hedera-agent", version: "1.0.0" });
export const agent = createAgent();

server.tool(
  "hedera_get_balance",
  { accountId: z.string().describe("Hedera account ID e.g. 0.0.12345") },
  async ({ accountId }) => {
    const result = await getBalance(agent, accountId);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
);

server.tool(
  "hedera_transfer_hbar",
  {
    toAccountId: z.string().describe("Recipient Hedera account ID"),
    amount: z.number().describe("Amount in HBAR"),
  },
  async ({ toAccountId, amount }) => {
    const result = await transferHbar(agent, toAccountId, amount);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
);

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
