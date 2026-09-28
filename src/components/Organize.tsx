import { useState, type FormEvent } from "react";
import type { AppSession } from "../App";
import { Lifecycle } from "./Marks";
import { Status, TxLine } from "./Status";
import { Phase, type ElectionState } from "../lib/election";
import { download, parseFile, readFile, type OrganizerFile } from "../lib/files";
import { safeError } from "../lib/errors";
import { MAX_PROPOSAL_BYTES, proposalBytes, shortId } from "../lib/bytes";
import type { MidnightClient, Receipt } from "../lib/midnight";

const COMMITMENT = /^[0-9a-f]{64}$/i;

export function OrganizeView({ session }: { session: AppSession }) {
  const [file, setFile] = useState<OrganizerFile | null>(null);
  const [saved, setSaved] = useState(false);
  const [election, setElection] = useState<ElectionState | null>(null);
  const [name, setName] = useState("");
  const [commitment, setCommitment] = useState("");
  const [proposal, setProposal] = useState("");
  const [confirmSeal, setConfirmSeal] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  const run = async (label: string, action: (client: MidnightClient) => Promise<Receipt | void>) => {
    setError("");
    setDone("");
    setReceipt(null);
    try {
      const client = session.client ?? (await session.connect());
      if (!client) return;
      const result = await action(client);
      if (result) setReceipt(result);
      setDone(label);
    } catch (e) {
      setError(safeError(e));
    } finally {
      session.setBusy(null);
    }
  };

  const refresh = async (client: MidnightClient, target: OrganizerFile) => {
    session.setBusy("reading");
    setElection(await client.read(target.contractAddress));
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError("Name the election first. The name is only stored in your organizer file.");
    void run("Election created", async (client) => {
      const { file: created, receipt } = await client.deploy(name.trim());
      setFile(created);
      setSaved(false);
      await refresh(client, created);
      return receipt;
    });
  };

  const importFile = async (picked: File | undefined) => {
    setError("");
    if (!picked) return;
    try {
      const parsed = parseFile(await readFile(picked));
      if (parsed.kind !== "nightvote-organizer")
        throw new Error("This is a voter key. Import the organizer file instead.");
      setFile(parsed);
      setSaved(true);
      await run("Organizer file imported", (client) => refresh(client, parsed));
    } catch (e) {
      setError(e instanceof Error ? e.message : "This file could not be read.");
    }
  };

  const saveFile = () => {
    if (!file) return;
    download(`${file.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "election"}.organizer.json`, file);
    setSaved(true);
  };

  if (!file)
    return (
      <section className="sheet">
        <h1>Run an election</h1>
        <p className="lede">
          You deploy a contract for your group, add each member’s commitment to the roll, seal it, then put proposals
          to a vote one at a time. You manage the election. You cannot see who voted which way.
        </p>
        <ol className="steps">
          <li>Connect a Lace wallet on Preview with tDUST for fees, and set its proof server to your local one.</li>
          <li>Create the election and save the organizer file. Without it you cannot manage the election again.</li>
          <li>Share the election link. Each member creates their own voter key and sends you only its commitment.</li>
        </ol>
        <form className="open-form" onSubmit={create}>
          <label htmlFor="name">Election name</label>
          <div className="field-row">
            <input
              id="name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chess club, spring 2027"
            />
            <button className="button primary" disabled={!!session.busy}>
              Create election
            </button>
          </div>
        </form>
        <div className="key-actions">
          <label className="button file">
            Import organizer file
            <input type="file" accept="application/json,.json" onChange={(e) => importFile(e.target.files?.[0])} />
          </label>
        </div>
        <Status busy={session.busy} error={error} />
      </section>
    );

  const link = `${window.location.origin}${window.location.pathname}?election=${file.contractAddress}#vote`;
  const bytes = proposalBytes(proposal);

  return (
    <section className="sheet">
      <div className="sheet-head">
        <div>
          <h1>{file.name}</h1>
          <p className="meta">Contract {shortId(file.contractAddress)} on Preview.</p>
        </div>
        <div className="sheet-actions">
          <button
            className="button quiet"
            disabled={!!session.busy}
            onClick={() => run("Refreshed", (client) => refresh(client, file))}
          >
            Refresh
          </button>
        </div>
      </div>

      {!saved && (
        <div className="notice urgent" role="alert">
          <p>Save your organizer file now. It is the only way to manage this election, and it is not stored anywhere else.</p>
          <button className="button primary" onClick={saveFile}>
            Save organizer file
          </button>
        </div>
      )}

      {election && <Lifecycle phase={election.phase} />}

      <div className="share">
        <label htmlFor="link">Link for members</label>
        <input id="link" readOnly value={link} onFocus={(e) => e.target.select()} />
      </div>

      {election?.phase === Phase.registration && (
        <div className="task">
          <h2>Register members</h2>
          <p>{election.registered} on the roll. Paste one member’s commitment at a time. The roll holds up to 1,024 members.</p>
          <form
            className="field-row"
            onSubmit={(e) => {
              e.preventDefault();
              const value = commitment.trim().toLowerCase();
              if (!COMMITMENT.test(value)) return setError("A commitment is 64 hexadecimal characters.");
              void run("Member registered", async (client) => {
                const r = await client.registerVoter(file, value);
                setCommitment("");
                await refresh(client, file);
                return r;
              });
            }}
          >
            <input
              aria-label="Member commitment"
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              placeholder="Member commitment"
              spellCheck={false}
            />
            <button className="button primary" disabled={!!session.busy}>
              Register
            </button>
          </form>
          <div className="seal">
            <label className="check">
              <input type="checkbox" checked={confirmSeal} onChange={(e) => setConfirmSeal(e.target.checked)} />
              Every member is registered. Sealing is permanent.
            </label>
            <button
              className="button"
              disabled={!confirmSeal || !!session.busy}
              onClick={() =>
                run("Roll sealed", async (client) => {
                  const r = await client.closeRegistration(file);
                  await refresh(client, file);
                  return r;
                })
              }
            >
              Seal the roll
            </button>
          </div>
        </div>
      )}

      {election?.phase === Phase.idle && (
        <form
          className="task"
          onSubmit={(e) => {
            e.preventDefault();
            void run("Proposal opened", async (client) => {
              const r = await client.openProposal(file, proposal);
              setProposal("");
              await refresh(client, file);
              return r;
            });
          }}
        >
          <h2>Open a proposal</h2>
          <p>The proposal text is public and stored on-chain, so keep it short. Only one proposal is open at a time.</p>
          <div className="field-row">
            <input
              aria-label="Proposal"
              aria-describedby="bytes"
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Move meetings to Thursdays?"
            />
            <button className="button primary" disabled={!!session.busy || bytes === 0 || bytes > MAX_PROPOSAL_BYTES}>
              Open for voting
            </button>
          </div>
          <p id="bytes" className={`hint${bytes > MAX_PROPOSAL_BYTES ? " over" : ""}`}>
            {bytes} of {MAX_PROPOSAL_BYTES} bytes
          </p>
        </form>
      )}

      {election?.phase === Phase.voting && election.active && (
        <div className="task">
          <h2>{election.active.text}</h2>
          <p>
            Voting is open. {election.active.yes + election.active.no} of {election.registered} members have voted. Close
            it to freeze the count and open the next proposal.
          </p>
          <button
            className="button"
            disabled={!!session.busy}
            onClick={() =>
              run("Proposal closed", async (client) => {
                const r = await client.closeProposal(file);
                await refresh(client, file);
                return r;
              })
            }
          >
            Close voting
          </button>
        </div>
      )}

      <Status busy={session.busy} error={error} />
      {done && !session.busy && !error && (
        <div className="receipt" role="status">
          <h3>{done}</h3>
          {receipt && <TxLine txId={receipt.txId} block={receipt.block} />}
        </div>
      )}

      <p className="meta">
        Anyone can check this election’s counts: open the member link. Every number there is read from the contract on
        Preview.
      </p>
    </section>
  );
}
