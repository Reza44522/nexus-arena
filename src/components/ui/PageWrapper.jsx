import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function PageWrapper({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('min-h-screen pt-28', className)}
    >
      {children}
    </motion.div>
  );
}