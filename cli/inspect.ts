// Inspects any NightVote contract on the public indexer — for example one
// deployed from the NightVote app with Lace — and optionally records what it
// observed in deployments/<network>.json so CI can re-check it.
//
//   npm run inspect:preview -- <contract address> [--save]
import { mkdir, writeFile } from "node:fs/promises";
import { verifierKeysEqual } from "@midnight-ntwrk/midnight-js-contracts";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { WebSocket } from "ws";
import { Phase, ledger } from "../contract/managed/voting/contract/index.js";
import { networkConfig, paths, toolchain, type NetworkName } from "./config";
import { circuits, type VotingCircuit } from "./contract";
import { toHex } from "./bytes";
import { evidencePath, verifierKeyHashes } from "./evidence";
import { latestAction, type ObservedAction } from "./indexer";

(globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;

export interface ObservedEvidence {
  schema: "nightvote-observed/v1";
  network: NetworkName;
  contractAddress: string;
  electionId: string;
  organizerCommitment: string;
  observedAt: string;
  toolchain: Record<string, string>;
  verifierKeySha256: Record<string, string>;
  action: ObservedAction;
}

const decode = (bytes: Uint8Array) => {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return new TextDecoder().decode(bytes.slice(0, end));
};

async function main() {
  const address = process.argv.slice(2).find((a) => !a.startsWith("--"))?.toLowerCase();
  const save = process.argv.includes("--save");
  if (!address || !/^[0-9a-f]{64,80}$/.test(address))
    throw new Error("Usage: npm run inspect:preview -- <contract address> [--save]");
  const network = (process.env.MIDNIGHT_NETWORK ?? "preview") as NetworkName;
  const config = networkConfig(network);
  let failures = 0;
  const check = (label: string, ok: boolean, detail = "") => {
    if (!ok) failures++;
    console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  };

  console.log(`NightVote contract ${address}`);
  console.log(`Network: Midnight ${network} (indexer ${config.indexer})\n`);
  const state = await indexerPublicDataProvider(config.indexer, config.indexerWS).queryContractState(address);
  check("contract exists on the public indexer", state !== null);
  if (!state) process.exit(1);

  const local = await new NodeZkConfigProvider<VotingCircuit>(paths.zkConfig).getVerifierKeys([...circuits]);
  for (const [circuit, key] of local) {
    const onChain = state.operation(circuit)?.verifierKey;
    check(`verifier key for ${circuit} matches contract/voting.compact`, !!onChain && verifierKeysEqual(key, onChain));
  }

  const action = await latestAction(config.indexer, address);
  if (action)
    check(
      `latest action: ${action.kind}`,
      action.status === "SUCCESS",
      `tx ${action.txHash}, block ${action.blockHeight}, ${action.blockTime}, ${action.status}`,
    );

  const value = ledger(state.data);
  console.log("\nPublic state");
  console.log(`  election ID        ${toHex(value.electionId)}`);
  console.log(`  organizer          ${toHex(value.organizer)}`);
  console.log(`  phase              ${Phase[value.phase]}`);
  console.log(`  registered voters  ${value.registered.size()}`);
  console.log(`  ballots cast       ${value.nullifiers.size()}`);
  for (const id of value.proposals)
    console.log(
      `  proposal "${decode(id)}"  yes ${value.yesVotes.lookup(id).read()}  no ${value.noVotes.lookup(id).read()}`,
    );

  if (save && action && !failures) {
    const evidence: ObservedEvidence = {
      schema: "nightvote-observed/v1",
      network,
      contractAddress: address,
      electionId: toHex(value.electionId),
      organizerCommitment: toHex(value.organizer),
      observedAt: new Date().toISOString(),
      toolchain,
      verifierKeySha256: await verifierKeyHashes(),
      action,
    };
    await mkdir(paths.deployments, { recursive: true });
    await writeFile(evidencePath(network), `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`\nRecorded in ${evidencePath(network)}. Re-check any time: npm run verify:preview`);
  }
  console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(`Inspection failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
