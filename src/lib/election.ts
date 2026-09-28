import { Phase, ledger } from "../../contract/managed/voting/contract/index.js";
import { decodeProposal, toHex } from "./bytes";

export { Phase };

export interface ProposalResult {
  id: string;
  text: string;
  yes: number;
  no: number;
  active: boolean;
}

export interface ElectionState {
  electionId: string;
  phase: Phase;
  registered: number;
  ballots: number;
  proposals: ProposalResult[];
  active: ProposalResult | null;
}

type Ledger = ReturnType<typeof ledger>;

/** Everything shown about an election is read from the public ledger here. */
export function summarize(value: Ledger): ElectionState {
  const activeId = toHex(value.activeProposal);
  const proposals = [...value.proposals].map((id) => {
    const hex = toHex(id);
    return {
      id: hex,
      text: decodeProposal(id),
      yes: value.yesVotes.member(id) ? Number(value.yesVotes.lookup(id).read()) : 0,
      no: value.noVotes.member(id) ? Number(value.noVotes.lookup(id).read()) : 0,
      active: value.phase === Phase.voting && hex === activeId,
    };
  });
  return {
    electionId: toHex(value.electionId),
    phase: value.phase,
    registered: Number(value.registered.size()),
    ballots: Number(value.nullifiers.size()),
    proposals,
    active: proposals.find((p) => p.active) ?? null,
  };
}
