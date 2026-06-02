import "dotenv/config";
import express from "express";
import cors from "cors";
import { paymentMiddleware, Network } from "@coinbase/x402-express";

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

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`Agent server on :${PORT}`));
