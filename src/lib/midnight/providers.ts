// ═══════════════════════════════════════════════════════════════════
// Midnight SDK Providers
// Configures the provider architecture for the DApp
//
// In production, these would be real SDK providers:
//   - WalletProvider: @midnight-ntwrk/wallet-sdk
//   - PublicDataProvider: indexerPublicDataProvider (GraphQL)
//   - PrivateStateProvider: levelPrivateStateProvider (IndexedDB)
//   - ProofProvider: connects to the Docker proof server
//
// For demo/dev, we use simulated providers that mirror the API.
// ═══════════════════════════════════════════════════════════════════

import { MidnightConfig } from './types';
import { walletConnector } from './wallet-connector';
import { circuitCaller } from './circuit-caller';
import { privateStateManager } from './private-state';

// Default configuration for Midnight Preprod
export const DEFAULT_CONFIG: MidnightConfig = {
  networkId: 'preprod',
  indexerUrl: process.env.NEXT_PUBLIC_INDEXER_URL || 'http://localhost:8088/api/v1/graphql',
  nodeUrl: process.env.NEXT_PUBLIC_NODE_URL || 'http://localhost:9944',
  proofServerUrl: process.env.NEXT_PUBLIC_PROOF_SERVER_URL || 'http://localhost:6300',
};

/**
 * MidnightProviders — aggregates all provider instances
 *
 * In a full Midnight SDK setup, this would be:
 *   const providers = await createMidnightProviders({
 *     walletProvider: ...,
 *     publicDataProvider: indexerPublicDataProvider(indexerUrl),
 *     privateStateProvider: levelPrivateStateProvider({ ... }),
 *     zkConfigProvider: { proverServerUrl },
 *   });
 */
export const midnightProviders = {
  wallet: walletConnector,
  circuit: circuitCaller,
  privateState: privateStateManager,
  config: DEFAULT_CONFIG,
};

export default midnightProviders;
