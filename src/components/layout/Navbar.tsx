'use client';

import React from 'react';
import { useWallet } from '@/hooks/useWallet';

export const Navbar: React.FC = () => {
  const { walletState, walletInfo, isConnected, isConnecting, isSimulation, displayAddress, connect, disconnect } = useWallet();

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-8 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="p-1.5 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="px-5 py-3 rounded-[calc(2rem-0.375rem)] bg-[#0a0a10]/80 flex items-center justify-between gap-4">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-[1px] shadow-lg shadow-purple-500/20">
                <div className="w-full h-full bg-[#07070b] rounded-2xl flex items-center justify-center">
                  <span className="text-xl">🌙</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-white text-lg">NightVote</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 tracking-wider">
                    Midnight ZK
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline-block">
                  Privacy-First DApp
                </span>
              </div>
            </div>

            {/* Navigation / Badges */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono">Midnight Preprod</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300">
                <span className="text-purple-400">⚡</span>
                <span>Compact 0.23</span>
              </div>
            </div>

            {/* Wallet Connect/Disconnect Action */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-xs font-mono font-medium text-zinc-200">
                      {displayAddress}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {walletInfo?.balance || '1,250 tDUST'} {isSimulation && '(Demo Mode)'}
                    </span>
                  </div>

                  <button
                    onClick={disconnect}
                    className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-700/60 hover:border-zinc-500 transition-all duration-300 active:scale-95"
                    title="Click to disconnect"
                  >
                    <span>Disconnect</span>
                    <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="group relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/30 shadow-lg shadow-purple-600/25 transition-all duration-300 active:scale-95 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connecting Lace...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect Lace Wallet</span>
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
