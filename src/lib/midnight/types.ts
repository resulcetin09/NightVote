// ═══════════════════════════════════════════════════════════════════
// Midnight SDK Type Definitions
// NightVote DApp — Type System
// ═══════════════════════════════════════════════════════════════════

/**
 * Wallet connection states
 */
export type WalletState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Wallet information returned after connection
 */
export interface WalletInfo {
  address: string;
  balance: string;
  networkId: string;
  isConnected: boolean;
}

/**
 * Circuit call result
 */
export interface CircuitResult<T = unknown> {
  success: boolean;
  data?: T;
  txHash?: string;
  error?: string;
  proofGenerated: boolean;
  timestamp: number;
}

/**
 * Proposal data structure
 */
export interface Proposal {
  id: string;
  hash: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  isActive: boolean;
  creatorCommitment: string;
  createdAt: number;
}

/**
 * Vote direction
 */
export type VoteDirection = 'for' | 'against';

/**
 * Contract ledger state (public on-chain data)
 */
export interface LedgerState {
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  proposalHash: string;
  isActive: boolean;
  creatorCommitment: string;
}

/**
 * Private state (local, never on-chain)
 */
export interface PrivateState {
  secretKey: string;
  commitment: string;
  hasVoted: boolean;
  voteDirection?: VoteDirection;
}

/**
 * ZK Proof status for visualization
 */
export interface ZKProofStatus {
  stage: 'idle' | 'generating' | 'proving' | 'verifying' | 'complete' | 'failed';
  progress: number;
  message: string;
  proofHash?: string;
}

/**
 * Midnight Provider configuration
 */
export interface MidnightConfig {
  networkId: string;
  indexerUrl: string;
  nodeUrl: string;
  proofServerUrl: string;
}

/**
 * DApp Connector API (injected by Lace wallet)
 */
export interface MidnightDAppConnectorAPI {
  isEnabled: () => Promise<boolean>;
  enable: () => Promise<void>;
  state: () => Promise<{ address: string; balance: string }>;
  disconnect?: () => Promise<void>;
}

/**
 * Window type augmentation for Midnight wallet
 */
declare global {
  interface Window {
    midnight?: {
      mnLace?: MidnightDAppConnectorAPI;
    };
  }
}

export {};
