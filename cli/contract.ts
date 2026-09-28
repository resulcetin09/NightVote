import { CompiledContract } from "@midnight-ntwrk/compact-js";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { Contract } from "../contract/managed/voting/contract/index.js";
import { witnesses, type PrivateState } from "../src/contract/witnesses";
import { paths } from "./config";

export const circuits = [
  "registerVoter",
  "closeRegistration",
  "openProposal",
  "closeProposal",
  "castVote",
] as const;
export type VotingCircuit = (typeof circuits)[number];
export type VotingProviders = MidnightProviders<
  VotingCircuit,
  string,
  PrivateState
>;

export const compiledContract = CompiledContract.make(
  "NightVote",
  Contract<PrivateState>,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(paths.zkConfig),
);
