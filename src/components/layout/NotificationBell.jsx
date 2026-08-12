import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, AlertTriangle, Trophy, Info, MessageSquare, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

/* آیکون و رنگ بر اساس نوع اعلان */
const TYPE_META = {
  warning: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15', glow: 'shadow-[0_0_14px_rgba(248,113,113,0.25)]' },
  achievement: { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/15', glow: 'shadow-[0_0_14px_rgba(251,191,36,0.25)]' },
  system: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/15', glow: 'shadow-[0_0_14px_rgba(34,211,238,0.25)]' },
  private: { icon: MessageSquare, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15', glow: 'shadow-[0_0_14px_rgba(232,121,249,0.25)]' },
  public: { icon: Megaphone, color: 'text-slate-300', bg: 'bg-white/10', glow: '' },
};

/* فرمت زمان نسبی فارسی */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'همین الان';
  if (mins < 60) return `${mins.toLocaleString('fa-IR')} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours.toLocaleString('fa-IR')} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days.toLocaleString('fa-IR')} روز پیش`;
  return new Date(dateStr).toLocaleDateString('fa-IR');
}

/* ─────────── NotificationBell — NEXUS UI v6 ───────────
   ✅ وضعیت خوانده‌شدن از جدول notification_reads (نه ستون read)
   - بستن با کلیک بیرون + Escape
   - Realtime برای اعلانات جدید
─────────────────────────────────────────────── */
export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const unreadCount = items.filter((n) => !readIds.has(n.id)).length;

  /* بارگذاری اعلانات + وضعیت خوانده‌شدن */
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const load = async () => {
      const [nRes, rRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('notification_reads').select('notification_id').eq('user_id', user.id),
      ]);
      if (cancelled) return;
      setItems(nRes.data || []);
      setReadIds(new Set((rRes.data || []).map((r) => r.notification_id)));
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /* Realtime برای اعلانات جدید */
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('notif-bell-' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload?.new;
        if (n && (n.user_id === user.id || n.user_id === null)) {
          setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  /* ✅ بستن با Escape */
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  /* خواندن یک اعلان → ثبت در notification_reads */
  const markRead = async (id) => {
    if (readIds.has(id)) return;
    setReadIds((prev) => new Set(prev).add(id));
    await supabase.from('notification_reads').insert({ notification_id: id, user_id: user.id });
  };

  /* خواندن همه */
  const markAllRead = async () => {
    const unread = items
      .filter((n) => !readIds.has(n.id))
      .map((n) => ({ notification_id: n.id, user_id: user.id }));
    if (!unread.length) return;
    setReadIds(new Set(items.map((n) => n.id)));
    await supabase.from('notification_reads').insert(unread);
  };

  if (!user) return null;

  return (
    <>
      {/* 🛡️ Overlay نامرئی — با کلیک روی آن dropdown بسته می‌شود */}
      {open && <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />}

      <div ref={containerRef} className="relative">
        {/* دکمه زنگوله با هاله نئونی */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white',
            unreadCount > 0 && 'border-cyan-400/40 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.3)]'
          )}
          title="اعلانات"
        >
          <Bell size={16} className={cn(unreadCount > 0 && 'animate-[hud-pulse_1.6s_ease-in-out_infinite]')} />
          {unreadCount > 0 && (
            <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]">
              {unreadCount > 9 ? '۹+' : unreadCount.toLocaleString('fa-IR')}
            </span>
          )}
        </button>

        {/* Dropdown شیشه‌ای */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute right-0 top-12 z-[999] w-80 overflow-hidden rounded-2xl"
            >
              {/* هدر */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="flex items-center gap-2 font-display text-sm font-bold text-white">
                  <Bell size={14} className="text-cyan-300" />
                  اعلانات
                  {unreadCount > 0 && (
                    <span className="rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      {unreadCount.toLocaleString('fa-IR')} جدید
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 rounded-lg bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                    >
                      <CheckCheck size={12} />
                      خواندن همه
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    title="بستن"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* لیست */}
              <div className="chat-scroll max-h-[380px] overflow-y-auto">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-16 w-full" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/5">
                      <Bell size={26} className="text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400">هیچ اعلانی نداری</p>
                  </div>
                ) : (
                  items.map((n, i) => {
                    const meta = TYPE_META[n.type] || TYPE_META.public;
                    const Icon = meta.icon;
                    const isRead = readIds.has(n.id);
                    return (
                      <motion.button
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          'flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-right transition hover:bg-white/5',
                          isRead && 'opacity-55'
                        )}
                      >
                        <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', meta.bg, meta.glow)}>
                          <Icon size={15} className={meta.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{n.message}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {timeAgo(n.created_at)}
                            {n.sender_name ? ` • ${n.sender_name}` : ''}
                          </p>
                        </div>
                        {!isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}