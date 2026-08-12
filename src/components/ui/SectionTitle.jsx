import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/* ─────────── SectionTitle — NEXUS UI v6 ───────────
   تگ نئونی HUD + عنوان با گلو + خط تکنولوژیک الماس‌دار
   Scroll Reveal هنگام ورود به دید
─────────────────────────────────────────────── */
export default function SectionTitle({ center = false, tag, title, subtitle, className, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn('mb-10', center && 'text-center', className)}
      {...rest}
    >
      {tag && (
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 font-display text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.2)]">
          <span className="h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          {tag}
        </span>
      )}

      <h2 className="mt-4 font-display text-2xl font-black text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.35)] sm:text-4xl">
        {title}
      </h2>

      {subtitle && (
        <p className={cn('mt-3 text-sm leading-7 text-slate-400 sm:text-base', center && 'mx-auto max-w-2xl')}>
          {subtitle}
        </p>
      )}

      {/* خط تکنولوژیک زیر عنوان */}
      <div className={cn('mt-5 flex items-center gap-2', center && 'justify-center')}>
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400/70" />
        <span className="h-1.5 w-1.5 rotate-45 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-fuchsia-400/70" />
      </div>
    </motion.div>
  );
}