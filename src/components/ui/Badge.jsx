import { cn } from '../../utils/cn';

const colors = {
  cyan: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
  magenta: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300',
  green: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  red: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  slate: 'border-white/15 bg-white/5 text-slate-300',
};

export default function Badge({ children, color = 'cyan', pulse = false, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[11px] font-semibold uppercase tracking-widest',
        colors[color],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}