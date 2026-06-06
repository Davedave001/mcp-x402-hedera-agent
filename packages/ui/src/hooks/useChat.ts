import { useState, useRef } from "react";
import { BrowserProvider, type Eip1193Provider } from "ethers";

const HEDERA_TESTNET = {
  chainId: "0x128",
  chainName: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

const AGENT_URL = (import.meta.env.VITE_AGENT_URL as string | undefined) ?? "";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface X402Requirements {
  accepts: Array<{ network: string; asset: string; amount: string; payTo: string }>;
}

async function ensureHederaTestnet(): Promise<BrowserProvider> {
  const raw = window.ethereum as Eip1193Provider & { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  const current = await raw.request({ method: "eth_chainId" }) as string;
  if (current !== HEDERA_TESTNET.chainId) {
    try {
      await raw.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HEDERA_TESTNET.chainId }] });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 4902) {
        await raw.request({ method: "wallet_addEthereumChain", params: [HEDERA_TESTNET] });
      } else {
        throw new Error("Please switch your wallet to Hedera Testnet.");
      }
    }
  }
  return new BrowserProvider(window.ethereum as Eip1193Provider);
}

async function signPayment(_provider: BrowserProvider, req: X402Requirements): Promise<string> {
  const accept = req.accepts[0];
  const provider = await ensureHederaTestnet();
  const signer = await provider.getSigner();
  // Native HBAR transfer — no ERC20 contract needed
  const tx = await signer.sendTransaction({
    to: accept.payTo,
    value: BigInt(accept.amount),
  });
  await tx.wait();
  return btoa(JSON.stringify({ txHash: tx.hash, network: accept.network, asset: "HBAR" }));
}

export function useChat(accountId: string, apiKey: string, provider: BrowserProvider | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);

  const send = async (userMessage: string) => {
    if (!userMessage.trim()) return;
    setLoading(true);
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: userMessage };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["x-anthropic-key"] = apiKey;

      const body = JSON.stringify({
        message: userMessage,
        history: historyRef.current,
        accountId,
      });

      let res = await fetch(`${AGENT_URL}/agent/chat`, { method: "POST", headers, body });

      // x402 payment flow if no user key
      if (res.status === 402 && !apiKey) {
        if (!provider) throw new Error("Connect your wallet to pay per message, or add your Anthropic API key in Settings.");
        const requirements: X402Requirements = await res.json();
        const receipt = await signPayment(provider, requirements);
        headers["x-payment"] = receipt;
        res = await fetch(`${AGENT_URL}/agent/chat`, { method: "POST", headers, body });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

      const aiMsg: ChatMessage = { role: "assistant", content: data.response };
      const final = [...nextMessages, aiMsg];
      setMessages(final);
      historyRef.current = data.history ?? final;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMessages((prev) => prev.slice(0, -1)); // remove the unsent user message
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([]);
    historyRef.current = [];
    setError(null);
  };

  return { messages, loading, error, send, clear };
}
