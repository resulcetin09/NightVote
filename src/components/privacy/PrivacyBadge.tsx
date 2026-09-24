import React from 'react';

interface PrivacyBadgeProps {
  status?: 'proven' | 'protected' | 'active';
  label?: string;
  sublabel?: string;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  status = 'proven',
  label = 'Proven Without Being Shown',
  sublabel = 'Zero-Knowledge Verified',
}) => {
  return (
    <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-purple-950/40 border border-purple-500/30 backdrop-blur-md shadow-inner">
      <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300">
        <span className="text-sm">🛡️</span>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-zinc-100 tracking-tight flex items-center gap-1.5">
          {label}
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
            ZK Guarded
          </span>
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          {sublabel} • Witness Never Disclosed
        </span>
      </div>
    </div>
  );
};
