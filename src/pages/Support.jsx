import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Inbox, ChevronDown, HelpCircle } from 'lucide-react';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import NeonButton from '../components/ui/NeonButton';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import { cn } from '../utils/cn';

const statusMap = {
  open: { label: 'باز', color: 'amber' },
  admin_replied: { label: 'پاسخ داده شد', color: 'cyan' },
  closed: { label: 'بسته شده', color: 'slate' },
};

const categories = [
  { id: 'general', label: '🌐 عمومی' },
  { id: 'bug', label: '🐞 گزارش باگ' },
  { id: 'payment', label: '💳 پرداخت و خرید' },
  { id: 'account', label: '👤 مشکل اکانت' },
  { id: 'suggestion', label: '💡 پیشنهاد' },
];

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
    else alert('❌ ' + res.error);
    setBusy(false);
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          tag="Support"
          title="پشتیبانی و تیکت"
          subtitle="سوال یا مشکلی داری؟ تیکت بفرست تا ادمین‌ها بررسی کنند."
        />

        <div className="grid gap-8 lg:grid-cols-5">
          {/* فرم ثبت تیکت جدید */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <GlassCard className="sticky top-24 p-6 border border-fuchsia-500/20">
              <div className="mb-5 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-fuchsia-400" />
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">
                  ثبت تیکت جدید
                </h2>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">دسته‌بندی</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">عنوان</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثلاً: مشکل در ورود به اکانت"
                    className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">متن پیام</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    placeholder="مشکل یا سوال خود را کامل توضیح دهید..."
                    className="glass w-full resize-none rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                  />
                </div>
                <NeonButton className="w-full" disabled={busy}>
                  <Send size={14} className="ml-2 inline" /> ارسال تیکت
                </NeonButton>
                <AnimatePresence>
                  {msg && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-sm text-cyan-300"
                    >
                      {msg}
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </GlassCard>
          </motion.div>

          {/* لیست تیکت‌های کاربر */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <GlassCard className="p-6 border border-cyan-500/20">
              <h2 className="mb-5 flex items-center justify-between font-display text-sm font-bold uppercase tracking-[0.25em] text-white">
                <span>🎫 تیکت‌های من</span>
                <Badge color="cyan">{tickets.length}</Badge>
              </h2>
              {loading ? (
                <div className="grid place-items-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Inbox className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  هنوز تیکتی ثبت نکرده‌ای
                </div>
              ) : (
                <div className="space-y-3 chat-scroll max-h-[700px] overflow-y-auto pr-1">
                  {tickets.map((t) => {
                    const isOpen = selected?.id === t.id;
                    const replies = [...(t.replies || [])].sort(
                      (a, b) => new Date(a.created_at) - new Date(b.created_at)
                    );
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'rounded-xl border bg-white/5 transition-all',
                          isOpen ? 'border-cyan-400/40' : 'border-white/10'
                        )}
                      >
                        <button
                          onClick={() => setSelected(isOpen ? null : t)}
                          className="flex w-full flex-wrap items-center gap-3 p-4 text-right"
                        >
                          <Badge color="slate">{categories.find(c => c.id === t.category)?.label || t.category}</Badge>
                          <span className="flex-1 truncate text-right text-sm font-bold text-white">{t.subject}</span>
                          <Badge color={statusMap[t.status]?.color || 'amber'}>
                            {statusMap[t.status]?.label || t.status}
                          </Badge>
                          <ChevronDown
                            size={16}
                            className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')}
                          />
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
                                <p className="rounded-lg bg-black/30 p-3 text-sm text-slate-200 whitespace-pre-wrap">{t.message}</p>
                                <p className="mt-2 text-[10px] text-slate-500">
                                  {new Date(t.created_at).toLocaleString('fa-IR')}
                                </p>

                                <div className="mt-4 space-y-2 chat-scroll max-h-60 overflow-y-auto">
                                  {replies.map((r) => (
                                    <motion.div
                                      key={r.id}
                                      initial={{ opacity: 0, x: r.is_admin ? 10 : -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className={cn(
                                        'rounded-lg p-3 text-sm',
                                        r.is_admin
                                          ? 'mr-4 border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100'
                                          : 'ml-4 bg-white/5 text-slate-200'
                                      )}
                                    >
                                      <p className="mb-1 text-[10px] opacity-70">
                                        {r.is_admin ? '👑 پشتیبانی' : '🎮 شما'}
                                        {' • '}
                                        {new Date(r.created_at).toLocaleTimeString('fa-IR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                      <p className="whitespace-pre-wrap">{r.message}</p>
                                    </motion.div>
                                  ))}
                                </div>

                                {t.status !== 'closed' && (
                                  <div className="mt-4 flex gap-2">
                                    <input
                                      value={reply}
                                      onChange={(e) => setReply(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleReply(t.id)}
                                      placeholder="پاسخ شما به پشتیبانی..."
                                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                                    />
                                    <NeonButton size="sm" disabled={busy} onClick={() => handleReply(t.id)}>
                                      <Send size={14} />
                                    </NeonButton>
                                  </div>
                                )}
                                {t.status === 'closed' && (
                                  <div className="mt-4 rounded-lg bg-slate-500/10 p-2 text-center text-xs text-slate-400">
                                    🔒 این تیکت بسته شده است
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
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}