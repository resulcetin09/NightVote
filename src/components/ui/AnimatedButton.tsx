import React from 'react';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald';
  icon?: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  className = '',
  ...props
}) => {
  const styles = {
    primary: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/20 border-purple-500/30',
    secondary: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/60 shadow-black/20',
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 border-emerald-400/30',
  }[variant];

  return (
    <button
      className={`group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-xs font-semibold border shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {icon && (
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
          {icon}
        </div>
      )}
    </button>
  );
};
