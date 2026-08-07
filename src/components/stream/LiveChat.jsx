import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth, getActiveRestriction } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { cn } from '../../utils/cn';

const roleColors = {
  admin: 'text-rose-300',
  mod: 'text-emerald-300',
  vip: 'text-amber-300',
  user: 'text-cyan-300',
};

const roleLabels = {
  admin: 'ADMIN',
  mod: 'MOD',
  vip: 'VIP',
};

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
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-xs font-bold text-slate-950">
        {m.username.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('font-display text-xs font-bold tracking-wide', roleColors[m.role] || 'text-cyan-300')}>
            {m.username}
          </span>
          {roleLabels[m.role] && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold">
              {roleLabels[m.role]}
            </span>
          )}
          <span className="text-[10px] text-slate-500">{time}</span>
        </div>
        <p className="break-words text-sm text-slate-200">{m.message}</p>
      </div>
    </motion.div>
  );
}

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

  // ✅ تابع ارسال با خطوط debug
  const send = async (e) => {
    e.preventDefault();
    const value = text.trim();

    // 🔍 DEBUG: بررسی شرایط
    console.log('🔍 بررسی شرایط ارسال:', {
      متن: value,
      لاگین: !!user,
      مسدود: isBlocked,
    });

    if (!value || !user || isBlocked) {
      console.log('❌ شرایط ارسال برقرار نیست!');
      return;
    }

    console.log('🚀 در حال ارسال پیام به Supabase...');
    const res = await sendMessage(value, user, profile);
    console.log('📨 نتیجه ارسال:', res);

    if (res.ok) {
      console.log('✅ پیام با موفقیت ارسال شد');
      setText('');
      setAutoScroll(true);
    } else {
      console.error('❌ خطا در ارسال:', res.error);
    }
  };

  return (
    <div className="glass-strong flex h-[32rem] flex-col overflow-hidden rounded-2xl lg:h-full">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-white">Live Chat</h3>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          آنلاین
        </span>
      </div>

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
            className="glass absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] text-cyan-300 shadow hover:bg-white/10"
          >
            ↓ پیام‌های جدید
          </button>
        )}
      </div>

      {/* پایین: سه حالت (فرم / مسدود / ورود) */}
      {user && !isBlocked ? (
        <form onSubmit={send} className="space-y-2 border-t border-white/10 p-3">
          <div className="flex gap-1.5">
            {['🔥', 'GG', '😂', '⚡', '💜'].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setText((t) => `${t}${t ? ' ' : ''}${em}`)}
                className="glass rounded-lg px-2 py-1 text-xs transition hover:bg-white/10"
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
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:shadow-[0_0_16px_rgba(34,211,238,0.2)]"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!text.trim()}
              className="rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 px-4 font-display text-xs font-bold uppercase tracking-wider text-slate-950 shadow-glow-cyan disabled:opacity-40"
            >
              ارسال
            </motion.button>
          </div>
        </form>
      ) : isBlocked ? (
        <div className="border-t border-white/10 p-4 text-center">
          <p className="text-xs font-bold text-rose-400">🔒 شما از چت مسدود شده‌اید</p>
          {profile?.restrict_reason && (
            <p className="mt-1 text-[10px] text-slate-500">دلیل: {profile.restrict_reason}</p>
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
            className="inline-block rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-slate-950"
          >
            ورود به چت
          </Link>
        </div>
      )}
    </div>
  );
}