import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { paymentMiddlewareFromConfig } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createClient } from "./agent.js";
import { getBalance } from "./tools/balance.js";
import { transferHbar } from "./tools/transfer.js";
import { sendHcsMessage } from "./tools/hcs-message.js";
import { mintNft } from "./tools/nft-mint.js";

const app = express();
app.use(cors());
app.use(express.json());

const facilitator = new HTTPFacilitatorClient({ url: "https://x402.blocky402.com" });

app.use(
  paymentMiddlewareFromConfig(
    {
      "/agent/run": {
        accepts: {
          scheme: "exact",
          payTo: process.env.PAYMENT_RECIPIENT_ADDRESS ?? "",
          price: "$0.10",
          network: "eip155:8453",
        },
        description: "Hedera Agent Task Execution",
      },
    },
    facilitator,
    [{ network: "eip155:8453", server: new ExactEvmScheme() }]
  )
);

app.post("/agent/run", async (req: Request, res: Response) => {
  const { task, params } = req.body as {
    task: string;
    params: Record<string, unknown>;
  };

  if (!task || typeof task !== "string") {
    res.status(400).json({ error: "task field required" });
    return;
  }
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    res.status(400).json({ error: "params object required" });
    return;
  }

  const client = createClient();

  try {
    switch (task) {
      case "get_balance":
        res.json({ result: await getBalance(client, params.accountId as string) });
        break;
      case "transfer_hbar":
        res.json({ result: await transferHbar(client, params.toAccountId as string, Number(params.amount)) });
        break;
      case "send_hcs_message":
        res.json({ result: await sendHcsMessage(client, params.topicId as string, params.message as string) });
        break;
      case "mint_nft":
        res.json({ result: await mintNft(client, params.tokenId as string, params.metadata as Record<string, unknown>) });
        break;
      default:
        res.status(400).json({ error: `Unknown task: ${task}` });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`Agent server on :${PORT}`));
