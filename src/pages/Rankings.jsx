import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Banknote, Swords, Zap, Users, Shield, Search, Star, TrendingUp, Medal, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const CATS = [
  { id: 'xp', label: 'سطح و XP', icon: Star, get: (r) => r.xp || 0, fmt: (v) => fmtNum(v), sub: (r) => `سطح ${toFa(r.level || 1)}` },
  { id: 'wd', label: 'ثروتمندان', icon: Banknote, get: (r) => r.war_dollars || 0, fmt: (v) => fmtNum(v), sub: () => 'WD' },
  { id: 'wins', label: 'جنگ‌سالاران', icon: Swords, get: (r) => r.wins || 0, fmt: (v) => toFa(v), sub: (r) => `${toFa(r.losses || 0)} شکست` },
  { id: 'power', label: 'قدرت نظامی', icon: Zap, get: (r) => r.power || 0, fmt: (v) => fmtNum(v), sub: (r) => r.country?.name_fa || 'بدون کشور' },
  { id: 'pop', label: 'پرجمعیت‌ها', icon: Users, get: (r) => r.country?.population || 0, fmt: (v) => fmtNum(v), sub: (r) => r.country?.name_fa || '—' },
];
const PODIUM = [
  { i: 1, h: 'h-40', ring: 'border-amber-400/70 shadow-[0_0_50px_rgba(251,191,36,0.35)]', txt: 'text-amber-300', medal: '🥇' },
  { i: 0, h: 'h-28', ring: 'border-slate-300/50 shadow-[0_0_35px_rgba(203,213,225,0.25)]', txt: 'text-slate-300', medal: '🥈' },
  { i: 2, h: 'h-24', ring: 'border-orange-600/50 shadow-[0_0_35px_rgba(217,119,6,0.25)]', txt: 'text-orange-400', medal: '🥉' },
];

