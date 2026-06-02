import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAgent } from "./agent";

export const server = new McpServer({ name: "hedera-agent", version: "1.0.0" });
export const agent = createAgent();

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
