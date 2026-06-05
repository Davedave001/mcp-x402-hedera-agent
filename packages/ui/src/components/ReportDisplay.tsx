interface ReportData {
  accountId: string;
  generatedAt: string;
  onChainData: unknown;
  report: string;
}

interface Props {
  data: ReportData;
}

export function ReportDisplay({ data }: Props) {
  const generated = new Date(data.generatedAt).toLocaleString();

  return (
    <div className="report-card">
      <div className="report-card-header">
        <div>
          <span className="report-badge">AI Report</span>
          <span className="report-account">{data.accountId}</span>
        </div>
        <span className="report-timestamp">{generated}</span>
      </div>
      <div className="report-body">
        {data.report.split("\n").map((line, i) =>
          line.trim() === "" ? (
            <br key={i} />
          ) : (
            <p key={i}>{line}</p>
          )
        )}
      </div>
      <details className="report-raw">
        <summary>Raw on-chain data</summary>
        <pre>{JSON.stringify(data.onChainData, null, 2)}</pre>
      </details>
    </div>
  );
}
