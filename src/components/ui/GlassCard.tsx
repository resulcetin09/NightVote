import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'purple' | 'emerald' | 'none';
  variant?: 'double-bezel' | 'simple';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none',
  variant = 'double-bezel',
}) => {
  const glowStyles = {
    purple: 'shadow-[0_0_50px_-15px_rgba(124,58,237,0.25)]',
    emerald: 'shadow-[0_0_50px_-15px_rgba(16,185,129,0.2)]',
    none: '',
  }[glow];

  if (variant === 'simple') {
    return (
      <div
        className={`glass-panel rounded-3xl p-6 relative overflow-hidden transition-all duration-300 ${glowStyles} ${className}`}
      >
        {children}
      </div>
    );
  }

  // Double-Bezel (Doppelrand) Architecture: Outer shell + inner content core
  return (
    <div
      className={`p-1.5 sm:p-2 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl ${glowStyles} ${className}`}
    >
      <div className="rounded-[calc(2rem-0.5rem)] bg-[#0c0c14]/90 border border-white/[0.05] p-6 sm:p-8 h-full relative overflow-hidden">
        {children}
      </div>
    </div>
  );
};
