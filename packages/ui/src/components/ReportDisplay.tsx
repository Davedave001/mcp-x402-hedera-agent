import type { WalletReport } from "../types";

interface Props {
  data: WalletReport;
  onClose: () => void;
}

export function ReportDisplay({ data, onClose }: Props) {
  const { analysis } = data;
  const generated = new Date(data.generatedAt).toLocaleString();

  return (
    <div className="report-card">
      {/* top bar */}
      <div className="report-card-topbar">
        <span className="report-card-topbar-icon">📄</span>
        <span className="report-card-label">AI Report</span>
        <span className="report-card-sep">|</span>
        <span className="report-card-account">{data.accountId}</span>
        <span className="report-card-sep">|</span>
        <span className="report-card-date">📅 {generated}</span>
        <button className="report-card-close" onClick={onClose}>✕</button>
      </div>

      <div className="report-card-body">
        {/* heading + meta */}
        <div>
          <div className="report-main-heading"># Wallet Intelligence Report</div>
          <div className="report-meta">
            <span><strong>Account:</strong> {data.accountId}</span>
            <span>|</span>
            <span><strong>Network:</strong> Hedera Testnet</span>
            <span>|</span>
            <span><strong>Generated:</strong> {data.generatedAt}</span>
          </div>
        </div>

        {/* account health */}
        <div>
          <div className="report-section-title">
            <span className="section-icon">🏛</span>
            Account Health
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span>Status:</span>
            <span className={`health-status ${analysis.accountHealth.status}`}>
              {analysis.accountHealth.status}
            </span>
          </div>
          <p className="report-text">{analysis.accountHealth.description}</p>
        </div>

        {/* token portfolio */}
        <div>
          <div className="report-section-title">
            <span className="section-icon">📊</span>
            Token Portfolio Summary
          </div>
          {data.tokens.length > 0 ? (
            <table className="token-table">
              <thead>
                <tr>
                  <th>Token ID</th>
                  <th>Balance</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {data.tokens.map((token) => (
                  <tr key={token.id}>
                    <td>{token.id}</td>
                    <td>{token.balance.toLocaleString()}</td>
                    <td>
                      <span className={`token-badge ${token.balance <= 10 ? "nft" : "hts"}`}>
                        {token.balance <= 10 ? "NFT" : "HTS Token"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="report-text">No token holdings detected.</p>
          )}
          {analysis.tokenPortfolio.summary && (
            <p className="report-text" style={{ marginTop: "0.5rem" }}>
              {analysis.tokenPortfolio.summary}
            </p>
          )}
        </div>

        {/* activity assessment */}
        {analysis.activityAssessment && (
          <div>
            <div className="report-section-title">
              <span className="section-icon">⚡</span>
              Activity Assessment
            </div>
            <p className="report-text">{analysis.activityAssessment}</p>
          </div>
        )}

        {/* actionable insights */}
        {analysis.insights.length > 0 && (
          <div>
            <div className="report-section-title">
              <span className="section-icon">💡</span>
              Actionable Insights
            </div>
            <ul className="insights-list">
              {analysis.insights.map((insight, i) => (
                <li key={i} className="insight-item">
                  <span className="insight-number">{i + 1}</span>
                  <span className="insight-text">
                    <strong>{insight.title}</strong> — {insight.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* disclaimer + close */}
        <div className="report-disclaimer">
          <span>{analysis.disclaimer}</span>
          <button className="btn-close-report" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
