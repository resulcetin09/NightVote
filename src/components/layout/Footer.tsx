import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/5 py-12 px-6 sm:px-8 bg-[#040407]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500 font-mono">
        
        {/* Brand & Mission */}
        <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="text-zinc-200 font-semibold font-sans">NightVote DApp</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px]">Stage 2 Submission</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Rise In • &quot;New Moon to Full&quot; Challenge • Midnight Blockchain Preprod
          </p>
        </div>

        {/* Contract Address Verification */}
        <div className="p-3 rounded-2xl bg-black/60 border border-white/5 flex flex-col items-center md:items-end gap-1 text-center md:text-right">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
            Deployed Preprod Contract
          </span>
          <a
            href="https://docs.midnight.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline break-all text-[11px]"
          >
            0x1ac7aade9e90f99fdeafea03ae520b9f71997004
          </a>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4 text-[11px]">
          <a href="https://docs.midnight.network" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
            Midnight Docs ↗
          </a>
          <a href="https://risein.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
            Rise In ↗
          </a>
          <a href="https://github.com/resulcetin09/NightVote" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
            GitHub ↗
          </a>
        </div>

      </div>
    </footer>
  );
};
