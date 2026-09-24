'use client';

import { useState, useEffect, useCallback } from 'react';
import { privateStateManager } from '@/lib/midnight';
import type { PrivateState, VoteDirection } from '@/lib/midnight';

export function usePrivateState() {
  const [privateState, setPrivateState] = useState<PrivateState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const state = await privateStateManager.initialize();
      setPrivateState(state);
      setIsInitialized(true);
    };
    init();
  }, []);

  const recordVote = useCallback((direction: VoteDirection) => {
    privateStateManager.recordVote(direction);
    setPrivateState(privateStateManager.getState());
  }, []);

  const reset = useCallback(async () => {
    privateStateManager.reset();
    const state = await privateStateManager.initialize();
    setPrivateState(state);
  }, []);

  const hasVoted = privateState?.hasVoted ?? false;
  const commitment = privateState?.commitment ?? null;

  return {
    privateState,
    isInitialized,
    hasVoted,
    commitment,
    recordVote,
    reset,
  };
}