function useCountUp(target, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start = null; let raf;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      setV(Math.round((Number(target) || 0) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

/* ─────────── Rankings v2 — تالار رتبه‌های زنده ─────────── */
export default function Rankings() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [alliances, setAlliances] = useState([]);
  const [cat, setCat] = useState('xp');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [pR, cR, iR, mR, aR, amR] = await Promise.all([
      supabase.from('profiles').select('id, username, xp, level, war_dollars, role, is_owner').limit(500),
      supabase.from('player_countries').select('id, user_id, name_fa, flag, population').limit(500),
      supabase.from('military_inventory').select('country_id, power, qty').limit(3000),
      supabase.from('war_matches').select('attacker_country, defender_country, winner_country').eq('status', 'finished').limit(500),
      supabase.from('alliances').select('id, name, emblem').limit(100),
      supabase.from('alliance_members').select('user_id, alliance_id').limit(1000),
    ]);
    const countries = cR.data || [];
    const byUser = {};
    countries.forEach((c) => { byUser[c.user_id] = c; });
    const power = {};
    (iR.data || []).forEach((x) => { power[x.country_id] = (power[x.country_id] || 0) + Number(x.power) * x.qty; });
    const wins = {}; const losses = {};
    (mR.data || []).forEach((m) => {
      if (!m.winner_country) return;
      wins[m.winner_country] = (wins[m.winner_country] || 0) + 1;
      const l = m.winner_country === m.attacker_country ? m.defender_country : m.attacker_country;
      losses[l] = (losses[l] || 0) + 1;
    });
    const allById = {};
    (aR.data || []).forEach((a) => { allById[a.id] = { ...a, members: 0, power: 0, wins: 0 }; });
    (amR.data || []).forEach((mm) => {
      const a = allById[mm.alliance_id];
      if (!a) return;
      a.members += 1;
      const c = byUser[mm.user_id];
      if (c) { a.power += power[c.id] || 0; a.wins += wins[c.id] || 0; }
    });
    const userAll = {};
    (amR.data || []).forEach((mm) => { userAll[mm.user_id] = allById[mm.alliance_id]; });
    setRows((pR.data || []).map((p) => {
      const c = byUser[p.id];
      return { ...p, country: c || null, power: c ? power[c.id] || 0 : 0, wins: c ? wins[c.id] || 0 : 0, losses: c ? losses[c.id] || 0 : 0, alliance: userAll[p.id] || null };
    }));
    setAlliances(Object.values(allById).filter((a) => a.members > 0).sort((a, b) => b.power - a.power));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const C = CATS.find((x) => x.id === cat);
  const sorted = useMemo(() => [...rows].sort((a, b) => C.get(b) - C.get(a)), [rows, C]);
  const filtered = useMemo(() => (q.trim() ? sorted.filter((r) => (r.username || '').toLowerCase().includes(q.trim().toLowerCase()) || (r.country?.name_fa || '').includes(q.trim())) : sorted), [sorted, q]);
  const top10 = sorted.slice(0, 10);
  const maxV = Math.max(1, C.get(sorted[0] || {}));
  const myIndex = sorted.findIndex((r) => r.id === user?.id);
  const me = myIndex >= 0 ? sorted[myIndex] : null;
  const above = myIndex > 0 ? sorted[myIndex - 1] : null;
  const podium = [sorted[1], sorted[0], sorted[2]];

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-20 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes nxSpin { to { transform: rotate(360deg); } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes aurora { from { transform: translate3d(-30px,0,0) scale(1); } to { transform: translate3d(40px,20px,0) scale(1.12); } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(34,211,238,.5); transform: none; } 92% { text-shadow: -3px 0 #22d3ee, 3px 0 #e879f9; transform: translateX(2px); } 94% { text-shadow: 3px 0 #22d3ee, -3px 0 #e879f9; transform: translateX(-2px); } 96% { text-shadow: 0 0 26px rgba(34,211,238,.5); transform: none; } }
        @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
      `}</style>

      {/* صحنه اولترا */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[44vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.13]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,.4) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
        <div className="absolute -top-32 left-1/4 h-[360px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]" style={{ animation: 'aurora 9s ease-in-out infinite alternate' }} />
        <div className="absolute top-10 right-1/4 h-[300px] w-[440px] rounded-full bg-fuchsia-600/10 blur-[120px]" style={{ animation: 'aurora 11s ease-in-out infinite alternate-reverse' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'64\' viewBox=\'0 0 56 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 0L56 16v32L28 64 0 48V16z\' fill=\'none\' stroke=\'%2322d3ee\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '56px 64px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.6) 100%)' }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" style={{ animation: 'scanY 7s linear infinite' }} />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* هدر */}
        <div className="mb-8 text-center">
          <p className="mb-2 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.4em] text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" style={{ animation: 'blinkDot 1.6s infinite' }} /> HALL OF LEGENDS // فصل ۱۲
          </p>
          <h1 className="font-display text-4xl font-black text-white md:text-6xl" style={{ animation: 'glitch 4s infinite' }}>
            تالار <span className="text-gradient">رتبه‌ها</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-slate-400">برترین فرماندهان آرنا در ۵ دسته — زنده و لحظه‌ای</p>
        </div>

        {/* دسته‌ها + جستجو */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {CATS.map((t) => (
            <motion.button key={t.id} whileTap={{ scale: 0.92 }} whileHover={{ y: -2 }} onClick={() => setCat(t.id)} className={cn('relative flex items-center gap-2 border px-4 py-2.5 font-display text-[10px] font-black uppercase tracking-widest transition-all', CLIP_SM, cat === t.id ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white')}>
              <t.icon size={13} /> {t.label}
              {cat === t.id && <motion.span layoutId="rank-glow" className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-500" />}
            </motion.button>
          ))}
          <div className={cn('flex items-center gap-2 border border-white/10 bg-black/40 px-3 py-2', CLIP_SM)}>
            <Search size={13} className="text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی بازیکن / کشور..." className="w-40 bg-transparent text-xs text-white outline-none" />
          </div>
        </div>

        {/* کارت رتبه تو */}
        {me && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('mb-8 flex flex-wrap items-center gap-4 border border-fuchsia-400/40 bg-fuchsia-400/5 p-4', CLIP)}>
            <span className={cn('grid h-12 w-12 place-items-center border border-fuchsia-400/40 bg-fuchsia-400/10 font-display text-lg font-black text-fuchsia-300', CLIP_SM)}>#{toFa(myIndex + 1)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white">رتبه تو در «{C.label}»: {C.fmt(C.get(me))} {me.country?.flag || ''}</p>
              <p className="mt-1 text-[10px] text-slate-500">{above ? `تا رتبه قبلی (${above.username}): ${C.fmt(Math.max(0, C.get(above) - C.get(me)))} فاصله داری` : '👑 تو صدرنشینی!'}</p>
            </div>
            <TrendingUp size={18} className="text-fuchsia-300" />
          </motion.div>
        )}

        {/* ─────────── سکوی قهرمانی ─────────── */}
        <div className="mb-10 grid grid-cols-3 items-end gap-3 md:gap-6">
          {PODIUM.map((p, idx) => {
            const r = podium[idx];
            if (!r) return <div key={idx} className={cn('grid place-items-center border border-white/5 bg-white/5 text-xs text-slate-600', p.h, CLIP)}>خالی</div>;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12 }} className="relative">
                {p.i === 0 && (
                  <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-9 left-1/2 -translate-x-1/2 text-3xl drop-shadow-[0_0_14px_rgba(251,191,36,0.8)]">👑</motion.span>
                )}
                <div className={cn('relative border bg-[#0a0c08]/90 p-4 text-center backdrop-blur-xl', p.h, CLIP, p.ring)} style={{ animation: 'floatY 6s ease-in-out infinite', animationDelay: `${idx * 0.7}s` }}>
                  <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-white/20" />
                  <p className="text-2xl">{p.medal}</p>
                  <div className={cn('mx-auto mt-2 grid h-14 w-14 place-items-center bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/30 font-display text-lg font-black text-white', CLIP_SM)}>
                    {(r.username || '').slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-2 truncate text-xs font-black text-white">{r.username} {r.is_owner && '👑'}</p>
                  <p className="mt-0.5 text-[9px] text-slate-500">{r.country ? `${r.country.flag} ${r.country.name_fa}` : 'بدون کشور'}</p>
                  <p className={cn('mt-1 font-display text-sm font-black', p.txt)}>{C.fmt(C.get(r))}</p>
                </div>
                <p className={cn('mt-2 text-center font-display text-xl font-black', p.txt)}>#{toFa(p.i + 1)}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ─────────── نوار مقایسه Top10 ─────────── */}
        <div className={cn('mb-10 border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
          <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><TrendingUp size={12} /> نمودار ۱۰ فرمانده برتر — {C.label}</p>
          {top10.map((r, i) => (
            <div key={r.id} className="mb-2.5">
              <p className="mb-1 flex justify-between text-[10px] font-bold text-white">
                <span>#{toFa(i + 1)} {r.country?.flag || ''} {r.username}</span>
                <span className="text-cyan-300">{C.fmt(C.get(r))}</span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.max(4, (C.get(r) / maxV) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.05 }} className={cn('h-full', i === 0 ? 'bg-gradient-to-r from-amber-400 to-red-500 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-gradient-to-r from-cyan-400 to-fuchsia-500')} />
              </div>
            </div>
          ))}
        </div>

        {/* ─────────── جدول کامل ─────────── */}
        <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
          <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-slate-400"><Medal size={12} /> جدول کامل ({toFa(filtered.length)} فرمانده)</p>
          {loading ? (
            <div className="grid place-items-center py-14"><div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" /></div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map((r, i) => {
                const real = sorted.indexOf(r);
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.6) }} whileHover={{ x: -4 }} className={cn('flex flex-wrap items-center gap-3 border p-3', CLIP_SM, r.id === user?.id ? 'border-fuchsia-400/50 bg-fuchsia-400/10' : 'border-white/5 bg-white/5 hover:bg-white/10')}>
                    <span className={cn('grid h-9 w-9 shrink-0 place-items-center border font-display text-xs font-black', CLIP_SM, real === 0 ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : real === 1 ? 'border-slate-300/40 bg-slate-300/10 text-slate-300' : real === 2 ? 'border-orange-600/40 bg-orange-600/10 text-orange-400' : 'border-white/10 bg-white/5 text-slate-400')}>#{toFa(real + 1)}</span>
                    <span className="text-lg">{r.country?.flag || '🌐'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-white">{r.username} {r.is_owner && '👑'} {r.role === 'admin' && !r.is_owner && '🛡'} {r.alliance && <span className="text-[9px] text-fuchsia-300">{r.alliance.emblem} {r.alliance.name}</span>}</p>
                      <p className="text-[9px] text-slate-500">{C.sub(r)}</p>
                    </div>
                    <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-white/10 md:block">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{ width: `${Math.max(3, (C.get(r) / maxV) * 100)}%` }} />
                    </div>
                    <span className="font-display text-sm font-black text-cyan-300">{C.fmt(C.get(r))}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─────────── رتبه‌بندی اتحادها ─────────── */}
        <div className={cn('mt-10 border border-fuchsia-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
          <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-fuchsia-300"><Shield size={12} /> قدرت اتحادها</p>
          {alliances.length === 0 ? <p className="py-6 text-center text-xs text-slate-600">هنوز اتحادی شکل نگرفته</p> : alliances.slice(0, 8).map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} whileHover={{ y: -3 }} className={cn('mb-2 flex flex-wrap items-center gap-3 border p-3', CLIP_SM, i === 0 ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/5 bg-white/5')}>
              <span className="font-display text-sm font-black text-white">#{toFa(i + 1)}</span>
              <span className="text-xl">{a.emblem}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-black text-white">{a.name}</span>
              <span className="text-[9px] text-slate-500">{toFa(a.members)} عضو</span>
              <span className="text-[9px] text-emerald-300">{toFa(a.wins)} برد</span>
              <span className="flex items-center gap-1 font-display text-xs font-black text-fuchsia-300"><Zap size={11} /> {fmtNum(a.power)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}