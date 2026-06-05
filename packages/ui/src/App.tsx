import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useAgentTask } from "./hooks/useAgentTask";
import { WalletConnect } from "./components/WalletConnect";
import { TaskSelector } from "./components/TaskSelector";
import { ResultDisplay } from "./components/ResultDisplay";
import { ReportDisplay } from "./components/ReportDisplay";

export default function App() {
  const { address, provider, connect, disconnect } = useWallet();
  const { runTask, runReport, result, loading, error } = useAgentTask(provider);
  const [reportAccountId, setReportAccountId] = useState("0.0.6188111");

  const isReport =
    result !== null &&
    result !== undefined &&
    typeof result === "object" &&
    "result" in (result as object) &&
    typeof (result as { result: unknown }).result === "object" &&
    (result as { result: { report?: unknown } }).result !== null &&
    "report" in ((result as { result: object }).result);

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

      {/* ── AI Report — hero feature ─────────────────────────── */}
      <section className="report-section">
        <div className="report-header">
          <div>
            <h2>Wallet Intelligence Report</h2>
            <p className="report-desc">
              AI-generated on-chain analysis of any Hedera account — pay once, get instant insights.
            </p>
          </div>
          <span className="report-price">$0.50</span>
        </div>
        <div className="report-input-row">
          <input
            className="account-input"
            type="text"
            placeholder="Hedera account ID e.g. 0.0.12345"
            value={reportAccountId}
            onChange={(e) => setReportAccountId(e.target.value)}
            disabled={loading}
          />
          <button
            className="btn-primary btn-large"
            disabled={!address || loading || !reportAccountId}
            onClick={() => runReport(reportAccountId)}
          >
            Generate Report
          </button>
        </div>
      </section>

      {/* ── Agent tools ──────────────────────────────────────── */}
      <section className="tasks-section">
        <h2>Agent Tools</h2>
        <TaskSelector disabled={!address || loading} onRun={runTask} />
      </section>

      {/* ── Result ───────────────────────────────────────────── */}
      <section className="result-section">
        {isReport ? (
          <ReportDisplay data={(result as { result: { accountId: string; generatedAt: string; onChainData: unknown; report: string } }).result} />
        ) : (
          <ResultDisplay loading={loading} error={error} result={result} />
        )}
        {loading && <ResultDisplay loading={loading} error={null} result={null} />}
        {error && <ResultDisplay loading={false} error={error} result={null} />}
      </section>
    </main>
  );
}
