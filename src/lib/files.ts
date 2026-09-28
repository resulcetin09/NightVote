import { fromHex } from "./bytes";

export const NETWORK = "preview";
const MAX_FILE_BYTES = 16 * 1024;
const HEX32 = /^[0-9a-f]{64}$/i;
const ADDRESS = /^[0-9a-f]{64,80}$/i;

/** Held by the organizer. Authorizes roll and proposal management. */
export interface OrganizerFile {
  kind: "nightvote-organizer";
  version: 1;
  network: typeof NETWORK;
  contractAddress: string;
  electionId: string;
  secret: string;
  name: string;
}

/** Held by one voter. Generated on the voter's device; only its commitment is shared. */
export interface VoterKey {
  kind: "nightvote-voter";
  version: 1;
  network: typeof NETWORK;
  contractAddress: string;
  electionId: string;
  secret: string;
}

export interface RecordedTx {
  step: string;
  circuit: string;
  txId: string;
  blockHeight: number;
  status: string;
}

export function isAddress(value: string) {
  return ADDRESS.test(value.trim());
}

function text(value: unknown, field: string, max = 80): string {
  if (typeof value !== "string" || value.length === 0 || value.length > max)
    throw new Error(`The file has an invalid ${field}.`);
  return value;
}

function common(doc: Record<string, unknown>) {
  if (doc.version !== 1) throw new Error("This file version is not supported.");
  if (doc.network !== NETWORK)
    throw new Error("This file belongs to a different Midnight network.");
  const contractAddress = text(doc.contractAddress, "contract address");
  if (!ADDRESS.test(contractAddress))
    throw new Error("The file has an invalid contract address.");
  const electionId = text(doc.electionId, "election ID");
  const secret = text(doc.secret, "secret");
  if (!HEX32.test(electionId) || !HEX32.test(secret))
    throw new Error("The file is damaged. Use the original download.");
  return { contractAddress: contractAddress.toLowerCase(), electionId, secret };
}

export function parseFile(raw: string): OrganizerFile | VoterKey {
  if (raw.length > MAX_FILE_BYTES) throw new Error("This file is too large.");
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch {
    throw new Error("This is not a NightVote file.");
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc))
    throw new Error("This is not a NightVote file.");
  const record = doc as Record<string, unknown>;
  if (record.kind === "nightvote-organizer")
    return {
      kind: "nightvote-organizer",
      version: 1,
      network: NETWORK,
      ...common(record),
      name: text(record.name, "election name"),
    };
  if (record.kind === "nightvote-voter")
    return { kind: "nightvote-voter", version: 1, network: NETWORK, ...common(record) };
  throw new Error("This is not a NightVote file.");
}

/** Ensures a file matches the election the indexer returned. */
export function assertSameElection(
  file: { electionId: string },
  onChainElectionId: Uint8Array,
) {
  const expected = fromHex(file.electionId, 32);
  if (!expected.every((b, i) => b === onChainElectionId[i]))
    throw new Error("This file belongs to a different election.");
}

export function download(name: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error("This file is too large.");
  return file.text();
}
