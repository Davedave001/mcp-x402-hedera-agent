import { Icon } from "@iconify/react";

interface Props {
  loading: boolean;
  error: string | null;
  result: unknown;
}

// Known result shapes
interface BalanceResult  { hbars: string; tokens?: Record<string, string> | null }
interface TxResult       { status: string; txId: string }
interface MintResult     { status: string; txId: string; serials: string[] }

function isBalanceResult(r: unknown): r is { result: BalanceResult } {
  return !!r && typeof r === "object" && "result" in r &&
    typeof (r as { result: unknown }).result === "object" &&
    "hbars" in (r as { result: BalanceResult }).result;
}
function isTxResult(r: unknown): r is { result: TxResult } {
  return !!r && typeof r === "object" && "result" in r &&
    typeof (r as { result: unknown }).result === "object" &&
    "txId" in (r as { result: TxResult }).result;
}
function isMintResult(r: unknown): r is { result: MintResult } {
  return !!r && typeof r === "object" && "result" in r &&
    typeof (r as { result: unknown }).result === "object" &&
    "serials" in (r as { result: MintResult }).result;
}

export function ResultDisplay({ loading, error, result }: Props) {
  if (loading) {
    return (
      <div className="task-result-card task-result-loading">
        <div className="task-result-spinner" />
        <p>Processing payment and executing task…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-result-card task-result-error">
        <div className="task-result-icon"><Icon icon="mdi:alert-circle-outline" width={20} /></div>
        <div>
          <div className="task-result-label">Task Failed</div>
          <div className="task-result-message">{error}</div>
        </div>
      </div>
    );
  }

  if (result === null || result === undefined) return null;

  // Balance
  if (isBalanceResult(result)) {
    const { hbars, tokens } = result.result;
    const tokenEntries = tokens ? Object.entries(tokens) : [];
    return (
      <div className="task-result-card task-result-success">
        <div className="task-result-icon task-result-icon-green"><Icon icon="mdi:wallet-outline" width={20} /></div>
        <div className="task-result-body">
          <div className="task-result-label">HBAR Balance</div>
          <div className="task-result-value">{hbars}</div>
          {tokenEntries.length > 0 && (
            <div className="task-result-tokens">
              <div className="task-result-sublabel">Token Holdings</div>
              {tokenEntries.map(([id, bal]) => (
                <div key={id} className="task-result-token-row">
                  <span className="task-token-id">{id}</span>
                  <span className="task-token-bal">{bal}</span>
                </div>
              ))}
            </div>
          )}
          {tokenEntries.length === 0 && (
            <div className="task-result-hint">No HTS tokens held</div>
          )}
        </div>
      </div>
    );
  }

  // NFT mint (check before generic tx because it has serials)
  if (isMintResult(result)) {
    const { status, txId, serials } = result.result;
    const ok = status === "SUCCESS";
    return (
      <div className={`task-result-card ${ok ? "task-result-success" : "task-result-error"}`}>
        <div className={`task-result-icon ${ok ? "task-result-icon-purple" : ""}`}><Icon icon="mdi:image-plus-outline" width={20} /></div>
        <div className="task-result-body">
          <div className="task-result-label">{ok ? "NFT Minted" : `Mint ${status}`}</div>
          {serials.length > 0 && (
            <div className="task-result-value">Serial #{serials.join(", #")}</div>
          )}
          <div className="task-result-txid">{txId}</div>
        </div>
      </div>
    );
  }

  // Generic tx (transfer, HCS)
  if (isTxResult(result)) {
    const { status, txId } = result.result;
    const ok = status === "SUCCESS";
    return (
      <div className={`task-result-card ${ok ? "task-result-success" : "task-result-error"}`}>
        <div className={`task-result-icon ${ok ? "task-result-icon-green" : ""}`}>
          <Icon icon={ok ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} width={20} />
        </div>
        <div className="task-result-body">
          <div className="task-result-label">{ok ? "Transaction Complete" : `Transaction ${status}`}</div>
          <div className="task-result-txid">{txId}</div>
        </div>
      </div>
    );
  }

  // Fallback — structured display (no raw JSON dump)
  return (
    <div className="task-result-card task-result-generic">
      <div className="task-result-icon"><Icon icon="mdi:information-outline" width={20} /></div>
      <div className="task-result-body">
        <div className="task-result-label">Result</div>
        <pre className="task-result-pre">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}
