'use client';

import React from 'react';
import { ZKProofStatus } from '@/lib/midnight';

interface ZKProofVisualizerProps {
  status: ZKProofStatus;
  lastTxHash?: string;
  commitment?: string | null;
}

export const ZKProofVisualizer: React.FC<ZKProofVisualizerProps> = ({
  status,
  lastTxHash,
  commitment,
}) => {
  const isRunning = status.stage === 'generating' || status.stage === 'proving' || status.stage === 'verifying';
  const isComplete = status.stage === 'complete';

  const stages = [
    { key: 'generating', label: '1. Private Witness', desc: 'Secret Key (Device only)' },
    { key: 'proving', label: '2. ZK Prover', desc: 'R1CS Circuit & Groth16 Proof' },
    { key: 'verifying', label: '3. Ledger Verifier', desc: 'On-chain proof assertion' },
  ];

  return (
    <div className="p-1 rounded-3xl bg-gradient-to-b from-purple-500/20 via-zinc-800/40 to-transparent border border-white/10 overflow-hidden">
      <div className="p-6 rounded-[calc(1.5rem-0.25rem)] bg-[#0c0c16]/95 backdrop-blur-xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Zero-Knowledge Proof Engine</h3>
              <p className="text-xs text-zinc-400 font-mono">Kachina Privacy Model • Off-Chain Proving</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
              isComplete
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : isRunning
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 animate-pulse'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-400' : isRunning ? 'bg-purple-400 animate-ping' : 'bg-zinc-500'}`} />
              {isComplete ? 'Proof Verified' : isRunning ? 'Synthesizing ZK Circuit...' : 'Engine Ready'}
            </span>
          </div>
        </div>

        {/* Dynamic Interactive Flow Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {stages.map((stg, idx) => {
            const active = status.stage === stg.key;
            const done = isComplete || (stg.key === 'generating' && (status.stage === 'proving' || status.stage === 'verifying')) || (stg.key === 'proving' && status.stage === 'verifying');

            return (
              <div
                key={stg.key}
                className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                  active
                    ? 'bg-purple-900/20 border-purple-500/60 shadow-lg shadow-purple-500/10'
                    : done
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-zinc-900/40 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-zinc-200">{stg.label}</span>
                  {done ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">✓</span>
                  ) : active ? (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">{stg.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-zinc-600 font-mono text-xs">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar if running */}
        {isRunning && (
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>{status.message}</span>
              <span className="text-purple-400">{status.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Privacy Matrix: What's Public vs What's Kept Secret */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span>🔒 Kept Secret (Witness State)</span>
            </div>
            <ul className="text-zinc-400 space-y-1 text-[11px]">
              <li>• Voter Secret Key: <span className="text-zinc-500 italic">Never broadcasted</span></li>
              <li>• Individual Vote Choice: <span className="text-zinc-500 italic">Shielded by ZK proof</span></li>
              <li>• Local Commitment: <span className="text-zinc-300 font-mono break-all">{commitment ? `${commitment.slice(0, 16)}...` : 'Derived off-chain'}</span></li>
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <span>🌐 Public On Ledger (via disclose())</span>
            </div>
            <ul className="text-zinc-400 space-y-1 text-[11px]">
              <li>• Aggregate Vote Counter: <span className="text-zinc-200">Public Truth</span></li>
              <li>• Valid ZK Proof: <span className="text-emerald-400">Verified by nodes</span></li>
              <li>• Tx Hash: <span className="text-zinc-300 break-all">{lastTxHash ? `${lastTxHash.slice(0, 14)}...` : '0x516dd69b...'}</span></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
