import { useState } from "react";
import { Icon } from "@iconify/react";
import { useWallet } from "./hooks/useWallet";
import { useAgentTask } from "./hooks/useAgentTask";
import { useApiKey } from "./hooks/useApiKey";
import { useChat } from "./hooks/useChat";
import { WalletConnect } from "./components/WalletConnect";
import { TaskSelector } from "./components/TaskSelector";
import { ResultDisplay } from "./components/ResultDisplay";
import { ReportDisplay } from "./components/ReportDisplay";
import { ChatPanel } from "./components/ChatPanel";
import { ApiKeyModal } from "./components/ApiKeyModal";
import type { WalletReport } from "./types";

type Panel =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "report"; data: WalletReport }
  | { kind: "tool"; data: unknown };

type Tab = "tools" | "chat";

// Default Hedera account for chat context (can be changed)
const DEFAULT_HEDERA_ACCOUNT = "0.0.6188111";

export default function App() {
  const { address, provider, connect, disconnect } = useWallet();
  const { runTask, runReport } = useAgentTask(provider);
  const { apiKey, saveKey, clearKey, hasKey } = useApiKey();
  const [reportAccountId, setReportAccountId] = useState(DEFAULT_HEDERA_ACCOUNT);
  const [panel, setPanel] = useState<Panel>({ kind: "empty" });
  const [activeTab, setActiveTab] = useState<Tab>("tools");
  const [showSettings, setShowSettings] = useState(false);

  const chat = useChat(DEFAULT_HEDERA_ACCOUNT, apiKey, provider);

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

  const handleRun = async (taskId: string, params: Record<string, unknown>) => {
    setPanel({ kind: "loading" });
    try {
      const data = await runTask(taskId, params);
      if (data) {
        setPanel({ kind: "tool", data });
      } else {
        setPanel({ kind: "error", message: "Task returned no result" });
      }
    } catch (e) {
      setPanel({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <div className="app-layout">
      {/* Top bar */}
      <div className="top-bar">
        <button
          className="btn-settings"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <Icon icon="mdi:tune-variant" width={16} />
          {hasKey ? <span className="settings-key-dot" /> : null}
        </button>
        <WalletConnect address={address} onConnect={connect} onDisconnect={disconnect} />
      </div>

      <div className="main-area">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="app-brand">
            <div className="brand-icon"><Icon icon="simple-icons:hedera" width={20} /></div>
            <div className="brand-text">
              <h1>Hedera x402 Agent</h1>
              <p>Pay-per-use AI agent powered by Hedera + x402</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === "tools" ? "tab-btn-active" : ""}`}
              onClick={() => setActiveTab("tools")}
            >
              <Icon icon="mdi:tools" width={14} /> Agent Tools
            </button>
            <button
              className={`tab-btn ${activeTab === "chat" ? "tab-btn-active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              <Icon icon="mdi:chat-outline" width={14} /> AI Chat
            </button>
          </div>

          {activeTab === "tools" && (
            <>
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
                  <span className="account-icon"><Icon icon="mdi:account-outline" width={16} /></span>
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
                  <Icon icon="mdi:sparkles" width={16} /> Generate Report
                </button>
              </div>

              <TaskSelector
                disabled={!address || panel.kind === "loading"}
                onRun={handleRun}
              />
            </>
          )}

          {activeTab === "chat" && (
            <div className="chat-sidebar-info">
              <div className="chat-sidebar-row">
                <span className="chat-sidebar-icon"><Icon icon="mdi:robot-outline" width={20} /></span>
                <div>
                  <div className="chat-sidebar-label">Claude-powered</div>
                  <div className="chat-sidebar-hint">Ask about balances, transactions, and Hedera operations</div>
                </div>
              </div>
              {hasKey ? (
                <div className="chat-key-status chat-key-status-ok">
                  <Icon icon="mdi:check-circle-outline" width={14} /> Your API key is active — chat is free
                </div>
              ) : (
                <div className="chat-key-status chat-key-status-pay">
                  <Icon icon="mdi:lightning-bolt" width={14} /> x402 micropayment per message
                  <button className="chat-key-status-link" onClick={() => setShowSettings(true)}>
                    Add your key to chat free <Icon icon="mdi:arrow-right" width={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── Content panel ── */}
        <div className={`content-panel ${activeTab === "chat" ? "content-panel-chat" : ""}`}>
          {activeTab === "chat" ? (
            <ChatPanel
              messages={chat.messages}
              loading={chat.loading}
              error={chat.error}
              onSend={chat.send}
              onClear={chat.clear}
              hasApiKey={hasKey}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <>
              {panel.kind === "empty" && (
                <div className="content-empty">
                  <div className="content-empty-icon"><Icon icon="mdi:hexagon-outline" width={48} /></div>
                  <p>Connect your wallet and generate a report</p>
                  <p>or run an agent tool to see results here</p>
                </div>
              )}

              {panel.kind === "loading" && (
                <div className="task-result-card task-result-loading">
                  <div className="task-result-spinner" />
                  <p>Processing payment and executing task…</p>
                </div>
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
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <ApiKeyModal
          currentKey={apiKey}
          onSave={saveKey}
          onClear={clearKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
