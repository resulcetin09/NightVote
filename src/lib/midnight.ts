import { CompiledContract } from "@midnight-ntwrk/compact-js";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { Transaction } from "@midnight-ntwrk/ledger-v8";
import {
  MidnightBech32m,
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from "@midnight-ntwrk/wallet-sdk-address-format";
import type {
  FinalizedTxData,
  MidnightProviders,
} from "@midnight-ntwrk/midnight-js-types";
import {
  Contract,
  ledger,
  pureCircuits,
} from "../../contract/managed/voting/contract/index.js";
import { witnesses, type PrivateState } from "../contract/witnesses";
import { memoryPrivateState } from "./private-state";
import { assertWalletNetwork, type WalletSession } from "./wallet";
import {
  NETWORK,
  assertSameElection,
  type OrganizerFile,
  type RecordedTx,
  type VoterKey,
} from "./files";
import { encodeProposal, fromHex, randomSecret, toHex } from "./bytes";
import { summarize, type ElectionState } from "./election";
import { UserError, withTimeout } from "./errors";

export type Phase = "preparing" | "proving" | "approving" | "confirming";
export interface Receipt {
  txId: string;
  block: number;
  nullifier?: string;
}
type Circuits =
  | "registerVoter"
  | "closeRegistration"
  | "openProposal"
  | "closeProposal"
  | "castVote";
type Providers = MidnightProviders<Circuits, string, PrivateState>;

/** Public Preview indexer, used for read-only views before a wallet connects. */
export const PUBLIC_INDEXER = {
  http: "https://indexer.preview.midnight.network/api/v3/graphql",
  ws: "wss://indexer.preview.midnight.network/api/v3/graphql/ws",
};

const compiledContract = CompiledContract.make(
  "NightVote",
  Contract<PrivateState>,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets("contract/voting"),
);

async function readElection(
  source: ReturnType<typeof indexerPublicDataProvider>,
  address: string,
): Promise<ElectionState> {
  const result = await withTimeout(
    source.queryContractState(address),
    30000,
    "The Preview indexer did not respond. Check your connection and try again.",
  );
  if (!result)
    throw new UserError(
      "No NightVote election exists at this address on Preview. Check the address with the organizer.",
    );
  try {
    return summarize(ledger(result.data));
  } catch {
    throw new UserError(
      "The contract at this address is not a NightVote election.",
    );
  }
}

/** Read-only access; needs no wallet. */
export function publicReader() {
  setNetworkId(NETWORK);
  const source = indexerPublicDataProvider(PUBLIC_INDEXER.http, PUBLIC_INDEXER.ws);
  return { read: (address: string) => readElection(source, address) };
}

export function localProver(url: string | undefined): string {
  if (!url)
    throw new UserError(
      "Choose a local proof server in your wallet settings (http://localhost:6300), then reconnect.",
    );
  const parsed = new URL(url);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  )
    throw new UserError(
      "NightVote requires a local proof server so your voter secret is never sent to a third party. Set your wallet’s proof server to http://localhost:6300.",
    );
  return parsed.href;
}

function confirmed(step: string, circuit: string, data: FinalizedTxData): RecordedTx {
  if (data.status !== "SucceedEntirely")
    throw new UserError(
      "The transaction was included but did not succeed. Refresh the election before trying again.",
    );
  return { step, circuit, txId: data.txId, blockHeight: data.blockHeight, status: data.status };
}

