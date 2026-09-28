import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Phase { registration = 0, idle = 1, voting = 2 }

export type Witnesses<PS> = {
  organizerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  voterSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  membershipPath(context: __compactRuntime.WitnessContext<Ledger, PS>,
                 leaf_0: Uint8Array): [PS, { leaf: Uint8Array,
                                             path: { sibling: { field: bigint },
                                                     goes_left: boolean
                                                   }[]
                                           }];
}

export type ImpureCircuits<PS> = {
  registerVoter(context: __compactRuntime.CircuitContext<PS>,
                commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeRegistration(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  openProposal(context: __compactRuntime.CircuitContext<PS>,
               proposal_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeProposal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  castVote(context: __compactRuntime.CircuitContext<PS>,
           proposal_0: Uint8Array,
           inFavor_0: boolean): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type ProvableCircuits<PS> = {
  registerVoter(context: __compactRuntime.CircuitContext<PS>,
                commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeRegistration(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  openProposal(context: __compactRuntime.CircuitContext<PS>,
               proposal_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeProposal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  castVote(context: __compactRuntime.CircuitContext<PS>,
           proposal_0: Uint8Array,
           inFavor_0: boolean): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type PureCircuits = {
  organizerCommitment(secret_0: Uint8Array): Uint8Array;
  voterCommitment(election_0: Uint8Array, secret_0: Uint8Array): Uint8Array;
  voteNullifier(election_0: Uint8Array,
                proposal_0: Uint8Array,
                secret_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  organizerCommitment(context: __compactRuntime.CircuitContext<PS>,
                      secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  voterCommitment(context: __compactRuntime.CircuitContext<PS>,
                  election_0: Uint8Array,
                  secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  voteNullifier(context: __compactRuntime.CircuitContext<PS>,
                election_0: Uint8Array,
                proposal_0: Uint8Array,
                secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  registerVoter(context: __compactRuntime.CircuitContext<PS>,
                commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeRegistration(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  openProposal(context: __compactRuntime.CircuitContext<PS>,
               proposal_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeProposal(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  castVote(context: __compactRuntime.CircuitContext<PS>,
           proposal_0: Uint8Array,
           inFavor_0: boolean): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly electionId: Uint8Array;
  readonly organizer: Uint8Array;
  readonly phase: Phase;
  voters: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined
  };
  registered: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly activeProposal: Uint8Array;
  proposals: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  yesVotes: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { read(): bigint }
  };
  noVotes: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { read(): bigint }
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               id_0: Uint8Array,
               authority_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
