import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NightVote | Privacy-Preserving Anonymous Voting on Midnight',
  description: 'A zero-knowledge anonymous voting decentralized application built on the Midnight blockchain using Compact language and the Midnight.js SDK.',
  keywords: ['Midnight', 'Blockchain', 'Zero-Knowledge Proofs', 'Compact', 'Anonymous Voting', 'ZK DApp', 'Lace Wallet'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050505] text-zinc-100 antialiased selection:bg-purple-600/30 selection:text-white relative">
        {/* Ambient mesh background effects */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[140px] mix-blend-screen opacity-70 animate-glow-pulse" />
          <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-emerald-900/15 rounded-full blur-[130px] mix-blend-screen opacity-60" />
          <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-indigo-950/30 rounded-full blur-[160px] mix-blend-screen" />
          <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
