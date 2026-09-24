// ═══════════════════════════════════════════════════════════════════
// Midnight SDK — Public API
// ═══════════════════════════════════════════════════════════════════

export { walletConnector } from './wallet-connector';
export { circuitCaller } from './circuit-caller';
export { privateStateManager } from './private-state';
export { midnightProviders, DEFAULT_CONFIG } from './providers';
export type {
  WalletState,
  WalletInfo,
  CircuitResult,
  Proposal,
  VoteDirection,
  LedgerState,
  PrivateState,
  ZKProofStatus,
  MidnightConfig,
} from './types';
