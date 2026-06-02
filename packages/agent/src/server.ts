import "dotenv/config";
import express from "express";
import cors from "cors";
import { paymentMiddleware, Network } from "@coinbase/x402-express";
import { createAgent } from "./agent";
import { getBalance } from "./tools/balance";
import { transferHbar } from "./tools/transfer";
import { sendHcsMessage } from "./tools/hcs-message";
import { mintNft } from "./tools/nft-mint";

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  "/agent/run",
  paymentMiddleware(
    process.env.PAYMENT_RECIPIENT_ADDRESS!,
    {
      "/agent/run": {
        price: "$0.10",
        network: Network.BaseMainnet,
        config: { description: "Hedera Agent Task Execution" },
      },
    },
    { facilitatorUrl: "https://x402.blocky402.com" }
  )
);

app.post("/agent/run", async (req, res) => {
  const { task, params } = req.body as {
    task: string;
    params: Record<string, unknown>;
  };

  if (!task || typeof task !== "string") {
    return res.status(400).json({ error: "task field required" });
  }
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return res.status(400).json({ error: "params object required" });
  }

  const agent = createAgent();

  try {
    switch (task) {
      case "get_balance":
        return res.json({ result: await getBalance(agent, params.accountId as string) });
      case "transfer_hbar":
        return res.json({ result: await transferHbar(agent, params.toAccountId as string, Number(params.amount)) });
      case "send_hcs_message":
        return res.json({ result: await sendHcsMessage(agent, params.topicId as string, params.message as string) });
      case "mint_nft":
        return res.json({ result: await mintNft(agent, params.tokenId as string, params.metadata as Record<string, unknown>) });
      default:
        return res.status(400).json({ error: `Unknown task: ${task}` });
    }
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`Agent server on :${PORT}`));
