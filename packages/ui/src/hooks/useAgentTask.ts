import { useState } from "react";
import axios from "axios";
import type { BrowserProvider } from "ethers";

const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? "http://localhost:3001";

interface X402Requirements {
  accepts: Array<{
    network: string;
    asset: string;
    amount: string;
    payTo: string;
  }>;
}

export function useAgentTask(provider: BrowserProvider | null) {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTask = async (task: string, params: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const probe = await axios.post(
        `${AGENT_URL}/agent/run`,
        { task, params },
        { validateStatus: () => true }
      );

      if (probe.status === 402) {
        if (!provider) throw new Error("Wallet not connected");
        const receipt = await fulfillX402Payment(provider, probe.data as X402Requirements);
        const paid = await axios.post(
          `${AGENT_URL}/agent/run`,
          { task, params },
          { headers: { "x-payment": receipt } }
        );
        setResult(paid.data);
      } else {
        setResult(probe.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return { runTask, result, loading, error };
}

async function fulfillX402Payment(
  provider: BrowserProvider,
  requirements: X402Requirements
): Promise<string> {
  const accept = requirements.accepts[0];
  if (!accept) throw new Error("No payment option returned by server");

  const signer = await provider.getSigner();

  // USDC on Base uses ERC-20 transfer. Encode transfer(address,uint256).
  const iface = new (await import("ethers")).Interface([
    "function transfer(address to, uint256 amount) returns (bool)",
  ]);
  const data = iface.encodeFunctionData("transfer", [
    accept.payTo,
    BigInt(accept.amount),
  ]);

  // USDC contract address on Base mainnet
  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  const tx = await signer.sendTransaction({ to: USDC_BASE, data });
  await tx.wait();

  const receipt = btoa(
    JSON.stringify({ txHash: tx.hash, network: accept.network, asset: accept.asset })
  );
  return receipt;
}
