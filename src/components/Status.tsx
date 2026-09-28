import { phaseText, type Busy } from "../session";

export function Status({ busy, error }: { busy: Busy; error: string }) {
  if (busy)
    return (
      <p className="status working" role="status">
        <span className="spinner" aria-hidden="true" />
        {phaseText[busy]}
      </p>
    );
  if (error)
    return (
      <p className="status error" role="alert">
        {error}
      </p>
    );
  return null;
}

export function TxLine({ txId, block }: { txId: string; block: number }) {
  if (txId === "local")
    return <p className="tx">Local rehearsal. No proof was generated and no transaction was sent.</p>;
  return (
    <p className="tx">
      Confirmed in block <strong>{block.toLocaleString()}</strong>. Transaction <code>{txId}</code>
    </p>
  );
}
