import { describe, expect, it } from "vitest";
import {
  MAX_PROPOSAL_BYTES,
  decodeProposal,
  encodeProposal,
  toHex,
} from "../src/lib/bytes";
import { parseFile, assertSameElection } from "../src/lib/files";
import { localProver, createVoterKey } from "../src/lib/midnight";
import { createRehearsal, REHEARSAL_PROPOSAL } from "../src/lib/rehearsal";
import { Phase } from "../src/lib/election";
import { safeError } from "../src/lib/errors";
import { pureCircuits } from "../contract/managed/voting/contract/index.js";

const address = "ab".repeat(32);
const electionId = "cd".repeat(32);

describe("proposal text on-chain", () => {
  it("round-trips UTF-8 text through the 32-byte proposal ID", () => {
    for (const text of ["Move to Thursdays?", "Bütçe onaylansın mı?"])
      expect(decodeProposal(encodeProposal(text))).toBe(text);
  });
  it("rejects empty and oversized proposals", () => {
    expect(() => encodeProposal("  ")).toThrow();
    expect(() => encodeProposal("x".repeat(MAX_PROPOSAL_BYTES + 1))).toThrow("32 bytes");
  });
});

describe("voter keys and organizer files", () => {
  it("creates a voter key whose commitment matches the contract's", () => {
    const { key, commitment } = createVoterKey(address, electionId);
    const secret = Uint8Array.from(Buffer.from(key.secret, "hex"));
    const expected = pureCircuits.voterCommitment(Uint8Array.from(Buffer.from(electionId, "hex")), secret);
    expect(commitment).toBe(toHex(expected));
    expect(parseFile(JSON.stringify(key))).toEqual(key);
  });
  it("rejects files for another network, malformed secrets and unknown kinds", () => {
    const { key } = createVoterKey(address, electionId);
    expect(() => parseFile(JSON.stringify({ ...key, network: "preprod" }))).toThrow("different Midnight network");
    expect(() => parseFile(JSON.stringify({ ...key, secret: "zz" }))).toThrow("damaged");
    expect(() => parseFile(JSON.stringify({ ...key, kind: "other" }))).toThrow("not a NightVote file");
    expect(() => parseFile("not json")).toThrow("not a NightVote file");
    expect(() => parseFile("x".repeat(20000))).toThrow("too large");
  });
  it("detects a file for a different election", () => {
    expect(() => assertSameElection({ electionId }, new Uint8Array(32).fill(1))).toThrow("different election");
  });
});

describe("proof server boundary", () => {
  it("accepts only a local proof server", () => {
    expect(localProver("http://localhost:6300")).toBe("http://localhost:6300/");
    expect(localProver("http://127.0.0.1:6300")).toBe("http://127.0.0.1:6300/");
    expect(() => localProver("https://prover.example.com")).toThrow("local proof server");
    expect(() => localProver(undefined)).toThrow("local proof server");
  });
});

describe("rehearsal runs the compiled contract", () => {
  it("counts one ballot and rejects the second with the circuit's error", () => {
    const r = createRehearsal();
    const before = r.read();
    expect(before.phase).toBe(Phase.voting);
    expect(before.active?.text).toBe(REHEARSAL_PROPOSAL);
    const receipt = r.vote(before.active!.id, false);
    expect(receipt.txId).toBe("local");
    expect(r.read().active?.no).toBe(before.active!.no + 1);
    let message = "";
    try {
      r.vote(before.active!.id, true);
    } catch (error) {
      message = safeError(error);
    }
    expect(message).toMatch(/already voted/);
    expect(r.read().ballots).toBe(before.ballots + 1);
  });
});
