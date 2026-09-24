// ═══════════════════════════════════════════════════════════════════
// Midnight Private State Manager
// Manages local private state (secret keys, commitments)
//
// Private state NEVER leaves the user's device.
// It provides witness data to ZK circuits for proof generation.
// ═══════════════════════════════════════════════════════════════════

import { PrivateState, VoteDirection } from './types';

const STORAGE_KEY = 'nightvote_private_state';

class PrivateStateManager {
  private state: PrivateState | null = null;

  /**
   * Initialize or load private state
   * Generates a new secret key if none exists
   */
  async initialize(): Promise<PrivateState> {
    // Try to load from localStorage
    const stored = this.loadFromStorage();
    if (stored) {
      this.state = stored;
      return this.state;
    }

    // Generate new private state
    const secretKey = await this.generateSecretKey();
    const commitment = await this.computeCommitment(secretKey);

    this.state = {
      secretKey,
      commitment,
      hasVoted: false,
    };

    this.saveToStorage();
    return this.state;
  }

  /**
   * Get current private state
   */
  getState(): PrivateState | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Record that the user has voted (stored locally only)
   */
  recordVote(direction: VoteDirection): void {
    if (this.state) {
      this.state.hasVoted = true;
      this.state.voteDirection = direction;
      this.saveToStorage();
    }
  }

  /**
   * Check if the user has already voted
   */
  hasVoted(): boolean {
    return this.state?.hasVoted ?? false;
  }

  /**
   * Reset private state (for demo purposes)
   */
  reset(): void {
    this.state = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Get the commitment (safe to share — it's a hash)
   */
  getCommitment(): string | null {
    return this.state?.commitment ?? null;
  }

  /**
   * Witness function — provides secret key to ZK circuits
   * This simulates what the Midnight SDK witness does.
   * The key NEVER leaves this function in plaintext to the network.
   */
  witness_local_secret_key(): Uint8Array | null {
    if (!this.state) return null;
    const encoder = new TextEncoder();
    return encoder.encode(this.state.secretKey.padEnd(32, '\0').slice(0, 32));
  }

  private async generateSecretKey(): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
  }

  private async computeCommitment(secretKey: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(secretKey);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return '0x' + secretKey.slice(0, 64);
  }

  private loadFromStorage(): PrivateState | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !this.state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      console.warn('Failed to save private state to localStorage');
    }
  }
}

export const privateStateManager = new PrivateStateManager();
export default privateStateManager;
