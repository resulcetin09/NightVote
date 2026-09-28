import { useEffect, useState, type FormEvent } from "react";
import type { AppSession } from "../App";
import { Lifecycle, PenCross, Tally } from "./Marks";
import { Status, TxLine } from "./Status";
import { Phase, type ElectionState, type ProposalResult } from "../lib/election";
import { download, isAddress, parseFile, readFile, type VoterKey } from "../lib/files";
import { safeError } from "../lib/errors";
import { shortId } from "../lib/bytes";
import type { Receipt } from "../lib/midnight";
import type { Rehearsal } from "../lib/rehearsal";

const addressFromUrl = () =>
  new URLSearchParams(window.location.search).get("election")?.toLowerCase() ?? "";

export function VoteView({ session }: { session: AppSession }) {
  const [address, setAddress] = useState(addressFromUrl);
  const [loaded, setLoaded] = useState("");
  const [election, setElection] = useState<ElectionState | null>(null);
  const [readAt, setReadAt] = useState<Date | null>(null);
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [key, setKey] = useState<VoterKey | null>(null);
  const [error, setError] = useState("");

  const read = async (target: string) => {
    setError("");
    session.setBusy("reading");
    try {
      const reader = session.client ?? (await import("../lib/midnight")).publicReader();
      const state = await reader.read(target);
      setElection(state);
      setLoaded(target);
      setReadAt(new Date());
      setRehearsal(null);
      const url = new URL(window.location.href);
      url.searchParams.set("election", target);
      window.history.replaceState(null, "", url);
    } catch (e) {
      setError(safeError(e));
    } finally {
      session.setBusy(null);
    }
  };

  useEffect(() => {
    if (isAddress(address)) void read(address);
    // Only on first render: a shared link opens its election directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (event: FormEvent) => {
    event.preventDefault();
    const target = address.trim().toLowerCase();
    if (!isAddress(target)) {
      setError("Paste the contract address the organizer shared. It is 64 hexadecimal characters.");
      return;
    }
    void read(target);
  };

  const rehearse = async () => {
    setError("");
    const { createRehearsal } = await import("../lib/rehearsal");
    const next = createRehearsal();
    setRehearsal(next);
    setElection(next.read());
    setLoaded("");
    setReadAt(null);
  };

  if (!election)
    return (
      <section className="sheet intro">
        <h1>One member, one vote. No names attached.</h1>
        <p className="lede">
          NightVote lets a club or community vote on a proposal. Every ballot is checked against the member roll and
          counted once. Nobody, including the organizer, sees which member cast which ballot.
        </p>
        <form className="open-form" onSubmit={open}>
          <label htmlFor="address">Election address</label>
          <div className="field-row">
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contract address from your organizer"
              spellCheck={false}
              autoComplete="off"
            />
            <button className="button primary" disabled={!!session.busy}>
              Open election
            </button>
          </div>
        </form>
        <Status busy={session.busy} error={error} />
        <div className="rehearse">
          <p>No election yet? Rehearse a ballot in your browser. It runs the real contract logic, but generates no proof and sends nothing to Preview.</p>
          <button className="button" onClick={rehearse}>
            Rehearse a ballot
          </button>
        </div>
      </section>
    );

  return (
    <section className="sheet">
      <div className="sheet-head">
        <div>
          <h1>{rehearsal ? "Rehearsal election" : `Election ${shortId(loaded)}`}</h1>
          <p className="meta">
            {election.registered} members on the roll. {election.ballots} ballots cast in total.
            {readAt && ` Read from Preview at ${readAt.toLocaleTimeString()}.`}
          </p>
        </div>
        <div className="sheet-actions">
          {!rehearsal && (
            <button className="button quiet" onClick={() => read(loaded)} disabled={!!session.busy}>
              Refresh
            </button>
          )}
          <button
            className="button quiet"
            onClick={() => {
              setElection(null);
              setRehearsal(null);
            }}
          >
            Close
          </button>
        </div>
      </div>
      <Lifecycle phase={election.phase} />
      {rehearsal && (
        <p className="notice">
          This is a local rehearsal with five simulated members. Two have voted already. You hold the fifth key.
        </p>
      )}

      {election.active ? (
        <Ballot
          key={election.active.id}
          proposal={election.active}
          session={session}
          rehearsal={rehearsal}
          voterKey={key}
          onVoted={(state) => (state ? setElection(state) : read(loaded))}
        />
      ) : (
        <p className="empty">
          {election.phase === Phase.registration
            ? "The organizer is still registering members. Voting opens after the roll is sealed and a proposal is published."
            : "No proposal is open right now. Refresh when the organizer opens the next one."}
        </p>
      )}

      {!rehearsal && (
        <VoterKeyPanel
          election={election}
          address={loaded}
          voterKey={key}
          onKey={setKey}
        />
      )}

      <Results proposals={election.proposals} />
    </section>
  );
}

function Ballot({
  proposal,
  session,
  rehearsal,
  voterKey,
  onVoted,
}: {
  proposal: ProposalResult;
  session: AppSession;
  rehearsal: Rehearsal | null;
  voterKey: VoterKey | null;
  onVoted: (state?: ElectionState) => void;
}) {
  const [choice, setChoice] = useState<boolean | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");

  const cast = async () => {
    if (choice === null) return;
    setError("");
    try {
      if (rehearsal) {
        setReceipt(rehearsal.vote(proposal.id, choice));
        onVoted(rehearsal.read());
        return;
      }
      if (!voterKey) {
        setError("Import your voter key below before casting a ballot.");
        return;
      }
      const client = session.client ?? (await session.connect());
      if (!client) return;
      setReceipt(await client.castVote(voterKey, proposal.id, choice));
      onVoted();
    } catch (e) {
      setError(safeError(e));
    } finally {
      session.setBusy(null);
    }
  };

  return (
    <div className="ballot">
      <h2 className="proposal">{proposal.text}</h2>
      <fieldset disabled={!!session.busy}>
        <legend>Mark one box</legend>
        {[
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ].map((option) => (
          <label key={option.label} className={`box${choice === option.value ? " chosen" : ""}`}>
            <input
              type="radio"
              name="choice"
              checked={choice === option.value}
              onChange={() => setChoice(option.value)}
            />
            <span className="square">
              <PenCross drawn={choice === option.value} />
            </span>
            <span className="box-label">{option.label}</span>
          </label>
        ))}
      </fieldset>
      <button className="button primary cast" onClick={cast} disabled={choice === null || !!session.busy}>
        Cast ballot
      </button>
      <Status busy={session.busy} error={error} />
      {receipt && (
        <div className="receipt" role="status">
          <h3>Ballot cast</h3>
          <p>
            Your ballot was counted. Its public nullifier is <code>{receipt.nullifier}</code>. It proves this key voted
            on this proposal without saying which member holds it. A second ballot with the same key is rejected.
          </p>
          <TxLine txId={receipt.txId} block={receipt.block} />
        </div>
      )}
    </div>
  );
}

function VoterKeyPanel({
  election,
  address,
  voterKey,
  onKey,
}: {
  election: ElectionState;
  address: string;
  voterKey: VoterKey | null;
  onKey: (key: VoterKey) => void;
}) {
  const [commitment, setCommitment] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const create = async () => {
    const { createVoterKey } = await import("../lib/midnight");
    const made = createVoterKey(address, election.electionId);
    download(`election-${address.slice(0, 8)}.voter-key.json`, made.key);
    onKey(made.key);
    setCommitment(made.commitment);
  };

  const importKey = async (file: File | undefined) => {
    setError("");
    if (!file) return;
    try {
      const parsed = parseFile(await readFile(file));
      if (parsed.kind !== "nightvote-voter") throw new Error("This is an organizer file. Import your voter key instead.");
      if (parsed.contractAddress !== address || parsed.electionId !== election.electionId)
        throw new Error("This voter key belongs to a different election.");
      onKey(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "This file could not be read.");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(commitment);
    setCopied(true);
  };

  return (
    <div className="key-panel">
      <h2>Your voter key</h2>
      {voterKey ? (
        <p>Loaded for this session. It stays in this tab’s memory and is never uploaded.</p>
      ) : (
        <p>You need the key file you created when you joined this election. Only you have it.</p>
      )}
      <div className="key-actions">
        <label className="button file">
          Import voter key
          <input type="file" accept="application/json,.json" onChange={(e) => importKey(e.target.files?.[0])} />
        </label>
        {election.phase === Phase.registration && !voterKey && (
          <button className="button" onClick={create}>
            Create a voter key
          </button>
        )}
      </div>
      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
      {commitment && (
        <div className="handoff">
          <p>
            Your key was downloaded. Keep it private. Send the organizer this commitment. It lets them add you to the
            roll without learning your key, so they cannot tell which ballot is yours.
          </p>
          <code className="commitment">{commitment}</code>
          <button className="button quiet" onClick={copy}>
            {copied ? "Copied" : "Copy commitment"}
          </button>
        </div>
      )}
    </div>
  );
}

function Results({ proposals }: { proposals: ProposalResult[] }) {
  if (proposals.length === 0) return null;
  const ordered = [...proposals].sort((a, b) => Number(b.active) - Number(a.active));
  return (
    <div className="results">
      <h2>Count</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Proposal</th>
            <th scope="col">Yes</th>
            <th scope="col">No</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((p) => (
            <tr key={p.id}>
              <th scope="row">
                {p.text}
                <span className="state">{p.active ? "Voting open" : "Closed"}</span>
              </th>
              <td>
                <span className="count">{p.yes}</span>
                <Tally count={p.yes} label="yes votes" />
              </td>
              <td>
                <span className="count">{p.no}</span>
                <Tally count={p.no} label="no votes" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
