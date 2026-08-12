import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/* ─────────── PageWrapper — NEXUS UI v6 ───────────
   ترنزیشن ورود صفحات: fade + rise + de-blur
   فاصله‌ی ایمن از Navbar ثابت (pt-16)
─────────────────────────────────────────────── */
export default function PageWrapper({ className, children, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative min-h-screen pt-16', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}