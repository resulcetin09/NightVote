'use client';

import { useState, useCallback, useEffect } from 'react';
import { circuitCaller } from '@/lib/midnight';
import type { CircuitResult, VoteDirection, LedgerState, ZKProofStatus } from '@/lib/midnight';

export function useContract() {
  const [ledgerState, setLedgerState] = useState<LedgerState>(circuitCaller.getLedgerState());
  const [proofStatus, setProofStatus] = useState<ZKProofStatus>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CircuitResult | null>(null);

  useEffect(() => {
    const unsubscribe = circuitCaller.onProofStatus((status) => {
      setProofStatus(status);
    });
    return unsubscribe;
  }, []);

  const refreshLedgerState = useCallback(() => {
    setLedgerState(circuitCaller.getLedgerState());
  }, []);

  const createProposal = useCallback(
    async (title: string, description: string): Promise<CircuitResult> => {
      setIsLoading(true);
      try {
        const result = await circuitCaller.createProposal(title, description);
        setLastResult(result);
        refreshLedgerState();
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshLedgerState]
  );

  const castVote = useCallback(
    async (direction: VoteDirection): Promise<CircuitResult> => {
      setIsLoading(true);
      try {
        const result = await circuitCaller.castVote(direction);
        setLastResult(result);
        refreshLedgerState();
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshLedgerState]
  );

  const closeProposal = useCallback(async (): Promise<CircuitResult> => {
    setIsLoading(true);
    try {
      const result = await circuitCaller.closeProposal();
      setLastResult(result);
      refreshLedgerState();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [refreshLedgerState]);

  return {
    ledgerState,
    proofStatus,
    isLoading,
    lastResult,
    createProposal,
    castVote,
    closeProposal,
    refreshLedgerState,
  };
}
