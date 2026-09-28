import type { Witnesses } from "../../contract/managed/voting/contract/index.js";

// Private state never leaves the process that generates the proof. The organizer
// holds `organizerSecret`; each voter holds only their own `voterSecret`.
export type PrivateState = {
  organizerSecret?: Uint8Array;
  voterSecret?: Uint8Array;
};

export const witnesses: Witnesses<PrivateState> = {
  organizerSecret: ({ privateState }) => {
    if (!privateState.organizerSecret)
      throw new Error("Import your organizer file first.");
    return [privateState, privateState.organizerSecret];
  },
  voterSecret: ({ privateState }) => {
    if (!privateState.voterSecret)
      throw new Error("Import your voter key first.");
    return [privateState, privateState.voterSecret];
  },
  membershipPath: ({ ledger, privateState }, leaf) => {
    const path = ledger.voters.findPathForLeaf(leaf);
    if (!path) throw new Error("This voter key is not registered in this election.");
    return [privateState, path];
  },
};
