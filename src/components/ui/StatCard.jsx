import { motion } from 'framer-motion';
import CountUp from './CountUp';
import { cn } from '../../utils/cn';

export default function StatCard({ icon, label, value, suffix = '', decimals = 0, accent = 'from-cyan-400 to-blue-500', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="glass group relative overflow-hidden rounded-2xl p-5"
    >
      <div
        className={cn(
          'absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40',
          accent
        )}
      />
      <div className="flex items-center gap-4">
        <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xl', accent)}>
          {icon}
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-white">
            <CountUp value={value} decimals={decimals} suffix={suffix} />
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}