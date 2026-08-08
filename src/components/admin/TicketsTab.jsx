import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Send, XCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import NeonButton from '../ui/NeonButton';
import { cn } from '../../utils/cn';

const statusMap = {
  open: { label: 'باز', color: 'amber' },
  admin_replied: { label: 'پاسخ داده شد', color: 'cyan' },
  closed: { label: 'بسته شده', color: 'slate' },
};

export default function TicketsTab() {
  const { user } = useAuth();
  const { tickets, loading, replyToTicket, updateStatus } = useTickets(user?.id, true);
  const [usernames, setUsernames] = useState({});
  const [openId, setOpenId] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  // گرفتن اسم کاربرها از روی user_id
  useEffect(() => {
    const ids = [...new Set(tickets.map((t) => t.user_id).filter(Boolean))];
    if (!ids.length) return;
    supabase
      .from('profiles')
      .select('id, username')
      .in('id', ids)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((p) => (map[p.id] = p.username));
        setUsernames(map);
      });
  }, [tickets]);

  const sendReply = async (ticketId) => {
    if (!reply.trim() || busy) return;
    setBusy(true);
    const res = await replyToTicket(ticketId, reply.trim(), true);
    if (!res.ok) alert('❌ ' + res.error);
    else setReply('');
    setBusy(false);
  };

  const closeTicket = async (ticketId) => {
    const res = await updateStatus(ticketId, 'closed');
    if (!res.ok) alert('❌ ' + res.error);
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">
          🎫 تیکت‌های کاربران
        </h2>
        <Badge color="cyan">{tickets.length} تیکت</Badge>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Inbox className="mx-auto mb-3 h-10 w-10 opacity-30" />
          هیچ تیکتی ثبت نشده است
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const isOpen = openId === t.id;
            const replies = [...(t.replies || [])].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/5"
              >
                {/* ردیف اصلی */}
                <button
                  onClick={() => setOpenId(isOpen ? null : t.id)}
                  className="flex w-full flex-wrap items-center gap-3 p-4 text-right"
                >
                  <span className="font-bold text-cyan-300">
                    {usernames[t.user_id] || 'کاربر'}
                  </span>
                  <span className="text-sm text-white">{t.subject}</span>
                  <Badge color="slate">{t.category || 'general'}</Badge>
                  <span className="mr-auto flex items-center gap-2">
                    <Badge color={statusMap[t.status]?.color || 'amber'}>
                      {statusMap[t.status]?.label || t.status}
                    </Badge>
                    <ChevronDown
                      size={16}
                      className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')}
                    />
                  </span>
                </button>

                {/* جزئیات باز‌شونده */}
                {isOpen && (
                  <div className="border-t border-white/10 p-4">
                    <p className="rounded-lg bg-black/30 p-3 text-sm text-slate-200">{t.message}</p>
                    <p className="mt-2 text-[10px] text-slate-500">
                      {new Date(t.created_at).toLocaleString('fa-IR')}
                    </p>

                    {/* پاسخ‌ها */}
                    <div className="mt-4 space-y-2">
                      {replies.map((r) => (
                        <div
                          key={r.id}
                          className={cn(
                            'rounded-lg p-3 text-sm',
                            r.is_admin
                              ? 'border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100'
                              : 'bg-white/5 text-slate-200'
                          )}
                        >
                          <p className="mb-1 text-[10px] opacity-70">
                            {r.is_admin ? '👑 ادمین' : '🎮 ' + (usernames[t.user_id] || 'کاربر')}
                            {' • '}
                            {new Date(r.created_at).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {r.message}
                        </div>
                      ))}
                    </div>

                    {/* فرم پاسخ ادمین */}
                    {t.status !== 'closed' && (
                      <div className="mt-4 flex gap-2">
                        <input
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="پاسخ به کاربر..."
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                        />
                        <NeonButton size="sm" disabled={busy} onClick={() => sendReply(t.id)}>
                          <Send size={14} />
                        </NeonButton>
                        <NeonButton size="sm" variant="ghost" onClick={() => closeTicket(t.id)}>
                          <XCircle size={14} />
                        </NeonButton>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}