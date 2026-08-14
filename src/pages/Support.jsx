import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Inbox, ChevronDown, HelpCircle, Headphones, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const statusMap = {
  open: { label: 'باز', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  admin_replied: { label: 'پاسخ داده شد', cls: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' },
  closed: { label: 'بسته شده', cls: 'border-white/10 bg-white/5 text-slate-500' },
};

const categories = [
  { id: 'general', label: '🌐 عمومی' },
  { id: 'bug', label: '🐞 گزارش باگ' },
  { id: 'payment', label: '💳 پرداخت و خرید' },
  { id: 'account', label: '👤 مشکل اکانت' },
  { id: 'suggestion', label: '💡 پیشنهاد' },
];

/* ─────────── Support v7 — SUPPORT TERMINAL ─────────── */
export default function Support() {
  const { user } = useAuth();
  const { tickets, loading, createTicket, replyToTicket } = useTickets(user?.id, false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setMsg('❌ عنوان و متن را پر کنید');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setBusy(true);
    const res = await createTicket({ subject: subject.trim(), message: message.trim(), category });
    if (res.ok) {
      setMsg('✅ تیکت با موفقیت ثبت شد');
      setSubject(''); setMessage(''); setCategory('general');
    } else {
      setMsg('❌ ' + res.error);
    }
    setBusy(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleReply = async (ticketId) => {
    if (!reply.trim()) return;
    setBusy(true);
    const res = await replyToTicket(ticketId, reply.trim(), false);
    if (res.ok) setReply('');
    else setMsg('❌ ' + res.error);
    setBusy(false);
  };

  const inputCls = 'w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-fuchsia-400/50';
  const labelCls = 'mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500';

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
          92% { text-shadow: -2px 0 #e879f9, 2px 0 #22d3ee; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #e879f9, -2px 0 #22d3ee; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
        }
      `}</style>

      {/* ─────────── صحنه ─────────── */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-x-0 bottom-0 h-[42vh]"
          style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="mb-10 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Support // Terminal
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            SUPPORT <span className="text-gradient">HUB</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500">سوال یا مشکلی داری؟ تیکت بفرست تا ادمین‌ها بررسی کنند.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* ─────────── فرم ثبت تیکت ─────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className={cn('relative border border-fuchsia-400/25 bg-[#070b18]/85 p-6 backdrop-blur-xl lg:sticky lg:top-24', CLIP)}>
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
              <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />
              <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" style={{ animation: 'scanY 5s linear infinite' }} />

              <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
                <HelpCircle className="h-5 w-5 text-fuchsia-400" />
                <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-white">ثبت تیکت جدید</h2>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className={labelCls}>دسته‌بندی</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} style={{ colorScheme: 'dark' }}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>عنوان</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثلاً: مشکل در ورود به اکانت"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>متن پیام</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    placeholder="مشکل یا سوال خود را کامل توضیح دهید..."
                    className={cn(inputCls, 'resize-none')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className={cn('flex w-full items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_26px_rgba(232,121,249,0.35)] transition-all hover:shadow-[0_0_40px_rgba(232,121,249,0.55)] disabled:opacity-50', CLIP_SM)}
                >
                  {busy ? '⏳ در حال ارسال...' : (<><Send size={14} /> ارسال تیکت</>)}
                </button>
                <AnimatePresence>
                  {msg && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn('text-center text-xs font-bold', msg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400')}
                    >
                      {msg}
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>

          {/* ─────────── لیست تیکت‌ها ─────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className={cn('relative border border-cyan-400/25 bg-[#070b18]/85 p-6 backdrop-blur-xl', CLIP)}>
              <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-cyan-400/60" />

              <h2 className="mb-5 flex items-center justify-between border-b border-white/10 pb-3 font-display text-sm font-black uppercase tracking-[0.2em] text-white">
                <span className="flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-cyan-300" /> تیکت‌های من
                </span>
                <span className={cn('border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300', CLIP_SM)}>
                  {tickets.length}
                </span>
              </h2>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="relative h-16 overflow-hidden rounded-md bg-white/5">
                      <span className="absolute inset-0" style={{ animation: 'shimmer 1.4s infinite', background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.12), transparent)' }} />
                    </div>
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-14 text-center text-slate-400">
                  <Inbox className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  هنوز تیکتی ثبت نکرده‌ای
                </div>
              ) : (
                <div className="chat-scroll max-h-[700px] space-y-3 overflow-y-auto pl-2">
                  {tickets.map((t) => {
                    const isOpen = selected?.id === t.id;
                    const replies = [...(t.replies || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    const st = statusMap[t.status] || statusMap.open;
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('relative border bg-white/5 transition-all', CLIP_SM, isOpen ? 'border-cyan-400/40' : 'border-white/10')}
                      >
                        <button
                          onClick={() => setSelected(isOpen ? null : t)}
                          className="flex w-full flex-wrap items-center gap-3 p-4 text-right"
                        >
                          <span className={cn('border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-slate-400', CLIP_SM)}>
                            {categories.find((c) => c.id === t.category)?.label || t.category}
                          </span>
                          <span className="flex-1 truncate text-sm font-bold text-white">{t.subject}</span>
                          <span className={cn('border px-2 py-0.5 text-[9px] font-bold', CLIP_SM, st.cls)}>{st.label}</span>
                          <ChevronDown size={16} className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-white/10"
                            >
                              <div className="p-4">
                                {/* پیام اصلی */}
                                <div className="rounded-md border border-white/10 bg-black/30 p-3 text-sm text-slate-200 whitespace-pre-wrap">
                                  {t.message}
                                </div>
                                <p className="mt-2 text-[10px] text-slate-500">{new Date(t.created_at).toLocaleString('fa-IR')}</p>

                                {/* گفتگو */}
                                <div className="chat-scroll mt-4 max-h-60 space-y-2 overflow-y-auto">
                                  {replies.map((r) => (
                                    <motion.div
                                      key={r.id}
                                      initial={{ opacity: 0, x: r.is_admin ? 10 : -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className={cn(
                                        'rounded-md p-3 text-sm',
                                        CLIP_SM,
                                        r.is_admin
                                          ? 'mr-4 border border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-100'
                                          : 'ml-4 border border-cyan-400/20 bg-cyan-400/5 text-slate-200'
                                      )}
                                    >
                                      <p className="mb-1 flex items-center gap-1 text-[10px] opacity-70">
                                        {r.is_admin ? (<><Headphones size={10} /> پشتیبانی</>) : '🎮 شما'}
                                        {' • '}
                                        {new Date(r.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      <p className="whitespace-pre-wrap">{r.message}</p>
                                    </motion.div>
                                  ))}
                                </div>

                                {/* پاسخ */}
                                {t.status !== 'closed' ? (
                                  <div className="mt-4 flex gap-2">
                                    <input
                                      value={reply}
                                      onChange={(e) => setReply(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleReply(t.id)}
                                      placeholder="پاسخ شما به پشتیبانی..."
                                      className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
                                    />
                                    <button
                                      disabled={busy}
                                      onClick={() => handleReply(t.id)}
                                      className={cn('grid h-10 w-10 place-items-center bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_22px_rgba(34,211,238,0.6)] disabled:opacity-50', CLIP_SM)}
                                    >
                                      <Send size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className={cn('mt-4 flex items-center justify-center gap-2 border border-white/10 bg-white/5 p-2.5 text-center text-xs text-slate-500', CLIP_SM)}>
                                    <Lock size={12} /> این تیکت بسته شده است
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}