import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake, ScrollText, X, Check, Ban, Percent } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── Diplomacy — پیمان‌های تجاری بین اتحادها ─────────── */
export default function Diplomacy() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [alliances, setAlliances] = useState([]);
  const [my, setMy] = useState(null);
  const [treaties, setTreaties] = useState([]);
  const [showPropose, setShowPropose] = useState(false);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  const load = async () => {
    if (!user?.id) return;
    const [al, mm, tr] = await Promise.all([
      supabase.from('alliances').select('id, name, emblem'),
      supabase.from('alliance_members').select('role, alliance_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('treaties').select('*, a:alliances!treaties_alliance_a_fkey(name, emblem), b:alliances!treaties_alliance_b_fkey(name, emblem)').order('created_at', { ascending: false }),
    ]);
    setAlliances(al.data || []);
    setMy(mm.data || null);
    setTreaties(tr.data || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('diplomacy-' + user?.id + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treaties' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  const propose = async (targetId) => {
    setBusy(targetId);
    const { data, error } = await supabase.rpc('propose_treaty', { p_alliance_b: targetId });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('✅ پیشنهاد پیمان ارسال شد');
    setShowPropose(false);
    load();
  };

  const accept = async (id) => {
    setBusy(id);
    const { data, error } = await supabase.rpc('accept_treaty', { p_id: id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('🤝 پیمان تجاری فعال شد! ۱۰٪ تخفیف بازار برای اعضا');
    load();
  };

  const cancel = async (id) => {
    if (!window.confirm('پیمان لغو شود؟')) return;
    setBusy(id);
    const { data, error } = await supabase.rpc('cancel_treaty', { p_id: id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('✅ پیمان لغو شد');
    load();
  };

  const hasActive = treaties.some((t) => t.status === 'active' && (t.alliance_a === my?.alliance_id || t.alliance_b === my?.alliance_id));
  const isLeader = my?.role === 'leader';

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
          92% { text-shadow: -2px 0 #e879f9, 2px 0 #22d3ee; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #e879f9, -2px 0 #22d3ee; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[42vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
      </div>

      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM)}>{notice}</motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
              Diplomacy // Trade Pacts
            </p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
              پیمان‌های <span className="text-gradient">تجاری</span>
            </h1>
            <p className="mt-3 text-sm text-slate-500">با اتحاد دیگر پیمان ببند — اعضا ۱۰٪ تخفیف خرید بازار می‌گیرند!</p>
          </div>
          {my && isLeader && (
            <button onClick={() => setShowPropose(true)} className={cn('flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.4)]', CLIP_SM)}>
              <Handshake size={14} /> پیشنهاد پیمان
            </button>
          )}
        </div>

        {hasActive && (
          <div className={cn('mb-6 flex items-center gap-3 border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-300', CLIP)}>
            <Percent size={16} /> پیمان فعال داری! همه اعضای اتحادت ۱۰٪ تخفیف خرید و +۸٪ قیمت فروش در بازار دارند.
          </div>
        )}

        {!my ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-14 text-center text-slate-400', CLIP)}>
            برای دیپلماسی اول عضو یک اتحاد شو! 🤝
          </div>
        ) : treaties.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-14 text-center text-slate-400', CLIP)}>
            <ScrollText className="mx-auto mb-3 h-12 w-12 opacity-30" />
            هنوز پیمانی ثبت نشده — اولین پیمان تجاری تاریخ را تو امضا کن!
          </div>
        ) : (
          <div className="space-y-3">
            {treaties.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={cn('flex flex-wrap items-center gap-4 border p-4 backdrop-blur-xl', CLIP, t.status === 'active' ? 'border-emerald-400/40 bg-emerald-400/5' : t.status === 'pending' ? 'border-amber-400/40 bg-amber-400/5' : 'border-white/10 bg-white/5 opacity-70')}>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="text-xl">{t.a?.emblem}</span> {t.a?.name}
                  <Handshake size={14} className="mx-1 text-cyan-300" />
                  <span className="text-xl">{t.b?.emblem}</span> {t.b?.name}
                </div>
                <span className={cn('border px-2 py-0.5 text-[9px] font-black uppercase', CLIP_SM, t.status === 'active' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : t.status === 'pending' ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-500')}>
                  {t.status === 'active' ? 'فعال' : t.status === 'pending' ? 'در انتظار پذیرش' : 'لغوشده'}
                </span>
                <div className="ml-auto flex gap-2">
                  {t.status === 'pending' && isLeader && t.alliance_b === my.alliance_id && (
                    <button onClick={() => accept(t.id)} disabled={busy === t.id} className={cn('flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-2 text-[10px] font-black uppercase text-slate-950', CLIP_SM)}>
                      <Check size={12} /> پذیرش پیمان
                    </button>
                  )}
                  {t.status !== 'cancelled' && (isLeader || isAdmin) && (t.alliance_a === my.alliance_id || t.alliance_b === my.alliance_id || isAdmin) && (
                    <button onClick={() => cancel(t.id)} disabled={busy === t.id} className={cn('flex items-center gap-1 border border-red-400/40 bg-red-400/10 px-4 py-2 text-[10px] font-bold text-red-400', CLIP_SM)}>
                      <Ban size={12} /> لغو
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* مودال پیشنهاد */}
      <AnimatePresence>
        {showPropose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]" onClick={() => setShowPropose(false)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} onClick={(e) => e.stopPropagation()} className={cn('w-full max-w-md border border-cyan-400/40 bg-[#070b18]/95 p-6', CLIP)}>
              <div className="mb-4 flex items-center justify-between">
                <p className="flex items-center gap-2 font-display text-sm font-black text-white"><Handshake size={15} className="text-cyan-300" /> انتخاب اتحاد مقصد</p>
                <button onClick={() => setShowPropose(false)} className="grid h-7 w-7 place-items-center text-slate-500 hover:text-white"><X size={14} /></button>
              </div>
              <div className="chat-scroll max-h-72 space-y-2 overflow-y-auto">
                {alliances.filter((a) => a.id !== my?.alliance_id).map((a) => (
                  <button key={a.id} onClick={() => propose(a.id)} disabled={busy === a.id} className={cn('flex w-full items-center gap-3 border border-white/10 bg-white/5 p-3 text-right transition hover:border-cyan-400/50 hover:bg-cyan-400/10', CLIP_SM)}>
                    <span className="text-2xl">{a.emblem}</span>
                    <span className="flex-1 text-sm font-bold text-white">{a.name}</span>
                    <Handshake size={14} className="text-cyan-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}