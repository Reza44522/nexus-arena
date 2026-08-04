import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { botPool, initialMessages } from '../../data/chat';
import { cn } from '../../utils/cn';

let uid = 1000;

function MessageItem({ m }) {
  const time = m.time ? new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-2.5"
    >
      <div
        className={cn(
          'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-xs font-bold text-slate-950',
          m.avatar || 'from-slate-500 to-slate-700'
        )}
      >
        {m.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('font-display text-xs font-bold tracking-wide', m.color)}>{m.name}</span>
          {m.role === 'mod' && <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">MOD</span>}
          {m.role === 'vip' && <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">VIP</span>}
          {m.role === 'you' && <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">YOU</span>}
          <span className="text-[10px] text-slate-500">{time}</span>
        </div>
        <p className="break-words text-sm text-slate-200">{m.text}</p>
      </div>
    </motion.div>
  );
}

export default function LiveChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef(null);

  /* simulated incoming messages */
  useEffect(() => {
    const id = setInterval(() => {
      const base = botPool[Math.floor(Math.random() * botPool.length)];
      setMessages((prev) => [...prev.slice(-59), { ...base, id: uid++, time: new Date() }]);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  /* auto-scroll */
  useEffect(() => {
    const el = listRef.current;
    if (el && autoScroll) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  const send = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !user) return;
    setMessages((prev) => [
      ...prev.slice(-59),
      { id: uid++, name: user.name, color: 'text-cyan-300', avatar: 'from-cyan-400 to-blue-500', role: 'you', text: value, time: new Date() },
    ]);
    setText('');
    setAutoScroll(true);
  };

  return (
    <div className="glass-strong flex h-[32rem] flex-col overflow-hidden rounded-2xl lg:h-full">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-white">Live Chat</h3>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> 2.4k watching
        </span>
      </div>

      <div className="relative flex-1">
        <div ref={listRef} onScroll={handleScroll} className="chat-scroll absolute inset-0 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => (
            <MessageItem key={m.id} m={m} />
          ))}
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
            ↓ New messages
          </button>
        )}
      </div>

      {user ? (
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
              placeholder="Send a message…"
              maxLength={200}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:shadow-[0_0_16px_rgba(34,211,238,0.2)]"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!text.trim()}
              className="rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 px-4 font-display text-xs font-bold uppercase tracking-wider text-slate-950 shadow-glow-cyan disabled:opacity-40"
            >
              Send
            </motion.button>
          </div>
        </form>
      ) : (
        <div className="border-t border-white/10 p-4 text-center">
          <p className="mb-3 text-xs text-slate-400">Sign in to join the conversation</p>
          <Link
            to="/login"
            className="inline-block rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-slate-950"
          >
            Login to chat
          </Link>
        </div>
      )}
    </div>
  );
}