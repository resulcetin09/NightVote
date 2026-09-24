'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProposalCard } from '@/components/voting/ProposalCard';
import { ZKProofVisualizer } from '@/components/privacy/ZKProofVisualizer';
import { PrivateStateViewer } from '@/components/voting/PrivateStateViewer';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { usePrivateState } from '@/hooks/usePrivateState';
import type { VoteDirection } from '@/lib/midnight';

export default function HomePage() {
  const { isConnected, connect } = useWallet();
  const { ledgerState, proofStatus, isLoading, lastResult, castVote, closeProposal, createProposal } = useContract();
  const { privateState, hasVoted, commitment, recordVote, reset } = usePrivateState();

  const handleCastVote = async (direction: VoteDirection) => {
    if (!isConnected) {
      await connect();
    }
    const result = await castVote(direction);
    if (result.success) {
      recordVote(direction);
    }
  };

  const handleCloseProposal = async () => {
    if (!isConnected) {
      await connect();
    }
    await closeProposal();
  };

  const handleCreateProposal = async (title: string, description: string) => {
    if (!isConnected) {
      await connect();
    }
    await createProposal(title, description);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-16 space-y-16 sm:space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4 sm:pt-8">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono tracking-wider uppercase backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Midnight.js SDK • DApp Connector • Compact VM
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Vote Anonymously.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400">
              Proven Without Being Shown.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The next-generation privacy-preserving governance DApp on Midnight. Powered by zero-knowledge circuits where individual voter identities never leave the client device.
          </p>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {!isConnected ? (
              <button
                onClick={connect}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-semibold text-sm shadow-xl shadow-purple-600/30 transition-all duration-300 active:scale-95 flex items-center gap-2"
              >
                <span>Connect Lace Wallet</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">↗</span>
              </button>
            ) : (
              <a
                href="#interactive-dapp"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-purple-600/30 transition-all duration-300 active:scale-95 flex items-center gap-2"
              >
                <span>Launch Circuit Controls</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">↓</span>
              </a>
            )}

            <a
              href="https://docs.midnight.network"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-sm border border-zinc-700/60 transition-all duration-300"
            >
              Explore Compact Docs ↗
            </a>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 text-left">
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm">
              <span className="text-xl">🛡️</span>
              <h4 className="text-xs font-semibold text-white mt-2">Zero Disclosure</h4>
              <p className="text-[11px] text-zinc-400">Voter secret keys never broadcasted to ledger</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm">
              <span className="text-xl">⚡</span>
              <h4 className="text-xs font-semibold text-white mt-2">disclose() Boundary</h4>
              <p className="text-[11px] text-zinc-400">Deliberate privacy demarcation in Compact</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm">
              <span className="text-xl">🌐</span>
              <h4 className="text-xs font-semibold text-white mt-2">Midnight Preprod</h4>
              <p className="text-[11px] text-zinc-400">On-chain address verifiable testnet deployment</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm">
              <span className="text-xl">🔐</span>
              <h4 className="text-xs font-semibold text-white mt-2">Private Witness</h4>
              <p className="text-[11px] text-zinc-400">Local cryptographic proof generation</p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE DAPP INTERFACE */}
        <section id="interactive-dapp" className="space-y-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
                Live Midnight Circuit Execution
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Decentralized Governance Terminal
              </h2>
            </div>

            <div className="text-xs font-mono text-zinc-400">
              Contract Address: <span className="text-purple-300">0x1ac7...7004</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Proposal Action Card (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <ProposalCard
                ledgerState={ledgerState}
                hasVoted={hasVoted}
                userVoteDirection={privateState?.voteDirection}
                isLoading={isLoading}
                onCastVote={handleCastVote}
                onCloseProposal={handleCloseProposal}
                onCreateProposal={handleCreateProposal}
              />

              <PrivateStateViewer
                privateState={privateState}
                onReset={reset}
              />
            </div>

            {/* Right Column: ZK Proof Engine Status & Circuit Visualizer (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <ZKProofVisualizer
                status={proofStatus}
                lastTxHash={lastResult?.txHash}
                commitment={commitment}
              />

              {/* Technical Blueprint Card */}
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-4 text-xs">
                <h4 className="font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <span>📐</span>
                  <span>How This Compact Contract Works</span>
                </h4>
                <div className="space-y-3 text-zinc-400 leading-relaxed font-sans text-xs">
                  <p>
                    1. <strong className="text-zinc-200">Local Witness Execution:</strong> <code className="text-purple-300 font-mono">local_secret_key()</code> runs entirely in browser memory.
                  </p>
                  <p>
                    2. <strong className="text-zinc-200">Off-Chain Proof:</strong> ZK circuits verify voter authorization and increment <code className="text-purple-300 font-mono">votesFor</code> or <code className="text-purple-300 font-mono">votesAgainst</code> without linking to the secret key.
                  </p>
                  <p>
                    3. <strong className="text-zinc-200">Public Ledger Truth:</strong> Only the aggregate counts are disclosed to Midnight validator nodes via <code className="text-purple-300 font-mono">disclose()</code>.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
