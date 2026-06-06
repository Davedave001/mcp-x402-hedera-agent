import { useState } from "react";
import axios from "axios";
import { BrowserProvider, type Eip1193Provider } from "ethers";

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

// Switches to Base and returns a FRESH provider created after the switch.
// The old provider instance throws NETWORK_ERROR when the chain changes,
// so we must re-instantiate from window.ethereum on the new chain.
async function ensureBaseProvider(): Promise<BrowserProvider> {
  const BASE_CHAIN_ID = "0x2105"; // 8453

  const raw = window.ethereum as Eip1193Provider & { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };

  const currentChain = await raw.request({ method: "eth_chainId" }) as string;
  if (currentChain !== BASE_CHAIN_ID) {
    try {
      await raw.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_CHAIN_ID }],
      });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 4902) {
        await raw.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BASE_CHAIN_ID,
            chainName: "Base",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          }],
        });
      } else {
        throw new Error("Please switch your wallet to the Base network to pay.");
      }
    }
  }

  // Always return a fresh provider — never reuse one created on a different chain
  return new BrowserProvider(window.ethereum as Eip1193Provider);
}

async function fulfillX402Payment(
  _provider: BrowserProvider,
  requirements: X402Requirements
): Promise<string> {
  const accept = requirements.accepts[0];
  if (!accept) throw new Error("No payment option returned by server");

  const provider = await ensureBaseProvider();
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
