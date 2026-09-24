'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrivacyBadge } from '@/components/privacy/PrivacyBadge';
import type { VoteDirection, LedgerState } from '@/lib/midnight';

interface ProposalCardProps {
  ledgerState: LedgerState;
  hasVoted: boolean;
  userVoteDirection?: VoteDirection;
  isLoading: boolean;
  onCastVote: (direction: VoteDirection) => Promise<void>;
  onCloseProposal: () => Promise<void>;
  onCreateProposal: (title: string, description: string) => Promise<void>;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  ledgerState,
  hasVoted,
  userVoteDirection,
  isLoading,
  onCastVote,
  onCloseProposal,
  onCreateProposal,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const total = (ledgerState.votesFor || 0) + (ledgerState.votesAgainst || 0);
  const forPercent = total > 0 ? Math.round((ledgerState.votesFor / total) * 100) : 0;
  const againstPercent = total > 0 ? Math.round((ledgerState.votesAgainst / total) * 100) : 0;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onCreateProposal(newTitle, newDesc);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <GlassCard glow="purple" className="w-full">
      {/* Top Bar: Proposal Status & Privacy Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${ledgerState.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              {ledgerState.isActive ? 'Active Proposal Circuit' : 'Proposal Concluded'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              Midnight Ecosystem Governance — Q3 Protocol Upgrade
            </h2>
          </div>
        </div>

        <PrivacyBadge />
      </div>

      {/* Description / Proposal Overview */}
      <div className="py-6 space-y-4">
        <p className="text-sm text-zinc-300 leading-relaxed">
          Proposal to enable native ZK-Rollup shielded bridge contracts on the Midnight Preprod network. Every voter proves eligibility via local witness key commitment without revealing voter identity or individual ballot selections to the validator nodes.
        </p>

        {/* Ledger Metadata Chipset */}
        <div className="flex flex-wrap gap-2.5 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-zinc-400">
            Proposal Hash: <span className="text-zinc-200">{ledgerState.proposalHash ? `${ledgerState.proposalHash.slice(0, 10)}...` : '0x7e8f9a0b...'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-zinc-400">
            Total Ballots Cast: <span className="text-purple-400 font-bold">{ledgerState.totalVoters}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-zinc-400">
            Circuit: <span className="text-emerald-400 font-bold">castVote(inFavor)</span>
          </div>
        </div>
      </div>

      {/* Live Ballots Progress Bars */}
      <div className="p-5 rounded-2xl bg-black/50 border border-white/5 space-y-4 my-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-emerald-400 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            FOR ({ledgerState.votesFor} votes)
          </span>
          <span className="text-zinc-400">{forPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-sm shadow-emerald-500/50"
            style={{ width: `${Math.max(forPercent, total === 0 ? 50 : 0)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-mono pt-2">
          <span className="text-red-400 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            AGAINST ({ledgerState.votesAgainst} votes)
          </span>
          <span className="text-zinc-400">{againstPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full transition-all duration-700 shadow-sm shadow-red-500/50"
            style={{ width: `${Math.max(againstPercent, total === 0 ? 50 : 0)}%` }}
          />
        </div>
      </div>

      {/* Voting Actions Section */}
      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {hasVoted ? (
          <div className="w-full p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">✓</span>
              <div>
                <p className="text-xs font-semibold text-white">Ballot Successfully Cast via ZK Circuit</p>
                <p className="text-[11px] text-zinc-400 font-mono">Your vote was aggregated without disclosing your identity</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {userVoteDirection ? `Voted: ${userVoteDirection.toUpperCase()}` : 'Voted'}
            </span>
          </div>
        ) : ledgerState.isActive ? (
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onCastVote('for')}
              disabled={isLoading}
              className="flex-1 group relative py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm border border-emerald-400/30 shadow-lg shadow-emerald-600/20 transition-all duration-300 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>Vote in Favor (YES)</span>
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center group-hover:scale-110 transition-transform">✓</span>
            </button>

            <button
              onClick={() => onCastVote('against')}
              disabled={isLoading}
              className="flex-1 group relative py-3.5 px-6 rounded-2xl bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-red-950/60 hover:to-zinc-900 text-zinc-200 hover:text-white font-semibold text-sm border border-zinc-700/60 hover:border-red-500/40 transition-all duration-300 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>Vote Against (NO)</span>
              <span className="w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center group-hover:scale-110 transition-transform">✕</span>
            </button>
          </div>
        ) : (
          <div className="w-full p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-400 font-mono">
            This proposal is closed. Create a new proposal below.
          </div>
        )}
      </div>

      {/* Admin / Creator Circuit Controls */}
      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-zinc-500 font-mono text-[11px]">
          Creator Authorization: <span className="text-zinc-400">Checked inside ZK circuit</span>
        </div>

        <div className="flex items-center gap-2">
          {ledgerState.isActive && (
            <button
              onClick={onCloseProposal}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-500/30 transition-all font-mono text-[11px] disabled:opacity-50"
            >
              Circuit: closeProposal()
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 transition-all font-mono text-[11px] disabled:opacity-50"
          >
            + New Proposal Circuit
          </button>
        </div>
      </div>

      {/* Modal for creating a new proposal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg p-1.5 rounded-[2rem] bg-white/10 border border-white/20 shadow-2xl">
            <div className="p-6 sm:p-8 rounded-[calc(2rem-0.375rem)] bg-[#0c0c16] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-lg font-bold text-white">Create New ZK Proposal</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">Proposal Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Expand Midnight Preprod Faucet Limits"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 focus:border-purple-500 text-sm text-white focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe the governance topic and cryptographic constraints..."
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 focus:border-purple-500 text-sm text-white focus:outline-none font-sans"
                  />
                </div>

                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-300 font-mono">
                  🔒 The creator identity is shielded by a hash commitment on-chain.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20"
                  >
                    {isLoading ? 'Executing Circuit...' : 'Call createProposal()'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
