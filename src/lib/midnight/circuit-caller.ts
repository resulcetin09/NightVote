// ═══════════════════════════════════════════════════════════════════
// Midnight Circuit Caller
// Handles calling Compact contract circuits from the frontend
//
// Circuits generate zero-knowledge proofs that verify computations
// without revealing private inputs (witness data).
//
// In production: uses @midnight-ntwrk/midnight-js-contracts
// In dev/demo: simulates circuit execution with realistic delays
// ═══════════════════════════════════════════════════════════════════

import { CircuitResult, VoteDirection, ZKProofStatus, LedgerState } from './types';

type ProofStatusListener = (status: ZKProofStatus) => void;

class CircuitCaller {
  private proofListeners: Set<ProofStatusListener> = new Set();
  private ledgerState: LedgerState;

  constructor() {
    // Initialize with default ledger state
    this.ledgerState = {
      votesFor: 0,
      votesAgainst: 0,
      totalVoters: 0,
      proposalHash: '',
      isActive: false,
      creatorCommitment: '',
    };
  }

  /**
   * Call the createProposal circuit
   * Creates a new voting proposal with ZK-protected creator identity
   */
  async createProposal(title: string, description: string): Promise<CircuitResult> {
    this.emitProofStatus({ stage: 'generating', progress: 0, message: 'Preparing circuit inputs...' });

    try {
      // Simulate ZK proof generation stages
      await this.simulateProofGeneration();

      // Generate proposal hash
      const proposalHash = await this.generateHash(title + description);
      const creatorCommitment = await this.generateHash('creator-secret-key-' + Date.now());

      // Update ledger state
      this.ledgerState = {
        ...this.ledgerState,
        proposalHash,
        isActive: true,
        creatorCommitment,
        votesFor: 0,
        votesAgainst: 0,
        totalVoters: 0,
      };

      const txHash = '0x' + this.randomHex(64);

      this.emitProofStatus({
        stage: 'complete',
        progress: 100,
        message: 'Proposal created with ZK proof!',
        proofHash: '0x' + this.randomHex(64),
      });

      return {
        success: true,
        data: { proposalHash, title, description },
        txHash,
        proofGenerated: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.emitProofStatus({ stage: 'failed', progress: 0, message: 'Proof generation failed' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        proofGenerated: false,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Call the castVote circuit
   * Casts an anonymous vote verified by ZK proof
   */
  async castVote(direction: VoteDirection): Promise<CircuitResult> {
    this.emitProofStatus({ stage: 'generating', progress: 0, message: 'Computing voter commitment...' });

    try {
      await this.simulateProofGeneration();

      // Update ledger state
      if (direction === 'for') {
        this.ledgerState.votesFor += 1;
      } else {
        this.ledgerState.votesAgainst += 1;
      }
      this.ledgerState.totalVoters += 1;

      const txHash = '0x' + this.randomHex(64);

      this.emitProofStatus({
        stage: 'complete',
        progress: 100,
        message: `Vote cast anonymously via ZK proof!`,
        proofHash: '0x' + this.randomHex(64),
      });

      return {
        success: true,
        data: { direction, totalVoters: this.ledgerState.totalVoters },
        txHash,
        proofGenerated: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.emitProofStatus({ stage: 'failed', progress: 0, message: 'Vote proof failed' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        proofGenerated: false,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Call the closeProposal circuit
   * Only the creator can close (verified via ZK proof)
   */
  async closeProposal(): Promise<CircuitResult> {
    this.emitProofStatus({ stage: 'generating', progress: 0, message: 'Verifying creator identity...' });

    try {
      await this.simulateProofGeneration();

      this.ledgerState.isActive = false;

      const txHash = '0x' + this.randomHex(64);

      this.emitProofStatus({
        stage: 'complete',
        progress: 100,
        message: 'Proposal closed by verified creator',
        proofHash: '0x' + this.randomHex(64),
      });

      return {
        success: true,
        data: { isActive: false },
        txHash,
        proofGenerated: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.emitProofStatus({ stage: 'failed', progress: 0, message: 'Authorization proof failed' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        proofGenerated: false,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get current ledger state (public on-chain data)
   */
  getLedgerState(): LedgerState {
    return { ...this.ledgerState };
  }

  /**
   * Subscribe to proof generation status updates
   */
  onProofStatus(listener: ProofStatusListener): () => void {
    this.proofListeners.add(listener);
    return () => this.proofListeners.delete(listener);
  }

  private emitProofStatus(status: ZKProofStatus): void {
    this.proofListeners.forEach((listener) => listener(status));
  }

  private async simulateProofGeneration(): Promise<void> {
    const stages: { stage: ZKProofStatus['stage']; message: string; delay: number }[] = [
      { stage: 'generating', message: 'Fetching private witness data...', delay: 600 },
      { stage: 'generating', message: 'Building circuit inputs...', delay: 500 },
      { stage: 'proving', message: 'Generating ZK proof (R1CS → Groth16)...', delay: 1200 },
      { stage: 'proving', message: 'Computing proof commitments...', delay: 800 },
      { stage: 'verifying', message: 'Verifying proof on-chain...', delay: 700 },
    ];

    for (let i = 0; i < stages.length; i++) {
      const { stage, message, delay } = stages[i];
      this.emitProofStatus({
        stage,
        progress: Math.round(((i + 1) / stages.length) * 90),
        message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  private async generateHash(input: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return '0x' + this.randomHex(64);
  }

  private randomHex(length: number): string {
    return Array.from({ length: length / 2 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
  }
}

export const circuitCaller = new CircuitCaller();
export default circuitCaller;
