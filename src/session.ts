import type { Phase } from "./lib/midnight";

export type Busy = Phase | "reading" | null;

export const phaseText: Record<Exclude<Busy, null>, string> = {
  reading: "Reading the election from the Preview indexer…",
  preparing: "Checking the election on Preview…",
  proving: "Generating the proof on your local proof server…",
  approving: "Approve the transaction in your wallet.",
  confirming: "Waiting for the indexer to confirm the block…",
};
