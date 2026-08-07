import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils/cn';

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="اعلانات"
        className="glass relative grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition hover:text-cyan-300"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="glass-strong absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-white">اعلانات</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-cyan-300 hover:text-cyan-200">
                  خواندن همه
                </button>
              )}
            </div>
            <div className="chat-scroll max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">اعلانی ندارید</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5',
                      !n.is_read && 'bg-cyan-400/5'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{n.type === 'private' ? '📨' : '📢'}</span>
                      <p className={cn('flex-1 text-sm font-semibold', n.is_read ? 'text-slate-400' : 'text-white')}>
                        {n.title}
                      </p>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {n.sender_name} • {new Date(n.created_at).toLocaleString('fa-IR')}
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}