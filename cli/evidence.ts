import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { circuits } from "./contract";
import { paths, type NetworkName } from "./config";

export interface RecordedTx {
  step: string;
  circuit: string;
  txId: string;
  txHash?: string;
  blockHeight: number;
  status: string;
}

export interface Evidence {
  schema: "nightvote-deployment/v1";
  network: NetworkName;
  contractAddress: string;
  electionId: string;
  organizerCommitment: string;
  deployedAt: string;
  toolchain: Record<string, string>;
  verifierKeySha256: Record<string, string>;
  proposal: { label: string; id: string };
  transactions: RecordedTx[];
  rejectedLocally: { step: string; reason: string }[];
  expected: {
    registeredVoters: number;
    yes: number;
    no: number;
    nullifiers: number;
  };
}

export const evidencePath = (network: NetworkName) =>
  path.join(paths.deployments, `${network}.json`);

export async function verifierKeyHashes() {
  const out: Record<string, string> = {};
  for (const circuit of circuits) {
    const key = await readFile(
      path.join(paths.zkConfig, "keys", `${circuit}.verifier`),
    );
    out[circuit] = createHash("sha256").update(key).digest("hex");
  }
  return out;
}
