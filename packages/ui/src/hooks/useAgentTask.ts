import { useState } from "react";
import axios from "axios";
import { BrowserProvider, type Eip1193Provider } from "ethers";

const AGENT_URL = (import.meta.env.VITE_AGENT_URL as string | undefined) ?? "";

// Hedera Testnet EVM — chain ID 296 = 0x128
const HEDERA_TESTNET = {
  chainId: "0x128",
  chainName: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

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
      if (!provider) throw new Error("Connect your wallet to pay with HBAR.");
      const receipt = await fulfillHBARPayment(provider, probe.data as X402Requirements);
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

// Ensures wallet is on Hedera Testnet and returns a fresh provider.
async function ensureHederaTestnet(): Promise<BrowserProvider> {
  const raw = window.ethereum as Eip1193Provider & {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  };

  const current = (await raw.request({ method: "eth_chainId" })) as string;
  if (current !== HEDERA_TESTNET.chainId) {
    try {
      await raw.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HEDERA_TESTNET.chainId }],
      });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 4902) {
        await raw.request({ method: "wallet_addEthereumChain", params: [HEDERA_TESTNET] });
      } else {
        throw new Error("Please switch your wallet to Hedera Testnet.");
      }
    }
  }
  // Always return a fresh provider after a possible chain switch
  return new BrowserProvider(window.ethereum as Eip1193Provider);
}

async function fulfillHBARPayment(
  _provider: BrowserProvider,
  requirements: X402Requirements
): Promise<string> {
  const accept = requirements.accepts[0];
  if (!accept) throw new Error("No payment option returned by server");

  const provider = await ensureHederaTestnet();
  const signer = await provider.getSigner();

  // Native HBAR transfer — no ERC20 contract, just a value transfer
  const tx = await signer.sendTransaction({
    to: accept.payTo,
    value: BigInt(accept.amount),
  });
  await tx.wait();

  return btoa(JSON.stringify({ txHash: tx.hash, network: accept.network, asset: "HBAR" }));
}
