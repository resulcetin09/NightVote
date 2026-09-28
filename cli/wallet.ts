// Headless wallet for the deploy script, adapted from midnightntwrk/example-counter
// (Apache-2.0). It derives keys from a hex seed, syncs against the public indexer,
// and balances, signs and submits contract transactions.
import * as ledger from "@midnight-ntwrk/ledger-v8";
import { unshieldedToken } from "@midnight-ntwrk/ledger-v8";
import { getNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type {
  MidnightProvider,
  WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { WalletFacade } from "@midnight-ntwrk/wallet-sdk-facade";
import { DustWallet } from "@midnight-ntwrk/wallet-sdk-dust-wallet";
import { HDWallet, Roles } from "@midnight-ntwrk/wallet-sdk-hd";
import { ShieldedWallet } from "@midnight-ntwrk/wallet-sdk-shielded";
import { NoOpTransactionHistoryStorage } from "@midnight-ntwrk/wallet-sdk-abstractions";
import {
  createKeystore,
  PublicKey,
  UnshieldedWallet,
  type UnshieldedKeystore,
} from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";
import * as Rx from "rxjs";
import { WebSocket } from "ws";
import type { NetworkConfig } from "./config";

// GraphQL subscriptions used by wallet sync need a global WebSocket in Node.
(globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;

export interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
}

function deriveKeys(seed: string) {
  const hd = HDWallet.fromSeed(Buffer.from(seed, "hex"));
  if (hd.type !== "seedOk") throw new Error("Invalid wallet seed.");
  const derived = hd.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derived.type !== "keysDerived") throw new Error("Key derivation failed.");
  hd.hdWallet.clear();
  return derived.keys;
}

export async function buildWallet(
  config: NetworkConfig,
  seed: string,
): Promise<WalletContext> {
  const keys = deriveKeys(seed);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(
    keys[Roles.NightExternal],
    getNetworkId(),
  );
  const connection = {
    indexerHttpUrl: config.indexer,
    indexerWsUrl: config.indexerWS,
  };
  const wallet = await WalletFacade.init({
    configuration: {
      networkId: getNetworkId(),
      indexerClientConnection: connection,
      provingServerUrl: new URL(config.proofServer),
      relayURL: new URL(config.node.replace(/^http/, "ws")),
      txHistoryStorage: new NoOpTransactionHistoryStorage(),
      costParameters: {
        additionalFeeOverhead: 300_000_000_000_000n,
        feeBlocksMargin: 5,
      },
    },
    shielded: (cfg) =>
      ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (cfg) =>
      UnshieldedWallet(cfg).startWithPublicKey(
        PublicKey.fromKeyStore(unshieldedKeystore),
      ),
    dust: (cfg) =>
      DustWallet(cfg).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      ),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

const synced = (wallet: WalletFacade) =>
  wallet.state().pipe(
    Rx.throttleTime(5_000),
    Rx.filter((s) => s.isSynced),
  );

export async function waitUntilFunded(
  ctx: WalletContext,
  log: (line: string) => void,
) {
  log(`Unshielded address: ${ctx.unshieldedKeystore.getBech32Address()}`);
  log("Syncing wallet with the network (can take a few minutes)…");
  const heartbeat = setInterval(() => log("…still working"), 60_000);
  try {
    await prepareFunds(ctx, log);
  } finally {
    clearInterval(heartbeat);
  }
  log("Wallet funded and DUST available.");
}

async function prepareFunds(ctx: WalletContext, log: (line: string) => void) {
  const state = await Rx.firstValueFrom(synced(ctx.wallet));
  log("Wallet synced.");
  if ((state.unshielded.balances[unshieldedToken().raw] ?? 0n) === 0n) {
    log("Waiting for tNIGHT from the faucet…");
    await Rx.firstValueFrom(
      synced(ctx.wallet).pipe(
        Rx.filter(
          (s) => (s.unshielded.balances[unshieldedToken().raw] ?? 0n) > 0n,
        ),
      ),
    );
  }
  // Fees are paid in DUST, which NIGHT only generates after designation.
  const current = await Rx.firstValueFrom(synced(ctx.wallet));
  if (current.dust.availableCoins.length === 0) {
    const undesignated = current.unshielded.availableCoins.filter(
      (coin: { meta?: { registeredForDustGeneration?: boolean } }) =>
        coin.meta?.registeredForDustGeneration !== true,
    );
    if (undesignated.length > 0) {
      log(`Designating ${undesignated.length} NIGHT UTXO(s) for DUST…`);
      const recipe = await ctx.wallet.registerNightUtxosForDustGeneration(
        undesignated,
        ctx.unshieldedKeystore.getPublicKey(),
        (payload) => ctx.unshieldedKeystore.signData(payload),
      );
      await ctx.wallet.submitTransaction(
        await ctx.wallet.finalizeRecipe(recipe),
      );
    }
    log("Waiting for DUST to accrue…");
    await Rx.firstValueFrom(
      synced(ctx.wallet).pipe(
        Rx.filter((s) => s.dust.balance(new Date()) > 0n),
      ),
    );
  }
}

// The wallet SDK's signRecipe clones intents with a hard-coded 'pre-proof'
// marker, which fails for proven intents. Sign with the correct marker instead
// (same workaround as the official example).
function signIntents(
  tx: { intents?: Map<number, any> },
  sign: (payload: Uint8Array) => ledger.Signature,
  marker: "proof" | "pre-proof",
) {
  if (!tx.intents) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    const cloned = ledger.Intent.deserialize<
      ledger.SignatureEnabled,
      ledger.Proofish,
      ledger.PreBinding
    >("signature", marker, "pre-binding", intent.serialize());
    const signature = sign(cloned.signatureData(segment));
    for (const key of [
      "fallibleUnshieldedOffer",
      "guaranteedUnshieldedOffer",
    ] as const) {
      const offer = cloned[key];
      if (offer)
        cloned[key] = offer.addSignatures(
          offer.inputs.map((_, i) => offer.signatures.at(i) ?? signature),
        );
    }
    tx.intents.set(segment, cloned);
  }
}

export async function walletProvider(
  ctx: WalletContext,
): Promise<WalletProvider & MidnightProvider> {
  const state = await Rx.firstValueFrom(synced(ctx.wallet));
  return {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () =>
      state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx, ttl) {
      const recipe = await ctx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: ctx.shieldedSecretKeys,
          dustSecretKey: ctx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const sign = (payload: Uint8Array) =>
        ctx.unshieldedKeystore.signData(payload);
      signIntents(recipe.baseTransaction, sign, "proof");
      if (recipe.balancingTransaction)
        signIntents(recipe.balancingTransaction, sign, "pre-proof");
      return ctx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx) => ctx.wallet.submitTransaction(tx) as any,
  };
}
