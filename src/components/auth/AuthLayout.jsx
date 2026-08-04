import { motion } from 'framer-motion';
import PageWrapper from '../ui/PageWrapper';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <PageWrapper>
      <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-7xl items-center justify-center px-4 pb-12">
        {/* decorative orbs */}
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong relative w-full max-w-md rounded-3xl p-8 shadow-[0_0_80px_rgba(34,211,238,0.12)]"
        >
          <header className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-display text-2xl font-black text-slate-950 shadow-glow-cyan">
              N
            </div>
            <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </header>
          {children}
        </motion.div>
      </div>
    </PageWrapper>
  );
}