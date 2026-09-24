'use client';

import { useState, useEffect, useCallback } from 'react';
import { walletConnector } from '@/lib/midnight';
import type { WalletState, WalletInfo } from '@/lib/midnight';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>('disconnected');
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSimulation, setIsSimulation] = useState(false);

  useEffect(() => {
    const unsubscribe = walletConnector.subscribe((state, info) => {
      setWalletState(state);
      setWalletInfo(info);
      setIsSimulation(walletConnector.isSimulationMode());
    });

    // Restore state if already connected
    setWalletState(walletConnector.getState());
    setWalletInfo(walletConnector.getWalletInfo());

    return unsubscribe;
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const info = await walletConnector.connect();
      return info;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    setError(null);
    await walletConnector.disconnect();
  }, []);

  const isConnected = walletState === 'connected';
  const isConnecting = walletState === 'connecting';

  // Truncate address for display
  const displayAddress = walletInfo?.address
    ? `${walletInfo.address.slice(0, 8)}...${walletInfo.address.slice(-6)}`
    : null;

  return {
    walletState,
    walletInfo,
    error,
    isConnected,
    isConnecting,
    isSimulation,
    displayAddress,
    connect,
    disconnect,
  };
}
