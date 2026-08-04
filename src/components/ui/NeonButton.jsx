import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const variants = {
  primary:
    'bg-cyan-400/90 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)] hover:shadow-[0_0_44px_rgba(34,211,238,0.7)]',
  secondary:
    'bg-fuchsia-500/90 text-white shadow-[0_0_24px_rgba(217,70,239,0.4)] hover:shadow-[0_0_44px_rgba(217,70,239,0.65)]',
  ghost: 'glass text-cyan-200 hover:border-cyan-400/40 hover:bg-white/10',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function NeonButton({ children, variant = 'primary', size = 'md', className, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-display font-semibold uppercase tracking-wider transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}