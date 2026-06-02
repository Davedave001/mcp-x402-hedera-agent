import { useState, useCallback } from "react";
import { BrowserProvider } from "ethers";

export interface WalletState {
  address: string | null;
  provider: BrowserProvider | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({ address: null, provider: null });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("No EVM wallet detected. Install MetaMask or a compatible wallet.");
      return;
    }
    const provider = new BrowserProvider(window.ethereum as Parameters<typeof BrowserProvider>[0]);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    setWallet({ address, provider });
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: null, provider: null });
  }, []);

  return { ...wallet, connect, disconnect };
}
