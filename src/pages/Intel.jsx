import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Flame, Banknote, Users, Factory, Package, Crown, Handshake, Swords, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RESOURCES, fmtNum, toFa } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── Intel — پرونده جاسوسی کشورها ─────────── */
export default function Intel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [c, setC] = useState(null);
  const [leader, setLeader] = useState('—');
  const [alliance, setAlliance] = useState(null);
  const [industry, setIndustry] = useState(0);
  const [mil, setMil] = useState([]);
  const [wars, setWars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cr, pr, amr, compr, invr, wr] = await Promise.all([
        supabase.from('player_countries').select('*').eq('id', id).maybeSingle(),
        supabase.from('player_countries').select('user_id, owner:profiles(username)').eq('id', id).maybeSingle(),
        supabase.from('player_countries').select('user_id, member:alliance_members(role, alliance:alliances(name, emblem))').eq('id', id).maybeSingle(),
        supabase.from('companies').select('level').eq('country_id', id),
        supabase.from('military_inventory').select('name, qty, power').eq('country_id', id).order('power', { ascending: false }),
        supabase.from('wars').select('report, mode, finished_at').or(`attacker_country.eq.${id},defender_country.eq.${id}`).order('finished_at', { ascending: false }).limit(8),
      ]);
      setC(cr.data || null);
      setLeader(pr.data?.owner?.username || '—');
      setAlliance(amr.data?.member?.alliance || null);
      setIndustry((compr.data || []).reduce((s, x) => s + x.level, 0));
      setMil(invr.data || []);
      setWars(wr.data || []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="grid min-h-screen place-items-center pt-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" /></div>;
  if (!c) return <div className="min-h-screen px-4 pt-32 text-center text-slate-400">پرونده‌ای پیدا نشد! 🕵️</div>;

  const res = c.resources || {};
  const milPower = mil.reduce((s, x) => s + Number(x.power) * x.qty, 0);
  const units = mil.reduce((s, x) => s + x.qty, 0);
  const power = Math.floor(industry * 15 + milPower + Number(res.uranium || 0) / 2 + Number(res.oil || 0) / 10);
  const wealth = Math.floor(Object.values(res).reduce((s, v) => s + Number(v || 0), 0));
  const mine = c.user_id === user?.id;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
      `}</style>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[42vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* نوار CLASSIFIED */}
        <div className="mb-6 flex items-center justify-between border-y border-cyan-400/30 py-2" style={{ background: 'repeating-linear-gradient(45deg, rgba(34,211,238,.12) 0 10px, transparent 10px 20px)' }}>
          <p className="flex items-center gap-2 px-3 font-display text-[9px] font-black uppercase tracking-[0.35em] text-cyan-300">🕵️ Intelligence Dossier // Classified</p>
          <button onClick={() => navigate('/rankings')} className="flex items-center gap-1 px-3 text-[10px] font-bold text-slate-400 transition hover:text-white"><ArrowRight size={11} /> بازگشت</button>
        </div>

        {/* هدر پرونده */}
        <div className={cn('relative mb-8 border bg-[#070b18]/90 p-6 backdrop-blur-xl', CLIP, mine ? 'border-emerald-400/40' : 'border-cyan-400/30')}>
          <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
          <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-red-500/60" />
          <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" style={{ animation: 'scanY 5s linear infinite' }} />
          <div className="flex flex-wrap items-center gap-5">
            <div className={cn('grid h-24 w-24 place-items-center bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 text-6xl', CLIP_SM)}>{c.flag || '🌐'}</div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-black text-white md:text-4xl">{c.name_fa || c.name_en}</h1>
              <p className="mt-1 text-xs text-slate-500">رهبر: <span className="font-bold text-cyan-300">{leader}</span> {mine && <span className="text-emerald-300">(کشور خودت)</span>}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                {alliance && (
                  <span className={cn('flex items-center gap-1 border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-300', CLIP_SM)}>
                    <Handshake size={10} /> {alliance.emblem} {alliance.name}
                  </span>
                )}
                <span className={cn('flex items-center gap-1 border border-red-400/30 bg-red-400/10 px-2 py-1 text-red-300', CLIP_SM)}><Flame size={10} /> قدرت: {fmtNum(power)}</span>
                <span className={cn('flex items-center gap-1 border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-300', CLIP_SM)}><Banknote size={10} /> ثروت: {fmtNum(wealth)}</span>
                <span className={cn('flex items-center gap-1 border border-white/10 bg-white/5 px-2 py-1 text-slate-300', CLIP_SM)}><Users size={10} /> جمعیت: {fmtNum(c.population || 0)}</span>
              </div>
            </div>
            {!mine && (
              <button onClick={() => navigate('/war')} className={cn('flex items-center gap-2 bg-gradient-to-r from-red-500 to-amber-500 px-5 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_24px_rgba(239,68,68,0.4)] transition-all hover:shadow-[0_0_36px_rgba(239,68,68,0.6)]', CLIP_SM)}>
                <Swords size={14} /> اعلام جنگ
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ذخایر */}
          <div className={cn('border border-white/10 bg-[#070b18]/85 p-5', CLIP)}>
            <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300"><Package size={12} /> ذخایر استراتژیک</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(RESOURCES).map(([k, r]) => (
                <div key={k} className={cn('border border-white/10 bg-white/5 p-2 text-center', CLIP_SM)}>
                  <p className="text-lg">{r.icon}</p>
                  <p className="text-[9px] text-slate-500">{r.label}</p>
                  <p className="font-display text-xs font-black text-white">{fmtNum(res[k] ?? 0)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* نظامی */}
          <div className={cn('border border-white/10 bg-[#070b18]/85 p-5', CLIP)}>
            <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-red-400"><Shield size={12} /> توان نظامی ({toFa(units)} واحد)</p>
            {mil.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-600">بدون تجهیز نظامی — هدف آسان! 🎯</p>
            ) : (
              <div className="chat-scroll max-h-64 space-y-1.5 overflow-y-auto">
                {mil.map((m, i) => (
                  <p key={i} className={cn('flex justify-between border border-white/10 bg-white/5 px-3 py-2 text-[10px]', CLIP_SM)}>
                    <span className="text-slate-300">🎖 {m.name} ×{toFa(m.qty)}</span>
                    <span className="font-black text-red-300">+{fmtNum(Number(m.power) * m.qty)}</span>
                  </p>
                ))}
              </div>
            )}
            <p className={cn('mt-3 flex justify-between border border-white/10 bg-white/5 px-3 py-2 text-[10px]', CLIP_SM)}>
              <span className="flex items-center gap-1 text-slate-400"><Factory size={10} /> صنعت (سطح شرکت‌ها)</span>
              <span className="font-black text-amber-300">{toFa(industry)}</span>
            </p>
          </div>

          {/* کابینه + جنگ‌ها */}
          <div className="space-y-6">
            <div className={cn('border border-white/10 bg-[#070b18]/85 p-5', CLIP)}>
              <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-fuchsia-300"><Crown size={12} /> کابینه</p>
              {(c.cabinet || []).length === 0 ? (
                <p className="text-xs text-slate-600">کابینه‌ای معرفی نشده</p>
              ) : (
                <div className="space-y-1.5">
                  {c.cabinet.map((m, i) => (
                    <p key={i} className={cn('border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-slate-300', CLIP_SM)}>
                      <span className="font-bold text-fuchsia-300">{m.role}:</span> {m.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className={cn('border border-white/10 bg-[#070b18]/85 p-5', CLIP)}>
              <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-red-400"><Swords size={12} /> نبردهای اخیر</p>
              {wars.length === 0 ? (
                <p className="text-xs text-slate-600">سابقه نبردی ندارد</p>
              ) : (
                <div className="space-y-1.5">
                  {wars.map((w, i) => (
                    <p key={i} className={cn('border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] text-slate-400', CLIP_SM)}>
                      {w.report?.attacker} ⚔ {w.report?.defender} — <span className={w.report?.win ? 'text-emerald-300' : 'text-red-400'}>{w.report?.win ? 'برد حمله‌کننده' : 'شکست حمله‌کننده'}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}