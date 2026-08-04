import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function SectionTitle({ tag, title, subtitle, center = false }) {
  return (
    <div className={cn('mb-10 max-w-2xl', center && 'mx-auto text-center')}>
      {tag && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-cyan-300"
        >
          {tag}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.08 }}
        className="mt-4 font-display text-3xl font-bold text-white md:text-4xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.16 }}
          className="mt-3 text-slate-400"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}