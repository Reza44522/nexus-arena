import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Flag, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePrivateChat } from '../../hooks/usePrivateChat';
import { cn } from '../../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── PrivateChatModal v7 — PRIVATE CHANNEL ─────────── */
export default function PrivateChatModal({ friend, onClose, onReport }) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = usePrivateChat(user?.id, friend?.id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setSendError('');
    const res = await sendMessage(text.trim());
    if (res.ok) {
      setText('');
    } else {
      setSendError(res.error || 'خطا در ارسال پیام');
    }
    setSending(false);
  };

  const displayName = friend?.username || 'کاربر';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <style>{`
        @keyframes pcmScan { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes pcmBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
      `}</style>

      <motion.div
        initial={{ opacity: 0, rotateX: -70, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
        exit={{ opacity: 0, rotateX: -60, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
        onClick={(e) => e.stopPropagation()}
        className={cn('relative flex h-[600px] w-full max-w-lg flex-col overflow-hidden border border-cyan-400/40 bg-[#070b18]/95 shadow-[0_0_70px_rgba(34,211,238,0.3)] backdrop-blur-2xl', CLIP)}
      >
        {/* خط اسکن + براکت‌ها */}
        <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" style={{ animation: 'pcmScan 4s linear infinite' }} />
        <span className="pointer-events-none absolute left-2 top-2 z-10 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
        <span className="pointer-events-none absolute bottom-2 right-2 z-10 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/60" />

        {/* ─────────── هدر HUD ─────────── */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute inset-0 rounded-lg bg-cyan-400/25 blur-[8px]" />
              <div className={cn('relative grid h-10 w-10 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-bold text-slate-950', CLIP_SM)}>
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <p className="font-display font-bold text-white">{displayName}</p>
              <p className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" style={{ animation: 'pcmBlink 1.4s infinite' }} />
                Private Channel // Encrypted
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onReport && (
              <button
                onClick={onReport}
                title="Report"
                className={cn('grid h-9 w-9 place-items-center border border-white/10 bg-white/5 text-red-400 transition hover:border-red-400/40 hover:bg-red-500/10', CLIP_SM)}
              >
                <Flag size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className={cn('grid h-9 w-9 place-items-center border border-white/10 bg-white/5 text-slate-400 transition hover:border-white/30 hover:text-white', CLIP_SM)}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ─────────── پیام‌ها ─────────── */}
        <div ref={listRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="grid h-full place-items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center">
              <Lock className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-500">هنوز پیامی رد و بدل نشده. اولین پیام را بفرست! 💬</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.from_user_id === user?.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[75%] px-4 py-2.5 text-sm shadow-lg',
                      CLIP_SM,
                      isMine
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_16px_rgba(34,211,238,0.25)]'
                        : 'border border-white/10 bg-white/10 text-slate-100'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content || m.message || ''}</p>
                    <p className={cn('mt-1 text-[10px] opacity-70', isMine ? 'text-left' : 'text-right')}>
                      {new Date(m.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* خطای ارسال */}
        {sendError && (
          <div className={cn('mx-4 mb-2 border border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-xs text-red-400', CLIP_SM)}>
            ❌ {sendError}
          </div>
        )}

        {/* ─────────── فرم ارسال ─────────── */}
        <form onSubmit={handleSend} className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="پیامی بنویس..."
              maxLength={1000}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!text.trim() || sending}
              className={cn('grid h-10 w-10 shrink-0 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_26px_rgba(34,211,238,0.6)] disabled:opacity-40', CLIP_SM)}
            >
              <Send size={16} />
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}