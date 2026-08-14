import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, BellRing } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── FriendMessagePopup ───────────
   وقتی دوستی که «اعلان» برایش روشن است پیام خصوصی بفرستد:
   ۱) پاپ‌آپ بسته ظاهر می‌شود (متن پنهان)
   ۲) بعد از انیمیشن، متن پیام باز می‌شود + صدا + دکمه باز کردن چت
─────────────────────────────────────────── */
export default function FriendMessagePopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [enabledIds, setEnabledIds] = useState(new Set());
  const enabledRef = useRef(new Set());
  const shownRef = useRef(new Set());
  const current = queue[0] || null;

  useEffect(() => {
    enabledRef.current = enabledIds;
  }, [enabledIds]);

  /* 🔊 صدا با ترفند Autoplay */
  const playSound = () => {
    try {
      const a = new Audio('/audio/notification.mp3');
      a.volume = 0.9;
      a.muted = true;
      a.play()
        .then(() => setTimeout(() => { a.muted = false; }, 120))
        .catch(() => {
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

  /* بارگذاری ترجیحات اعلان */
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from('friend_notifications')
        .select('friend_id, enabled')
        .eq('user_id', user.id);
      setEnabledIds(new Set((data || []).filter((r) => r.enabled).map((r) => r.friend_id)));
    };
    load();
  }, [user?.id]);

  /* 📡 Realtime پیام‌های خصوصی دریافتی */
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel('friend-msg-popup-' + user.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `to_user_id=eq.${user.id}` },
        async (payload) => {
          const m = payload?.new;
          if (!m || shownRef.current.has(m.id)) return;
                    if (!enabledRef.current.has(m.from_user_id)) return; // اعلان خاموش است
          // ✅ اگر کاربر الان با همین دوست داخل چت است، پاپ‌آپ نیاید — پیام فقط در چت
          if (window.__NEXUS_PRIVATE_CHAT_WITH__ === m.from_user_id) return;
          shownRef.current.add(m.id);
          let username = 'دوست تو';
          try {
            const { data: p } = await supabase.from('profiles').select('username').eq('id', m.from_user_id).single();
            if (p?.username) username = p.username;
          } catch {}
          setQueue((q) => [...q, { ...m, sender_name: username }]);
          playSound();
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user?.id]);

  /* 🎬 بعد از ورود کارت، متن با تأخیر باز شود */
  useEffect(() => {
    if (!current) return;
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 700);
    return () => clearTimeout(t);
  }, [current?.id]);

  const close = () => setQueue((q) => q.slice(1));
  const openChat = () => {
    close();
    navigate('/friends');
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="fmp-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[15000] grid place-items-center bg-black/55 px-4 backdrop-blur-[3px]"
          onClick={close}
        >
          <style>{`@keyframes fmpScan { 0% { top: -10%; } 100% { top: 110%; } } @keyframes fmpBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }`}</style>

          <motion.div
            key={current.id}
            initial={{ opacity: 0, rotateX: -80, scale: 0.85, y: 34 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, rotateX: -70, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
            onClick={(e) => e.stopPropagation()}
            className={cn('relative w-full max-w-md border border-fuchsia-400/40 bg-[#070b18]/95 shadow-[0_0_70px_rgba(232,121,249,0.35)] backdrop-blur-2xl', CLIP)}
          >
            <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent" style={{ animation: 'fmpScan 3s linear infinite' }} />
            <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
            <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5">
              <span className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.3em] text-fuchsia-300">
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" style={{ animation: 'fmpBlink 1.2s infinite' }} />
                Friend Message
              </span>
              <button onClick={close} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-white" title="بستن">
                <X size={14} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <span className="absolute inset-0 rounded-xl bg-fuchsia-400/25 blur-[10px]" />
                  <div className={cn('relative grid h-12 w-12 place-items-center bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-sm font-black text-slate-950', CLIP_SM)}>
                    {(current.sender_name || '?').slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-black text-white">{current.sender_name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-fuchsia-300">
                    <BellRing size={11} /> پیام خصوصی جدید داری!
                  </p>
                </div>
              </div>

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
                      className="mt-4 max-h-28 overflow-y-auto border-t border-white/10 pt-4 text-sm leading-6 text-slate-300"
                    >
                      {current.message || current.content || ''}
                    </motion.p>
                    <motion.button
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.28, duration: 0.4 }}
                      onClick={openChat}
                      className={cn('mt-4 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-2.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_24px_rgba(232,121,249,0.4)] transition-all hover:shadow-[0_0_36px_rgba(232,121,249,0.6)]', CLIP_SM)}
                    >
                      <MessageSquare size={14} />
                      باز کردن چت
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