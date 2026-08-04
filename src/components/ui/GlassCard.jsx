import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function GlassCard({ children, className, hover = false, ...rest }) {
  return (
    <motion.div
      {...(hover
        ? { whileHover: { y: -6, transition: { type: 'spring', stiffness: 300, damping: 22 } } }
        : {})}
      className={cn(
        'glass rounded-2xl',
        hover &&
          'transition-shadow duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]',
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}