import "dotenv/config";
import {
  HederaMCPToolkit,
  coreAccountQueryPlugin,
  coreConsensusPlugin,
  coreTokenPlugin,
} from "hedera-agent-kit";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./agent.js";

const client = createClient();

const toolkit = new HederaMCPToolkit({
  client,
  configuration: {
    plugins: [coreAccountQueryPlugin, coreConsensusPlugin, coreTokenPlugin],
  },
});

const transport = new StdioServerTransport();
toolkit.connect(transport).catch(console.error);
