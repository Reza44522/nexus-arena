import { cn } from '../../utils/cn';

export default function NeonInput({ label, error, icon, className, id, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="font-display text-xs uppercase tracking-[0.2em] text-slate-400">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-cyan-300/70">{icon}</span>
        )}
        <input
          id={id}
          className={cn(
            'glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.25)]',
            icon && 'pl-11',
            error && 'border-rose-500/60',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}