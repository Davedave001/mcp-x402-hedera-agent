interface Props {
  loading: boolean;
  error: string | null;
  result: unknown;
}

export function ResultDisplay({ loading, error, result }: Props) {
  if (loading) {
    return <p className="status-loading">Processing payment and executing task…</p>;
  }
  if (error) {
    return <p className="status-error">Error: {error}</p>;
  }
  if (result !== null && result !== undefined) {
    return (
      <pre className="result-box">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  }
  return null;
}
