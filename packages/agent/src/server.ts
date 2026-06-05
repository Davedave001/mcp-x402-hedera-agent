import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { createClient } from "./agent.js";
import { getBalance } from "./tools/balance.js";
import { transferHbar } from "./tools/transfer.js";
import { sendHcsMessage } from "./tools/hcs-message.js";
import { mintNft } from "./tools/nft-mint.js";
import { generateWalletReport } from "./tools/report.js";

const app = express();
app.use(cors());
app.use(express.json());

// x402 payment gate factory — returns Express middleware for a given price
function x402Gate(amount: string, description: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const receipt = _req.headers["x-payment"];
    if (!receipt) {
      res.status(402).json({
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453",
            payTo: process.env.PAYMENT_RECIPIENT_ADDRESS ?? "",
            asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
            amount,
            maxTimeoutSeconds: 300,
          },
        ],
        description,
      });
      return;
    }
    next();
  };
}

// ── AI Wallet Report — $0.50 ─────────────────────────────────────────────────
app.post(
  "/agent/report",
  x402Gate("500000", "Hedera Wallet Intelligence Report — AI-generated on-chain analysis"),
  async (req: Request, res: Response) => {
    const { accountId } = req.body as { accountId?: string };
    if (!accountId || typeof accountId !== "string") {
      res.status(400).json({ error: "accountId required" });
      return;
    }
    const client = createClient();
    try {
      const report = await generateWalletReport(client, accountId);
      res.json({ result: report });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);

// ── Agent Tool Executor — $0.10 ───────────────────────────────────────────────
app.post(
  "/agent/run",
  x402Gate("100000", "Hedera Agent Task Execution"),
  async (req: Request, res: Response) => {
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
  }
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`Agent server on :${PORT}`));
