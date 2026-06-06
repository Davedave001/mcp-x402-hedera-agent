import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useAgentTask } from "./hooks/useAgentTask";
import { WalletConnect } from "./components/WalletConnect";
import { TaskSelector } from "./components/TaskSelector";
import { ResultDisplay } from "./components/ResultDisplay";
import { ReportDisplay } from "./components/ReportDisplay";
import type { WalletReport } from "./types";

type Panel =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "report"; data: WalletReport }
  | { kind: "tool"; data: unknown };

export default function App() {
  const { address, provider, connect, disconnect } = useWallet();
  const { runTask, runReport } = useAgentTask(provider);
  const [reportAccountId, setReportAccountId] = useState("0.0.6188111");
  const [panel, setPanel] = useState<Panel>({ kind: "empty" });

  const handleReport = async () => {
    setPanel({ kind: "loading" });
    try {
      const res = await runReport(reportAccountId);
      const inner = (res as { result?: WalletReport } | null)?.result;
      if (inner && "analysis" in inner) {
        setPanel({ kind: "report", data: inner });
      } else {
        setPanel({ kind: "tool", data: res });
      }
    } catch (e) {
      setPanel({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  // runTask via direct fetch so result flows back through panel state
  const handleRun = async (taskId: string, params: Record<string, unknown>) => {
    setPanel({ kind: "loading" });
    try {
      const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? "http://localhost:3001";
      const probe = await fetch(`${AGENT_URL}/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskId, params }),
      });
      if (probe.status === 402) {
        // trigger full x402 flow via hook
        await runTask(taskId, params);
        setPanel({ kind: "tool", data: { note: "check result above" } });
        return;
      }
      const data = await probe.json();
      setPanel({ kind: "tool", data });
    } catch (e) {
      setPanel({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <div className="app-layout">
      {/* Wallet top-right */}
      <div className="top-bar">
        <WalletConnect address={address} onConnect={connect} onDisconnect={disconnect} />
      </div>

      <div className="main-area">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="app-brand">
            <div className="brand-icon">H</div>
            <div className="brand-text">
              <h1>Hedera x402 Agent</h1>
              <p>Pay-per-use AI agent powered by Hedera + x402</p>
            </div>
          </div>

          <div className="report-widget">
            <div className="report-widget-header">
              <div>
                <h2>Wallet Intelligence Report</h2>
                <p className="report-widget-desc">
                  AI-generated on-chain analysis of any Hedera account — pay once, get instant insights.
                </p>
              </div>
            </div>
            <div className="report-input-row">
              <span className="account-icon">👤</span>
              <input
                className="account-input"
                type="text"
                placeholder="Hedera account ID e.g. 0.0.12345"
                value={reportAccountId}
                onChange={(e) => setReportAccountId(e.target.value)}
                disabled={panel.kind === "loading"}
              />
              <span className="account-price-pill">$0.50</span>
            </div>
            <button
              className="btn-generate"
              disabled={!address || panel.kind === "loading" || !reportAccountId}
              onClick={handleReport}
            >
              ✦ Generate Report
            </button>
          </div>

          <TaskSelector
            disabled={!address || panel.kind === "loading"}
            onRun={handleRun}
          />
        </aside>

        {/* ── Content panel ── */}
        <div className="content-panel">
          {panel.kind === "empty" && (
            <div className="content-empty">
              <div className="content-empty-icon">✦</div>
              <p>Connect your wallet and generate a report</p>
              <p>or run an agent tool to see results here</p>
            </div>
          )}

          {panel.kind === "loading" && (
            <p className="status-loading">Processing payment and executing task…</p>
          )}

          {panel.kind === "error" && (
            <ResultDisplay loading={false} error={panel.message} result={null} />
          )}

          {panel.kind === "report" && (
            <ReportDisplay
              data={panel.data}
              onClose={() => setPanel({ kind: "empty" })}
            />
          )}

          {panel.kind === "tool" && (
            <ResultDisplay loading={false} error={null} result={panel.data} />
          )}
        </div>
      </div>
    </div>
  );
}
