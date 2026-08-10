import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, AlertTriangle, Trophy, Info, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// آیکون و رنگ بر اساس نوع اعلان
const TYPE_META = {
  warning:     { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/15' },
  achievement: { icon: Trophy,        color: 'text-amber-400',   bg: 'bg-amber-500/15' },
  system:      { icon: Info,          color: 'text-cyan-400',    bg: 'bg-cyan-500/15' },
  private:     { icon: MessageSquare, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15' },
  public:      { icon: Bell,          color: 'text-slate-300',   bg: 'bg-white/10' },
};

// فرمت زمان نسبی فارسی
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

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const containerRef = useRef(null);

  const unreadCount = items.filter((n) => !n.read).length;

  // بارگذاری اعلانات (خصوصی + عمومی)
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setItems(data);
    };
    load();
  }, [user?.id]);

  // Realtime برای اعلانات جدید
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('notif-bell-' + user.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload?.new;
          if (n && (n.user_id === user.id || n.user_id === null)) {
            setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  // ✅ بستن با Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  // خواندن یک اعلان
  const markRead = async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  // خواندن همه
  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from('notifications')
      .update({ read: true })
      .or(`user_id.eq.${user.id},user_id.is.null`);
  };

  if (!user) return null;

  return (
    <>
      {/* 🛡️ Overlay نامرئی — با کلیک روی آن dropdown بسته می‌شود */}
      {open && (
        <div
          className="fixed inset-0 z-[998]"
          onClick={() => setOpen(false)}
        />
      )}

      <div ref={containerRef} className="relative">
        {/* دکمه زنگوله */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          title="اعلانات"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              {unreadCount > 9 ? '۹+' : unreadCount.toLocaleString('fa-IR')}
            </span>
          )}
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="glass-strong absolute right-0 top-12 z-[999] w-80 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              {/* هدر */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="font-display text-sm font-bold text-white">🔔 اعلانات</p>
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
              <div className="max-h-[380px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-sm text-slate-400">هیچ اعلانی نداری</p>
                  </div>
                ) : (
                  items.map((n) => {
                    const meta = TYPE_META[n.type] || TYPE_META.public;
                    const Icon = meta.icon;
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-right transition hover:bg-white/5 ${
                          n.read ? 'opacity-60' : ''
                        }`}
                      >
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.bg}`}>
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
                        {!n.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                        )}
                      </button>
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