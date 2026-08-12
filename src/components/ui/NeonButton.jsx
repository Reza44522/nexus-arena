import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/* ─────────── NeonButton — NEXUS UI v6 ───────────
   حالت‌ها: Hover (گلو + جارو نور) / Press (فشردن) / Loading / Disabled
   واریانت‌ها: primary | ghost | gold | danger (ناشناخته = primary)
   سایزها: sm | md | lg
   prop جدید اختیاری: loading
─────────────────────────────────────────────── */

const SIZES = {
  sm: 'gap-1.5 rounded-lg px-3 py-1.5 text-xs',
  md: 'gap-2 rounded-xl px-5 py-2.5 text-sm',
  lg: 'gap-2.5 rounded-xl px-7 py-3.5 text-base',
};

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-bold ' +
    'shadow-[0_0_20px_rgba(34,211,238,0.35)] ' +
    'hover:shadow-[0_0_32px_rgba(34,211,238,0.5),0_0_50px_rgba(232,121,249,0.3)] hover:brightness-110',
  ghost:
    'border border-white/10 bg-white/5 text-slate-200 ' +
    'hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200',
  gold:
    'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black ' +
    'shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:shadow-[0_0_34px_rgba(251,191,36,0.55)] hover:brightness-110',
  danger:
    'bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold ' +
    'shadow-[0_0_20px_rgba(244,63,94,0.35)] hover:shadow-[0_0_32px_rgba(244,63,94,0.55)] hover:brightness-110',
};

export default function NeonButton({
  size = 'md',
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}) {
  return (
    <button
      className={cn(
        'relative inline-flex select-none items-center justify-center font-bold transition-all duration-300',
        SIZES[size] || SIZES.md,
        VARIANTS[variant] || VARIANTS.primary,
        (disabled || loading) && 'pointer-events-none opacity-45 saturate-50 shadow-none',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}