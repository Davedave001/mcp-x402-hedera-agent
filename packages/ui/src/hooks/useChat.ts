import { useState, useRef } from "react";
import { BrowserProvider, type Eip1193Provider } from "ethers";

const AGENT_URL = (import.meta.env.VITE_AGENT_URL as string | undefined) ?? "";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface X402Requirements {
  accepts: Array<{ network: string; asset: string; amount: string; payTo: string }>;
}

async function ensureBaseProvider(): Promise<BrowserProvider> {
  const BASE_CHAIN_ID = "0x2105";
  const raw = window.ethereum as Eip1193Provider & { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  const currentChain = await raw.request({ method: "eth_chainId" }) as string;
  if (currentChain !== BASE_CHAIN_ID) {
    try {
      await raw.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_CHAIN_ID }] });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 4902) {
        await raw.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: BASE_CHAIN_ID, chainName: "Base", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://mainnet.base.org"], blockExplorerUrls: ["https://basescan.org"] }],
        });
      } else {
        throw new Error("Please switch your wallet to the Base network to pay.");
      }
    }
  }
  return new BrowserProvider(window.ethereum as Eip1193Provider);
}

async function signPayment(_provider: BrowserProvider, req: X402Requirements): Promise<string> {
  const accept = req.accepts[0];
  const provider = await ensureBaseProvider();
  const signer = await provider.getSigner();
  const { Interface } = await import("ethers");
  const iface = new Interface(["function transfer(address to, uint256 amount) returns (bool)"]);
  const data = iface.encodeFunctionData("transfer", [accept.payTo, BigInt(accept.amount)]);
  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const tx = await signer.sendTransaction({ to: USDC_BASE, data });
  await tx.wait();
  return btoa(JSON.stringify({ txHash: tx.hash, network: accept.network, asset: accept.asset }));
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
