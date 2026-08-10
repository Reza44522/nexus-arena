import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Badge from './ui/Badge';

export default function WarningAlert() {
  const { user, profile } = useAuth();
  const [warning, setWarning] = useState(null);
  const [info, setInfo] = useState(null);
  const audioRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const timerRef = useRef(null);

  const close = () => {
    setWarning(null);
    audioRef.current?.pause();
    audioRef.current = null;
    // ✅ اگه موزیک قبلاً در حال پخش بود، ادامه بده
    if (wasPlayingRef.current) {
      window.dispatchEvent(new CustomEvent('nexus-music-resume'));
    }
    wasPlayingRef.current = false;
  };

  const trigger = async (n) => {
    // ۱) موزیک در حال پخش بود؟
    wasPlayingRef.current = window.__NEXUS_MUSIC_PLAYING__ === true;

    // ۲) توقف موزیک
    window.dispatchEvent(new CustomEvent('nexus-music-pause'));

    // ۳) 🚨 صدای آژیر (فایل دلخواه تو: public/audio/warning-siren.mp3)
    try {
      audioRef.current?.pause();
      const a = new Audio('/audio/warning-siren.mp3');
      a.loop = true;
      a.volume = 0.9;
      audioRef.current = a;
      a.play().catch(() => {});
    } catch {}

    // ۴) مشخصات تازه‌ی کاربر
    const { data: prof } = await supabase
      .from('profiles')
      .select('username, level, warnings, xp')
      .eq('id', user.id)
      .single();
    setInfo(prof);

    // ۵) نمایش پاپ‌آپ
    setWarning(n);

    // ۶) بسته‌شدن خودکار بعد از ۱۰ ثانیه
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => close(), 10000);
  };

  // 📡 Realtime: فقط اخطارهای همین کاربر
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('warning-alert-' + user.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new?.type === 'warning') trigger(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timerRef.current);
      audioRef.current?.pause();
    };
  }, [user?.id]);

  return (
    <>
      <style>{`@keyframes stripe-move { to { background-position: 24px 0; } }`}</style>
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] grid place-items-center bg-black/80 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-red-500/60 bg-[#12060b]/95 shadow-[0_0_80px_rgba(239,68,68,0.5)]"
            >
              {/* نوار هشدار متحرک بالا */}
              <div className="absolute inset-x-0 top-0 h-1.5 animate-[stripe-move_1s_linear_infinite] bg-[repeating-linear-gradient(45deg,#ef4444_0,#ef4444_12px,#7f1d1d_12px,#7f1d1d_24px)]" />

              {/* پس‌زمینه‌ی تپنده */}
              <motion.div
                animate={{ opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.25),transparent_60%)]"
              />

              <button
                onClick={close}
                className="absolute left-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={15} />
              </button>

              <div className="relative p-7">
                {/* آژیر */}
                <div className="relative mx-auto mb-4 h-20 w-20">
                  <motion.span
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-red-500/40"
                  />
                  <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-red-500 to-rose-700 shadow-[0_0_40px_rgba(239,68,68,0.7)]">
                    <motion.div
                      animate={{ rotate: [0, -12, 12, -12, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >
                      <ShieldAlert className="h-9 w-9 text-white" />
                    </motion.div>
                  </div>
                </div>

                <h2 className="text-center font-display text-xl font-black text-red-400">
                  هشدار دریافت اخطار
                </h2>
                <p className="mt-1 text-center text-xs text-red-300/70">
                  ارسال‌کننده: {warning.sender_name || 'ادمین'}
                </p>

                {/* مشخصات کاربر */}
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-black text-slate-950">
                    {(info?.username || profile?.username || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {info?.username || profile?.username}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      سطح {info?.level ?? profile?.level ?? 1} • XP: {info?.xp ?? profile?.xp ?? 0}
                    </p>
                  </div>
                  <Badge color="red">⚠ {info?.warnings ?? profile?.warnings ?? 1} اخطار</Badge>
                </div>

                {/* متن اخطار */}
                <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                  {warning.message}
                </div>

                <p className="mt-3 text-center text-[10px] text-slate-500">
                  🔔 این اخطار به‌صورت دائم در بخش اعلانات شما ثبت شد.
                </p>

                {/* نوار شمارش ۱۰ ثانیه */}
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 10, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-red-500 to-amber-400"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}