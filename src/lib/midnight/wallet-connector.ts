// ═══════════════════════════════════════════════════════════════════
// Midnight Wallet Connector
// Handles Lace wallet connection via DApp Connector API
//
// In production: connects to window.midnight.mnLace
// In dev/demo: provides simulation mode for testing without wallet
// ═══════════════════════════════════════════════════════════════════

import { WalletState, WalletInfo, MidnightDAppConnectorAPI } from './types';

type WalletEventListener = (state: WalletState, info: WalletInfo | null) => void;

// Simulated wallet address for demo mode
const DEMO_ADDRESS = '0x7a4f...e2b1|addr_preprod1qp5d8f...';
const DEMO_BALANCE = '1,250.00 tDUST';

class WalletConnector {
  private state: WalletState = 'disconnected';
  private walletInfo: WalletInfo | null = null;
  private listeners: Set<WalletEventListener> = new Set();
  private api: MidnightDAppConnectorAPI | null = null;
  private isSimulation = false;

  /**
   * Check if the Lace wallet extension is available
   */
  isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.midnight?.mnLace;
  }

  /**
   * Connect to the Lace wallet or start simulation mode
   */
  async connect(): Promise<WalletInfo> {
    this.setState('connecting');

    try {
      if (this.isWalletAvailable()) {
        // Real wallet connection
        this.api = window.midnight!.mnLace!;
        
        const isEnabled = await this.api.isEnabled();
        if (!isEnabled) {
          await this.api.enable();
        }

        const walletState = await this.api.state();
        
        this.walletInfo = {
          address: walletState.address,
          balance: walletState.balance,
          networkId: 'preprod',
          isConnected: true,
        };
        this.isSimulation = false;
      } else {
        // Simulation mode for demo/development
        console.log('🔮 Lace wallet not detected — entering simulation mode');
        await this.simulateConnection();
        this.isSimulation = true;
      }

      this.setState('connected');
      return this.walletInfo!;
    } catch (error) {
      this.setState('error');
      throw new Error(
        `Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect from the wallet
   */
  async disconnect(): Promise<void> {
    try {
      if (this.api?.disconnect) {
        await this.api.disconnect();
      }
    } catch {
      // Ignore disconnect errors
    }

    this.api = null;
    this.walletInfo = null;
    this.isSimulation = false;
    this.setState('disconnected');
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return this.state;
  }

  /**
   * Get wallet info
   */
  getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  /**
   * Check if running in simulation mode
   */
  isSimulationMode(): boolean {
    return this.isSimulation;
  }

  /**
   * Subscribe to wallet state changes
   */
  subscribe(listener: WalletEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(state: WalletState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener(state, this.walletInfo));
  }

  private async simulateConnection(): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    this.walletInfo = {
      address: DEMO_ADDRESS,
      balance: DEMO_BALANCE,
      networkId: 'preprod',
      isConnected: true,
    };
  }
}

// Singleton instance
export const walletConnector = new WalletConnector();
export default walletConnector;
