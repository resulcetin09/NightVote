// Independently re-checks deployments/<network>.json against the public Midnight
// indexer. Needs no wallet, no secrets and no proof server — only the compiled
// contract (npm run compile) and network access.
import { readFile } from "node:fs/promises";
import { verifierKeysEqual } from "@midnight-ntwrk/midnight-js-contracts";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { WebSocket } from "ws";
import { Phase, ledger } from "../contract/managed/voting/contract/index.js";
import { networkConfig, paths, type NetworkName } from "./config";
import { circuits, type VotingCircuit } from "./contract";
import { fromHex, toHex } from "./bytes";
import { evidencePath, verifierKeyHashes, type Evidence } from "./evidence";
import { actionAtBlock } from "./indexer";
import type { ObservedEvidence } from "./inspect";

(globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

const withTimeout = <T>(p: Promise<T>, ms: number) =>
  Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timed out")), ms),
    ),
  ]);

async function main() {
  const network = (process.env.MIDNIGHT_NETWORK ?? "preview") as NetworkName;
  const config = networkConfig(network);
  const evidence: Evidence | ObservedEvidence = JSON.parse(
    await readFile(evidencePath(network), "utf8"),
  );
  console.log(`Verifying ${evidence.contractAddress} on ${network}`);
  check("evidence targets this network", evidence.network === network);

  const indexer = indexerPublicDataProvider(config.indexer, config.indexerWS);
  const state = await indexer.queryContractState(evidence.contractAddress);
  check("contract exists on the public indexer", state !== null);
  if (!state) return;

  const local = await new NodeZkConfigProvider<VotingCircuit>(
    paths.zkConfig,
  ).getVerifierKeys([...circuits]);
  for (const [circuit, key] of local) {
    const onChain = state.operation(circuit)?.verifierKey;
    check(
      `on-chain verifier key for ${circuit} matches this source`,
      !!onChain && verifierKeysEqual(key, onChain),
    );
  }
  const hashes = await verifierKeyHashes();
  check(
    "recorded verifier key hashes match this build",
    circuits.every((c) => hashes[c] === evidence.verifierKeySha256[c]),
  );

  const value = ledger(state.data);
  if (evidence.schema === "nightvote-observed/v1") {
    // Recorded with `npm run inspect:preview -- <address> --save`, e.g. after
    // deploying from the NightVote app with Lace.
    check("election ID matches", toHex(value.electionId) === evidence.electionId);
    check("organizer commitment matches", toHex(value.organizer) === evidence.organizerCommitment);
    const action = await actionAtBlock(config.indexer, evidence.contractAddress, evidence.action.blockHeight);
    check(
      `${evidence.action.kind} transaction is in block ${evidence.action.blockHeight}`,
      action?.txHash === evidence.action.txHash && action.status === "SUCCESS",
      action ? `tx ${action.txHash}, ${action.status}` : "not found",
    );
    return;
  }
  const proposal = fromHex(evidence.proposal.id);
  check(
    "election ID matches",
    toHex(value.electionId) === evidence.electionId,
  );
  check(
    "organizer commitment matches",
    toHex(value.organizer) === evidence.organizerCommitment,
  );
  check(
    "electoral roll is sealed",
    value.phase !== Phase.registration,
    Phase[value.phase],
  );
  check(
    "registered voter count",
    Number(value.registered.size()) === evidence.expected.registeredVoters,
    String(value.registered.size()),
  );
  check(
    "proposal was opened on-chain",
    value.proposals.member(proposal),
  );
  // Only the organizer can reopen voting, and a used proposal ID can never be
  // reopened, so this tally is final once the proposal was closed.
  const yes = value.yesVotes.member(proposal)
    ? Number(value.yesVotes.lookup(proposal).read())
    : -1;
  const no = value.noVotes.member(proposal)
    ? Number(value.noVotes.lookup(proposal).read())
    : -1;
  check("yes tally", yes === evidence.expected.yes, String(yes));
  check("no tally", no === evidence.expected.no, String(no));
  check(
    "nullifiers ≥ ballots recorded",
    Number(value.nullifiers.size()) >= evidence.expected.nullifiers,
    String(value.nullifiers.size()),
  );

  for (const tx of evidence.transactions) {
    try {
      const found = await withTimeout(indexer.watchForTxData(tx.txId), 60_000);
      check(
        `${tx.step}: finalized`,
        found.status === "SucceedEntirely" &&
          found.blockHeight === tx.blockHeight,
        `block ${found.blockHeight}, ${found.status}`,
      );
    } catch (error) {
      check(`${tx.step}: finalized`, false, String(error));
    }
  }
}

main().then(
  () => {
    console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
    process.exit(failures ? 1 : 0);
  },
  (error) => {
    console.error(`Verification failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  },
);
