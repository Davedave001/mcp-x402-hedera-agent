interface Props {
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ address, onConnect, onDisconnect }: Props) {
  if (!address) {
    return (
      <button className="btn-connect" onClick={onConnect}>
        Connect Wallet
      </button>
    );
  }
  return (
    <>
      <span className="wallet-address-pill">
        {address.slice(0, 6)}…{address.slice(-4)}
      </span>
      <button className="btn-disconnect" onClick={onDisconnect}>
        Disconnect
      </button>
    </>
  );
}