export async function createMidnightClient(
  session: WalletSession,
  onPhase: (phase: Phase) => void,
) {
  setNetworkId(NETWORK);
  const config = await assertWalletNetwork(session.api);
  const prover = localProver(config.proverServerUri);
  // The full shielded address exceeds bech32's default length limit, so decode
  // the two keys the connector also returns separately.
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await session.api.getShieldedAddresses();
  const coinPublicKey = ShieldedCoinPublicKey.codec
    .decode(NETWORK, MidnightBech32m.parse(shieldedCoinPublicKey))
    .toHexString();
  const encryptionPublicKey = ShieldedEncryptionPublicKey.codec
    .decode(NETWORK, MidnightBech32m.parse(shieldedEncryptionPublicKey))
    .toHexString();
  const privateStateProvider = memoryPrivateState();
  const zkConfigProvider = new FetchZkConfigProvider<Circuits>(
    new URL(`${import.meta.env.BASE_URL}contract/voting`, window.location.origin)
      .href,
    // The SDK calls fetch as a method of the provider; browsers reject that
    // ("Illegal invocation") unless fetch stays bound to window.
    (input, init) => window.fetch(input, init),
  );
  const rawProof = httpClientProofProvider(prover, zkConfigProvider);
  const rawPublic = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);
  const providers: Providers = {
    privateStateProvider,
    zkConfigProvider,
    publicDataProvider: {
      ...rawPublic,
      async queryZSwapAndContractState(address, options) {
        const result = await rawPublic.queryZSwapAndContractState(address, options);
        if (!result) return result;
        const [zswap, contract, parameters] = result;
        return [zswap.postBlockUpdate(new Date()), contract, parameters];
      },
    },
    proofProvider: {
      async proveTx(tx, options) {
        await assertWalletNetwork(session.api);
        onPhase("proving");
        return rawProof.proveTx(tx, options);
      },
    },
    walletProvider: {
      getCoinPublicKey: () => coinPublicKey,
      getEncryptionPublicKey: () => encryptionPublicKey,
      async balanceTx(tx) {
        await assertWalletNetwork(session.api);
        onPhase("approving");
        const result = await session.api.balanceUnsealedTransaction(
          toHex(tx.serialize()),
        );
        return Transaction.deserialize("signature", "proof", "binding", fromHex(result.tx));
      },
    },
    midnightProvider: {
      async submitTx(tx) {
        await assertWalletNetwork(session.api);
        await session.api.submitTransaction(toHex(tx.serialize()));
        onPhase("confirming");
        return tx.identifiers()[0];
      },
    },
  };

  async function join(file: OrganizerFile | VoterKey, state: PrivateState) {
    onPhase("preparing");
    await assertWalletNetwork(session.api);
    const current = await readElection(rawPublic, file.contractAddress);
    assertSameElection(file, fromHex(current.electionId, 32));
    // findDeployedContract also refuses a contract whose on-chain verifier
    // keys differ from the ones this app was built with.
    return findDeployedContract(providers, {
      compiledContract,
      contractAddress: file.contractAddress,
      privateStateId: "nightvote",
      initialPrivateState: state,
    });
  }
  // Witness state is imported per operation and never retained by the SDK.
  async function scoped<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } finally {
      await privateStateProvider.clear();
    }
  }
  const asOrganizer = (file: OrganizerFile) =>
    join(file, { organizerSecret: fromHex(file.secret, 32) });
  const record = (step: string, circuit: string, data: FinalizedTxData) => {
    const tx = confirmed(step, circuit, data);
    return { txId: tx.txId, block: tx.blockHeight } satisfies Receipt;
  };

  return {
    read: (address: string) => readElection(rawPublic, address),
    async deploy(name: string) {
      return scoped(async () => {
        onPhase("preparing");
        const secret = randomSecret();
        const electionId = randomSecret();
        const contract = await deployContract(providers, {
          compiledContract,
          privateStateId: "nightvote",
          initialPrivateState: { organizerSecret: secret },
          args: [electionId, pureCircuits.organizerCommitment(secret)],
        });
        const receipt = record("deploy", "constructor", contract.deployTxData.public);
        const file: OrganizerFile = {
          kind: "nightvote-organizer",
          version: 1,
          network: NETWORK,
          contractAddress: contract.deployTxData.public.contractAddress,
          electionId: toHex(electionId),
          secret: toHex(secret),
          name,
        };
        return { file, receipt };
      });
    },
    registerVoter: (file: OrganizerFile, commitment: string) =>
      scoped(async () => {
        const c = await asOrganizer(file);
        const tx = await c.callTx.registerVoter(fromHex(commitment, 32));
        return record("register voter", "registerVoter", tx.public);
      }),
    closeRegistration: (file: OrganizerFile) =>
      scoped(async () => {
        const c = await asOrganizer(file);
        return record("seal roll", "closeRegistration", (await c.callTx.closeRegistration()).public);
      }),
    openProposal: (file: OrganizerFile, text: string) =>
      scoped(async () => {
        const c = await asOrganizer(file);
        const tx = await c.callTx.openProposal(encodeProposal(text));
        return record(`open "${text.trim()}"`, "openProposal", tx.public);
      }),
    closeProposal: (file: OrganizerFile) =>
      scoped(async () => {
        const c = await asOrganizer(file);
        return record("close proposal", "closeProposal", (await c.callTx.closeProposal()).public);
      }),
    castVote: (key: VoterKey, proposalId: string, yes: boolean) =>
      scoped(async () => {
        const secret = fromHex(key.secret, 32);
        const c = await join(key, { voterSecret: secret });
        const proposal = fromHex(proposalId, 32);
        const tx = await c.callTx.castVote(proposal, yes);
        const receipt = record("vote", "castVote", tx.public);
        return {
          ...receipt,
          nullifier: toHex(
            pureCircuits.voteNullifier(fromHex(key.electionId, 32), proposal, secret),
          ),
        };
      }),
    async clear() {
      await privateStateProvider.clear();
      await privateStateProvider.clearSigningKeys();
    },
  };
}

export type MidnightClient = Awaited<ReturnType<typeof createMidnightClient>>;

/** Creates a voter key on this device. Only the commitment leaves it. */
export function createVoterKey(contractAddress: string, electionId: string): {
  key: VoterKey;
  commitment: string;
} {
  const secret = randomSecret();
  return {
    key: {
      kind: "nightvote-voter",
      version: 1,
      network: NETWORK,
      contractAddress,
      electionId,
      secret: toHex(secret),
    },
    commitment: toHex(pureCircuits.voterCommitment(fromHex(electionId, 32), secret)),
  };
}
