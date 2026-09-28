import {
  createCircuitContext,
  createConstructorContext,
  type CircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
  pureCircuits,
} from "../../contract/managed/voting/contract/index.js";
import { witnesses, type PrivateState } from "../contract/witnesses";
import { encodeProposal, fromHex, randomSecret, toHex } from "./bytes";
import { summarize, type ElectionState } from "./election";
import type { Receipt } from "./midnight";

export const REHEARSAL_PROPOSAL = "Adopt the 2027 club budget?";

/**
 * Runs the compiled circuits in the browser. No proof is generated and nothing
 * is sent to a network, so receipts are marked as local. The rules enforced
 * are exactly the contract's: a second ballot fails the same assertion.
 */
export function createRehearsal() {
  const organizer = randomSecret();
  const election = randomSecret();
  const you = randomSecret();
  const key = "00".repeat(32);
  const contract = new Contract(witnesses);
  const initial = contract.initialState(
    createConstructorContext({ organizerSecret: organizer }, key),
    election,
    pureCircuits.organizerCommitment(organizer),
  );
  let context: CircuitContext<PrivateState> = createCircuitContext(
    "01".repeat(32),
    key,
    initial.currentContractState,
    { organizerSecret: organizer },
  );
  const c = contract.impureCircuits;
  const others = [randomSecret(), randomSecret(), randomSecret(), randomSecret()];
  for (const member of [you, ...others])
    context = c.registerVoter(context, pureCircuits.voterCommitment(election, member)).context;
  context = c.closeRegistration(context).context;
  const proposal = encodeProposal(REHEARSAL_PROPOSAL);
  context = c.openProposal(context, proposal).context;
  // Two other members vote first so the tally is not trivially yours.
  others.slice(0, 2).forEach((member, i) => {
    context = c.castVote({ ...context, currentPrivateState: { voterSecret: member } }, proposal, i === 0).context;
  });

  return {
    read(): ElectionState {
      return summarize(ledger(context.currentQueryContext.state));
    },
    vote(proposalId: string, yes: boolean): Receipt {
      const result = c.castVote(
        { ...context, currentPrivateState: { voterSecret: you } },
        fromHex(proposalId, 32),
        yes,
      );
      context = result.context;
      return { txId: "local", block: 0, nullifier: toHex(result.result) };
    },
  };
}
export type Rehearsal = ReturnType<typeof createRehearsal>;
