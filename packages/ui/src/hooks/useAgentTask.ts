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

// Stub — replaced in next commit with real ethers.js signing
async function fulfillX402Payment(
  _provider: BrowserProvider,
  _requirements: X402Requirements
): Promise<string> {
  throw new Error("Payment signing not yet implemented");
}
