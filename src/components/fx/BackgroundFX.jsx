import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function BackgroundFX() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 768px)').matches);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#05050e]" />
      <div className="bg-grid absolute inset-0 opacity-40" />

      {isMobile ? (
        /* ✅ موبایل: نورهای ثابت و سبک — بدون انیمیشن سنگین */
        <>
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-[70px]" />
          <div className="absolute -right-20 top-1/3 h-56 w-56 rounded-full bg-fuchsia-600/10 blur-[70px]" />
          <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-violet-600/10 blur-[70px]" />
        </>
      ) : (
        /* 💻 دسکتاپ: دایره‌های متحرک کامل */
        <>
          <motion.div
            className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-500/20 blur-[120px]"
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/15 blur-[120px]"
            animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-violet-600/15 blur-[120px]"
            animate={{ x: [0, 40, 0], y: [0, -40, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#05050e_100%)]" />
      {!isMobile && <div className="scanlines absolute inset-0 opacity-[0.05]" />}
    </div>
  );
}