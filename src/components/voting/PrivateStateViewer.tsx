'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { PrivateState } from '@/lib/midnight';

interface PrivateStateViewerProps {
  privateState: PrivateState | null;
  onReset: () => Promise<void>;
}

export const PrivateStateViewer: React.FC<PrivateStateViewerProps> = ({
  privateState,
  onReset,
}) => {
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);

  return (
    <GlassCard glow="none" className="w-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🔐</span>
            <div>
              <h3 className="text-sm font-semibold text-white">Client-Side Private State (Witness Vault)</h3>
              <p className="text-[11px] text-zinc-400 font-mono">Managed by LevelPrivateStateProvider / IndexedDB</p>
            </div>
          </div>

          <button
            onClick={onReset}
            className="px-3 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-[11px] font-mono transition-colors self-start sm:self-auto"
          >
            ↺ Reset Local Secrets
          </button>
        </div>

        {/* Content Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Secret Key (Local Only) */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Witness: local_secret_key()</span>
              <button
                onClick={() => setIsKeyRevealed(!isKeyRevealed)}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline"
              >
                {isKeyRevealed ? 'Hide' : 'Reveal'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-zinc-300 break-all text-[11px]">
              {isKeyRevealed
                ? privateState?.secretKey || 'Generating ephemeral secret...'
                : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </div>
            <p className="text-[10px] text-zinc-500">
              ⚠️ This key never leaves your local browser memory and is never passed to validators.
            </p>
          </div>

          {/* Commitment (Derived via persistent_hash) */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Commitment (persistentHash)</span>
              <span className="text-[10px] text-emerald-400 font-mono">One-Way SHA-256</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-emerald-400/90 break-all text-[11px]">
              {privateState?.commitment || '0x...'}
            </div>
            <p className="text-[10px] text-zinc-500">
              Publicly verifiable footprint used for authorization constraints without revealing the secret key.
            </p>
          </div>
        </div>

      </div>
    </GlassCard>
  );
};
