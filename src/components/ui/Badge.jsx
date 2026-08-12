import { cn } from '../../utils/cn';

/* ─────────── Badge — NEXUS UI v6 ───────────
   نشان نئونی با رنگ‌های سایبرپانک + حالت pulse زنده
   رنگ‌ها: cyan | magenta | green | red | amber | gold | blue | violet
─────────────────────────────────────────────── */

const COLORS = {
  cyan: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]',
  magenta: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_12px_rgba(232,121,249,0.25)]',
  green: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.25)]',
  red: 'border-red-400/40 bg-red-400/10 text-red-300 shadow-[0_0_12px_rgba(248,113,113,0.25)]',
  amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)]',
  gold: 'border-yellow-400/50 bg-yellow-400/10 text-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.3)]',
  blue: 'border-blue-400/40 bg-blue-400/10 text-blue-300 shadow-[0_0_12px_rgba(96,165,250,0.25)]',
  violet: 'border-violet-400/40 bg-violet-400/10 text-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.25)]',
};

export default function Badge({ color = 'cyan', pulse = false, className, children, ...rest }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md transition-all duration-300',
        COLORS[color] || COLORS.cyan,
        className
      )}
      {...rest}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}