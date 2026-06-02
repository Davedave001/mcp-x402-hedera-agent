import { useWallet } from "./hooks/useWallet";
import { useAgentTask } from "./hooks/useAgentTask";
import { WalletConnect } from "./components/WalletConnect";
import { TaskSelector } from "./components/TaskSelector";
import { ResultDisplay } from "./components/ResultDisplay";

export default function App() {
  const { address, provider, connect, disconnect } = useWallet();
  const { runTask, result, loading, error } = useAgentTask(provider);

  return (
    <main className="container">
      <header className="header">
        <h1>Hedera x402 Agent</h1>
        <p className="subtitle">Pay-per-use AI agent powered by Hedera + x402</p>
        <WalletConnect
          address={address}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </header>

      <section className="tasks-section">
        <h2>Available Tasks</h2>
        <TaskSelector
          disabled={!address || loading}
          onRun={runTask}
        />
      </section>

      <section className="result-section">
        <ResultDisplay loading={loading} error={error} result={result} />
      </section>
    </main>
  );
}
