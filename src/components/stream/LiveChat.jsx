import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Send, Lock, LogIn, Radio } from 'lucide-react';
import { useAuth, getActiveRestriction } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { cn } from '../../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const roleColors = {
  admin: 'text-rose-300',
  mod: 'text-emerald-300',
  vip: 'text-amber-300',
  user: 'text-cyan-300',
};

const roleChips = {
  admin: 'border-rose-400/40 bg-rose-400/10 text-rose-300 shadow-[0_0_10px_rgba(248,113,113,0.3)]',
  mod: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]',
  vip: 'border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]',
};

const roleLabels = { admin: 'ADMIN', mod: 'MOD', vip: 'VIP' };

function MessageItem({ m }) {
  const time = new Date(m.created_at).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-2.5"
    >
      <div className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-slate-950', CLIP_SM)}>
        {m.username.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('font-display text-xs font-bold tracking-wide', roleColors[m.role] || 'text-cyan-300')}>
            {m.username}
          </span>
          {roleLabels[m.role] && (
            <span className={cn('border px-1.5 py-0.5 text-[8px] font-black tracking-widest', CLIP_SM, roleChips[m.role])}>
              {roleLabels[m.role]}
            </span>
          )}
          <span className="text-[10px] text-slate-500">{time}</span>
        </div>
        <p className="mt-0.5 break-words text-sm leading-6 text-slate-200">{m.message}</p>
      </div>
    </motion.div>
  );
}

/* ─────────── LiveChat v7 — ARENA CHAT ─────────── */
export default function LiveChat() {
  const { user, profile } = useAuth();
  const { messages, loading, sendMessage } = useChat(100);
  const [text, setText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef(null);

  // بررسی مسدودیت
  const restriction = getActiveRestriction(profile);
  const isBlocked = restriction === 'blocked' || restriction === 'banned';

  // اسکرول خودکار
  useEffect(() => {
    const el = listRef.current;
    if (el && autoScroll) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  const send = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !user || isBlocked) return;
    const res = await sendMessage(value, user, profile);
    if (res.ok) {
      setText('');
      setAutoScroll(true);
    } else {
      console.error('❌ خطا در ارسال:', res.error);
    }
  };

  return (
    <div className={cn('relative flex h-[32rem] flex-col overflow-hidden border border-cyan-400/30 bg-[#070b18]/90 backdrop-blur-2xl lg:h-full', CLIP)}>
      <style>{`
        @keyframes lcScan { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes lcBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
      `}</style>

      {/* خط اسکن + براکت‌ها */}
      <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" style={{ animation: 'lcScan 4.5s linear infinite' }} />
      <span className="pointer-events-none absolute left-2 top-2 z-10 h-3 w-3 border-l-2 border-t-2 border-cyan-400/60" />
      <span className="pointer-events-none absolute bottom-2 right-2 z-10 h-3 w-3 border-b-2 border-r-2 border-fuchsia-400/60" />

      {/* ─────────── هدر HUD ─────────── */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.3em] text-white">
          <Radio size={13} className="text-cyan-300" />
          Arena Chat
        </h3>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'lcBlink 1.4s infinite' }} />
          آنلاین
        </span>
      </div>

      {/* ─────────── پیام‌ها ─────────── */}
      <div className="relative flex-1">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="chat-scroll absolute inset-0 space-y-3 overflow-y-auto px-4 py-4"
        >
          {loading ? (
            <div className="grid place-items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              هنوز پیامی ارسال نشده. اولین نفر باش! 💬
            </p>
          ) : (
            messages.map((m) => <MessageItem key={m.id} m={m} />)
          )}
        </div>
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              const el = listRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            }}
            className={cn('absolute bottom-3 left-1/2 -translate-x-1/2 border border-cyan-400/40 bg-[#070b18]/95 px-3 py-1 text-[11px] font-bold text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.35)] backdrop-blur transition hover:bg-cyan-400/10', CLIP_SM)}
          >
            ↓ پیام‌های جدید
          </button>
        )}
      </div>

      {/* ─────────── پایین: سه حالت ─────────── */}
      {user && !isBlocked ? (
        <form onSubmit={send} className="space-y-2 border-t border-white/10 p-3">
          {/* ایموجی‌بار زاویه‌دار */}
          <div className="flex gap-1.5">
            {['🔥', 'GG', '😂', '', '💜'].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setText((t) => `${t}${t ? ' ' : ''}${em}`)}
                className={cn('border border-white/10 bg-white/5 px-2 py-1 text-xs transition hover:border-cyan-400/40 hover:bg-cyan-400/10', CLIP_SM)}
              >
                {em}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="پیامی بنویسید…"
              maxLength={500}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!text.trim()}
              className={cn('grid w-12 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_26px_rgba(34,211,238,0.6)] disabled:opacity-40', CLIP_SM)}
            >
              <Send size={15} />
            </motion.button>
          </div>
        </form>
      ) : isBlocked ? (
        <div className="border-t border-white/10 p-4 text-center">
          <p className={cn('flex items-center justify-center gap-2 border border-red-400/30 bg-red-400/10 p-2.5 text-xs font-bold text-red-400', CLIP_SM)}>
            <Lock size={12} /> شما از چت مسدود شده‌اید
          </p>
          {profile?.restrict_reason && (
            <p className="mt-2 text-[10px] text-slate-500">دلیل: {profile.restrict_reason}</p>
          )}
          {profile?.restrict_until && (
            <p className="mt-1 text-[10px] text-slate-500">
              تا: {new Date(profile.restrict_until).toLocaleString('fa-IR')}
            </p>
          )}
        </div>
      ) : (
        <div className="border-t border-white/10 p-4 text-center">
          <p className="mb-3 text-xs text-slate-400">برای شرکت در چت وارد شوید</p>
          <Link
            to="/login"
            className={cn('inline-flex items-center gap-2 bg-gradient-to-br from-cyan-400 to-fuchsia-500 px-5 py-2 font-display text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_28px_rgba(34,211,238,0.6)]', CLIP_SM)}
          >
            <LogIn size={13} /> ورود به چت
          </Link>
        </div>
      )}
    </div>
  );
}