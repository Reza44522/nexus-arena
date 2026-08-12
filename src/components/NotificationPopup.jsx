import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, MailOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/* ─────────── NotificationPopup — پیام هولولوگرافیک وسط صفحه ───────────
   سکانس: ظاهرشدن با انیمیشن تا-باز شو (متن پنهان) → باز شدن کارت →
   نمایش متن پیام + دکمه «خواندم»
   - 🔊 پخش خودکار صدا (ترفند muted + fallback اولین کلیک)
   - «خواندم» → بستن + ثبت خوانده‌شدن در notification_reads
   - همزمان در زنگوله اعلانات هم می‌نشیند
────────────────────────────────────────────────────────────────── */
export default function NotificationPopup() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const shownIdsRef = useRef(new Set());
  const current = queue[0] || null;

  /* 🔊 پخش خودکار صدا بدون نیاز به کلیک */
  const playSound = () => {
    try {
      const a = new Audio('/audio/notification.mp3');
      a.volume = 0.9;
      a.muted = true; // شروع بی‌صدا = مجاز از نظر Autoplay
      a.play()
        .then(() => {
          setTimeout(() => {
            a.muted = false;
            console.log('🔊 [NotificationPopup] صدا پخش شد');
          }, 120);
        })
        .catch((e) => {
          console.warn('🔇 [NotificationPopup] پخش خودکار ممکن نبود؛ با اولین کلیک...', e?.name);
          a.muted = false;
          const unlock = () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            a.play().catch(() => {});
          };
          window.addEventListener('pointerdown', unlock);
          window.addEventListener('keydown', unlock);
        });
    } catch {}
  };

  const push = useCallback((n) => {
    if (shownIdsRef.current.has(n.id)) return;
    shownIdsRef.current.add(n.id);
    setQueue((q) => [...q, n]);
    playSound();
  }, []);

  /* 📡 Realtime + بررسی پیام‌های خیلی اخیر هنگام ورود */
  useEffect(() => {
    if (!user?.id) return;

    const checkRecent = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'private')
        .order('created_at', { ascending: false })
        .limit(3);
      (data || []).forEach((n) => {
        const age = Date.now() - new Date(n.created_at).getTime();
        if (age < 60000) push(n);
      });
    };
    checkRecent();

    const channel = supabase
      .channel('notif-popup-' + user.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload?.new;
          if (n && n.type === 'private') push(n);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, push]);

  /* 🎬 وقتی پیام جدید جاری شد: اول کارت بسته، بعد از unfold متن باز شود */
  useEffect(() => {
    if (!current) return;
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 700);
    return () => clearTimeout(t);
  }, [current?.id]);

  /* ✅ خواندم → بستن + ثبت خوانده‌شدن */
  const markReadAndClose = async () => {
    if (!current) return;
    const n = current;
    setQueue((q) => q.slice(1));
    await supabase.from('notification_reads').insert({ notification_id: n.id, user_id: user.id });
  };

  /* ✖ بستن بدون خوانده‌کردن */
  const justClose = () => setQueue((q) => q.slice(1));

  return (
    <AnimatePresence>
      {current && (
        /* پس‌زمینه تاریک وسط‌صفحه — کلیک روی آن = بستن بدون خواندن */
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[15000] grid place-items-center bg-black/55 px-4 backdrop-blur-[3px]"
          onClick={justClose}
        >
          <style>{`@keyframes npScan { 0% { top: -10%; } 100% { top: 110%; } } @keyframes npBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }`}</style>

          {/* کارت پیام — انیمیشن تا-باز شو */}
          <motion.div
            key={current.id}
            initial={{ opacity: 0, rotateX: -80, scale: 0.85, y: 34 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, rotateX: -70, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md border border-cyan-400/40 bg-[#070b18]/95 shadow-[0_0_70px_rgba(34,211,238,0.4)] backdrop-blur-2xl [clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]"
          >
            {/* خط اسکن متحرک */}
            <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" style={{ animation: 'npScan 3s linear infinite' }} />
            {/* براکت‌های گوشه */}
            <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
            <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/60" />

            {/* نوار HUD بالا */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5">
              <span className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.3em] text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'npBlink 1.2s infinite' }} />
                Incoming Message
              </span>
              <button
                onClick={justClose}
                className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-white"
                title="بستن"
              >
                <X size={14} />
              </button>
            </div>

            {/* بدنه — مرحله ۱: مهر و عنوان (متن پنهان) */}
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <span className="absolute inset-0 rounded-xl bg-cyan-400/25 blur-[10px]" />
                  <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))]">
                    <MailOpen className="h-5 w-5 text-slate-950" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-500">
                    از طرف: <span className="font-bold text-fuchsia-300">{current.sender_name || 'مدیریت آرنا'}</span>
                  </p>
                  <h3 className="mt-0.5 font-display text-base font-black text-white">{current.title}</h3>
                </div>
              </div>

              {/* مرحله ۲: بعد از باز شدن کارت، متن + دکمه اسلاید می‌شوند */}
              <AnimatePresence>
                {revealed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <motion.p
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      className="mt-4 max-h-32 overflow-y-auto border-t border-white/10 pt-4 text-sm leading-6 text-slate-300"
                    >
                      {current.message}
                    </motion.p>
                    <motion.button
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.28, duration: 0.4 }}
                      onClick={markReadAndClose}
                      className="mt-4 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-2.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_36px_rgba(34,211,238,0.6)] [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]"
                    >
                      <CheckCheck size={14} />
                      خواندم
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}