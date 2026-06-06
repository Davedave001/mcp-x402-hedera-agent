import { useState } from "react";
import axios from "axios";
import type { BrowserProvider } from "ethers";

// Empty string = same origin; nginx proxies /agent/* to the backend.
// Override with VITE_AGENT_URL at build time for local dev (e.g. http://localhost:3001).
const AGENT_URL = (import.meta.env.VITE_AGENT_URL as string | undefined) ?? "";

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

  async function call402Endpoint(
    endpoint: string,
    body: Record<string, unknown>
  ) {
    const probe = await axios.post(`${AGENT_URL}${endpoint}`, body, {
      validateStatus: () => true,
    });

    if (probe.status === 402) {
      if (!provider) throw new Error("Wallet not connected");
      const receipt = await fulfillX402Payment(
        provider,
        probe.data as X402Requirements
      );
      const paid = await axios.post(`${AGENT_URL}${endpoint}`, body, {
        headers: { "x-payment": receipt },
        validateStatus: () => true,
      });
      if (paid.status >= 400) {
        throw new Error(paid.data?.error ?? `Server error ${paid.status}`);
      }
      return paid.data;
    }

    if (probe.status >= 400) {
      throw new Error(probe.data?.error ?? `Server error ${probe.status}`);
    }
    return probe.data;
  }

  const runTask = async (task: string, params: Record<string, unknown>): Promise<unknown> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await call402Endpoint("/agent/run", { task, params });
      setResult(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runReport = async (accountId: string): Promise<unknown> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await call402Endpoint("/agent/report", { accountId });
      setResult(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { runTask, runReport, result, loading, error };
}

async function switchToBase(provider: BrowserProvider): Promise<void> {
  const BASE_CHAIN_ID = 8453n;
  const network = await provider.getNetwork();
  if (network.chainId === BASE_CHAIN_ID) return;

  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: "0x2105" }]);
  } catch (switchErr: unknown) {
    // Chain not added yet — add it then retry
    if ((switchErr as { code?: number }).code === 4902) {
      await provider.send("wallet_addEthereumChain", [{
        chainId: "0x2105",
        chainName: "Base",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
      }]);
    } else {
      throw new Error("Please switch your wallet to the Base network to pay.");
    }
  }
}

async function fulfillX402Payment(
  provider: BrowserProvider,
  requirements: X402Requirements
): Promise<string> {
  const accept = requirements.accepts[0];
  if (!accept) throw new Error("No payment option returned by server");

  await switchToBase(provider);

  const signer = await provider.getSigner();

  const iface = new (await import("ethers")).Interface([
    "function transfer(address to, uint256 amount) returns (bool)",
  ]);
  const data = iface.encodeFunctionData("transfer", [
    accept.payTo,
    BigInt(accept.amount),
  ]);

  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const tx = await signer.sendTransaction({ to: USDC_BASE, data });
  await tx.wait();

  return btoa(
    JSON.stringify({ txHash: tx.hash, network: accept.network, asset: accept.asset })
  );
}
