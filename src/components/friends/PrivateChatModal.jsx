import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Flag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePrivateChat } from '../../hooks/usePrivateChat';
import { cn } from '../../utils/cn';

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
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-2xl"
      >
        {/* هدر */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-bold text-slate-950">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-display font-bold text-white">{displayName}</p>
              <p className="text-xs text-emerald-400">● Private Chat</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onReport && (
              <button
                onClick={onReport}
                title="Report"
                className="grid h-9 w-9 place-items-center rounded-full text-red-400 transition hover:bg-red-500/10"
              >
                <Flag size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* پیام‌ها */}
        <div ref={listRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="grid h-full place-items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              هنوز پیامی رد و بدل نشده. اولین پیام را بفرست! 💬
            </p>
          ) : (
            messages.map((m) => {
              const isMine = m.from_user_id === user?.id;
              return (
                <div key={m.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                      isMine
                        ? 'rounded-br-sm bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                        : 'rounded-bl-sm bg-white/10 text-slate-100'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content || m.message || ''}</p>
                    <p className="mt-1 text-right text-[10px] opacity-70">
                      {new Date(m.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* خطای ارسال (اگه باشه) */}
        {sendError && (
          <div className="border-t border-red-500/20 bg-red-500/10 px-5 py-2 text-center text-xs text-red-400">
            ❌ {sendError}
          </div>
        )}

        {/* فرم ارسال */}
        <form onSubmit={handleSend} className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="پیامی بنویس..."
              maxLength={1000}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!text.trim() || sending}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950 shadow-glow-cyan disabled:opacity-40"
            >
              <Send size={16} />
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}