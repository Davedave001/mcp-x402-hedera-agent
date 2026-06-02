interface Props {
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ address, onConnect, onDisconnect }: Props) {
  if (!address) {
    return (
      <button className="btn-primary" onClick={onConnect}>
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="wallet-info">
      <span className="wallet-address">
        {address.slice(0, 6)}…{address.slice(-4)}
      </span>
      <button className="btn-secondary" onClick={onDisconnect}>
        Disconnect
      </button>
    </div>
  );
}
