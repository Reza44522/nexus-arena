import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Send, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── AllianceChat — کانال ارتباطی اتحاد ─────────── */
export default function AllianceChat() {
  const { user, profile } = useAuth();
  const [my, setMy] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('alliance_members').select('role, alliance:alliances(id, name, emblem)').eq('user_id', user.id).maybeSingle();
    setMy(data || null);
    if (data?.alliance?.id) {
      const { data: m } = await supabase.from('alliance_messages').select('*').eq('alliance_id', data.alliance.id).order('created_at').limit(120);
      setMsgs(m || []);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('alliance-chat-' + user?.id + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alliance_messages' }, (p) => {
        setMsgs((prev) => (prev.some((x) => x.id === p.new.id) ? prev : [...prev, p.new]));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const m = text.trim();
    if (!m || !my?.alliance?.id || busy) return;
    setBusy(true);
    const { error } = await supabase.from('alliance_messages').insert({
      alliance_id: my.alliance.id, user_id: user.id,
      username: profile?.username || '—', message: m,
    });
    setBusy(false);
    if (!error) setText('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
      `}</style>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[42vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(rgba(52,211,153,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.5) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-emerald-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Alliance Comms // Encrypted
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-white md:text-4xl">
            {my?.alliance ? <>کانال اتحاد {my.alliance.emblem} <span className="text-gradient">{my.alliance.name}</span></> : 'چت اتحاد'}
          </h1>
        </div>

        {!my?.alliance ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-14 text-center text-slate-400', CLIP)}>
            <Lock className="mx-auto mb-3 h-10 w-10 opacity-30" />
            فقط اعضای اتحاد دسترسی دارند — اول به یک اتحاد بپیوند! 🤝
          </div>
        ) : (
          <div className={cn('flex h-[62vh] flex-col border border-emerald-400/25 bg-[#0a0c08]/90 backdrop-blur-xl', CLIP)}>
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Radio size={14} className="text-emerald-300" />
              <p className="text-xs font-bold text-slate-300">کانال رمزنگاری‌شده‌ی فرماندهی — فقط اعضای تو می‌بینند</p>
            </div>
            <div className="chat-scroll flex-1 space-y-2.5 overflow-y-auto p-4">
              {msgs.length === 0 && <p className="py-10 text-center text-xs text-slate-600">هنوز پیامی نیست — اولین فرمان را صادر کن! 📡</p>}
              {msgs.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('max-w-[80%] border p-3', CLIP_SM, m.user_id === user.id ? 'ml-auto border-emerald-400/30 bg-emerald-400/10' : 'border-white/10 bg-white/5')}>
                  <p className="flex items-center gap-2 text-[9px] text-slate-500">
                    <span className={cn('font-black', m.user_id === user.id ? 'text-emerald-300' : 'text-cyan-300')}>{m.username}</span>
                    {new Date(m.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">{m.message}</p>
                </motion.div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t border-white/10 p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="پیام به متحدین..."
                maxLength={500}
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-400/50"
              />
              <button onClick={send} disabled={busy || !text.trim()} className={cn('grid h-12 w-12 place-items-center bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.4)] transition-all hover:shadow-[0_0_28px_rgba(52,211,153,0.6)] disabled:opacity-40', CLIP_SM)}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}