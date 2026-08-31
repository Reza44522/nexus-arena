import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ShieldAlert, Bug, Target, AlertTriangle, CheckCircle2, XCircle, Trash2, Radar, Crosshair, Ghost, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa, fmtNum, RESOURCES } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const pad = (n) => String(n).padStart(2, '0');

const MISSIONS = {
  econ: { l: 'جاسوسی اقتصادی', i: '💼', cost: 100, suc: 75, risk: 1, d: 'سرقت ذخایر و جمعیت — اگر دام نباشد!', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  mil: { l: 'شناسایی نظامی', i: '🛰️', cost: 150, suc: 65, risk: 2, d: 'لیست کامل یگان‌ها و قدرت نظامی', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  plans: { l: 'سرقت نقشه‌ها', i: '📜', cost: 200, suc: 55, risk: 3, d: 'فناوری‌ها، دام‌ها و جنگ‌های فعال', cls: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' },
  cyber: { l: 'حمله سایبری', i: '💻', cost: 250, suc: 45, risk: 4, d: 'سرقت تا ۵٪ از WD هدف (حداکثر ۵۰۰)', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
};
const SPY_RANKS = [
  { n: 0, t: 'تازه‌کار', i: '🐣' }, { n: 1, t: 'مأمور میدان', i: '🕵️' }, { n: 3, t: 'جاسوس حرفه‌ای', i: '🎖️' },
  { n: 5, t: 'استاد سایه‌ها', i: '🌑' }, { n: 10, t: 'شبح افسانه‌ای', i: '👻' },
];

/* باران ماتریکسی */
function MatrixRain() {
  const cols = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: (i * 7.3 + Math.random() * 4) % 100,
    dur: 7 + Math.random() * 9,
    delay: Math.random() * 6,
    chars: Array.from({ length: 14 }, () => String.fromCharCode(0x30A0 + Math.random() * 96)).join(''),
  })), []);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-[0.06]">
      <style>{`@keyframes rainFall { from { transform: translateY(-100%); } to { transform: translateY(110vh); } }`}</style>
      {cols.map((c, i) => (
        <span key={i} className="absolute top-0 font-mono text-[10px] leading-4 text-emerald-300" style={{ left: c.left + '%', animation: `rainFall ${c.dur}s linear ${c.delay}s infinite` }}>
          {c.chars.split('').map((ch, j) => (<span key={j} className="block">{ch}</span>))}
        </span>
      ))}
    </div>
  );
}
const RiskStars = ({ n }) => (
  <span className="flex gap-0.5">{[1, 2, 3, 4].map((x) => (<span key={x} className={x <= n ? 'text-red-400' : 'text-white/15'}>★</span>))}</span>
);

/* ─────────── SpyOps v3 — اتاق عملیات سایبری ─────────── */
export default function SpyOps() {
  const { user } = useAuth();
  const [myCountry, setMyCountry] = useState(null);
  const [countries, setCountries] = useState([]);
  const [myOps, setMyOps] = useState([]);
  const [onMe, setOnMe] = useState([]);
  const [feed, setFeed] = useState([]);
  const [wd, setWd] = useState(0);
  const [techLvl, setTechLvl] = useState(0);
  const [targetTech, setTargetTech] = useState(0);
  const [mission, setMission] = useState('econ');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [decoyTab, setDecoyTab] = useState(false);
  const [decoyRes, setDecoyRes] = useState({});
  const [decoyPop, setDecoyPop] = useState(1000000);
  const [decoyPow, setDecoyPow] = useState(500);
  const [now, setNow] = useState(Date.now());
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 4000); };

  const load = async () => {
    if (!user?.id) return;
    const { data: me } = await supabase.from('player_countries').select('id, decoy').eq('user_id', user.id).maybeSingle();
    setMyCountry(me || null);
    const [cR, myR, onR, fR, pR, tR] = await Promise.all([
      supabase.from('player_countries').select('id, name_fa, flag').limit(200),
      me ? supabase.from('spy_ops').select('*').eq('spy_country', me.id).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
      me ? supabase.from('spy_ops').select('*').eq('target_country', me.id).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
      supabase.from('spy_ops').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('war_dollars').eq('id', user.id).single(),
      me ? supabase.from('country_tech').select('level').eq('country_id', me.id) : Promise.resolve({ data: [] }),
    ]);
    setCountries(cR.data || []);
    setMyOps(myR.data || []);
    setOnMe(onR.data || []);
    setFeed(fR.data || []);
    setWd(pR.data?.war_dollars ?? 0);
    setTechLvl((tR.data || []).reduce((s, x) => s + x.level, 0));
    if (me?.decoy) { setDecoyRes(me.decoy.resources || {}); setDecoyPop(me.decoy.population || 1000000); setDecoyPow(me.decoy.military || 500); }
  };
  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [user?.id]);
  useEffect(() => {
    if (!target) return;
    supabase.from('country_tech').select('level').eq('country_id', target).then(({ data }) => setTargetTech((data || []).reduce((s, x) => s + x.level, 0)));
  }, [target]);

  const nameOf = (id) => { const c = countries.find((x) => x.id === id); return c ? `${c.flag} ${c.name_fa}` : '—'; };
  const M = MISSIONS[mission];
  const cost = M.cost * (techLvl > 0 ? 0.8 : 1);
  const chance = Math.min(98, Math.max(15, M.suc + techLvl * 8 - targetTech * 6));
  const counterChance = targetTech > 0 ? Math.min(60, 25 + targetTech * 5) : 0;
  const successes = myOps.filter((o) => o.success).length;
  const detected = myOps.filter((o) => o.counter_detected).length;
  const stolenTotal = myOps.reduce((s, o) => s + Number(o.wd_stolen || 0), 0);
  const rank = SPY_RANKS.filter((r) => successes >= r.n).pop();
  const lastOp = myOps[0]?.created_at;
  const coolRemain = lastOp ? Math.max(0, 30 * 60000 - (now - new Date(lastOp).getTime())) : 0;
  const inCool = coolRemain > 0;

  const doSpy = async () => {
    if (!target) return flash('❌ هدف را انتخاب کن');
    setBusy(target);
    const { data, error } = await supabase.rpc('spy_execute', { p_target: target, p_mission: mission });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    setLastResult(data);
    setShowResult(true);
    load();
  };
  const setDecoy = async () => {
    setBusy('decoy');
    const { data, error } = await supabase.rpc('spy_set_decoy', { p_resources: decoyRes, p_population: Number(decoyPop), p_power: Number(decoyPow) });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('🪤 دام اطلاعاتی فعال شد (۲۰۰ WD)');
    load();
  };
  const clearDecoy = async () => { setBusy('clear'); await supabase.rpc('spy_clear_decoy'); setBusy(null); flash('🧹 دام پاک شد'); load(); };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes spyScan { 0% { left: -10%; } 100% { left: 110%; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes sweep { to { transform: rotate(360deg); } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(168,85,247,.5); transform: none; } 92% { text-shadow: -3px 0 #a855f7, 3px 0 #22d3ee; transform: translateX(2px); } 94% { text-shadow: 3px 0 #a855f7, -3px 0 #22d3ee; transform: translateX(-2px); } 96% { text-shadow: 0 0 26px rgba(168,85,247,.5); transform: none; } }
        @keyframes stampIn { 0% { transform: scale(3) rotate(-30deg); opacity: 0; } 60% { transform: scale(1) rotate(-12deg); opacity: 1; } 100% { transform: scale(1) rotate(-12deg); opacity: 1; } }
      `}</style>
      <MatrixRain />
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[360px] w-[520px] rounded-full bg-purple-600/10 blur-[130px]" />
        <div className="absolute top-10 right-1/4 h-[300px] w-[440px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" style={{ animation: 'spyScan 7s linear infinite' }} />
      </div>

      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-purple-400/40 bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(168,85,247,0.3)]', CLIP_SM)}>{notice}</motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl">
        {/* هدر با رادار + درجه جاسوسی */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <div className="absolute inset-0 rounded-full border border-purple-400/30" />
              <div className="absolute inset-3 rounded-full border border-purple-400/20" />
              <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(168,85,247,.4), transparent 70deg)', animation: 'sweep 3s linear infinite' }} />
              <div className="absolute inset-0 m-auto grid h-10 w-10 place-items-center rounded-full bg-purple-400/10 text-xl">{rank?.i}</div>
            </div>
            <div>
              <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.4em] text-purple-400">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" style={{ animation: 'blinkDot 1.6s infinite' }} /> COVERT OPS // CLASSIFIED
              </p>
              <h1 className="font-display text-3xl font-black text-white md:text-4xl" style={{ animation: 'glitch 4s infinite' }}>
                اتاق <span className="text-gradient">عملیات سایبری</span>
              </h1>
              <p className="mt-1 text-[10px] text-purple-300">درجه: {rank?.t} • سطح شبکه اطلاعاتی: {toFa(techLvl)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className={cn('border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 font-bold text-emerald-300', CLIP_SM)}>✅ موفق: {toFa(successes)}</span>
            <span className={cn('border border-red-400/40 bg-red-400/10 px-2.5 py-1 font-bold text-red-300', CLIP_SM)}>⚠️ شناسایی: {toFa(detected)}</span>
            <span className={cn('border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-bold text-amber-300', CLIP_SM)}>💰 سرقت‌شده: {fmtNum(stolenTotal)} WD</span>
            <span className={cn('border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 font-bold text-cyan-300', CLIP_SM)}>💵 {fmtNum(wd)} WD</span>
          </div>
        </div>

        {/* تیکر جاسوسی جهان */}
        {feed.length > 0 && (
          <div className="relative mb-6 overflow-hidden border-y border-purple-400/20 bg-black/60 py-1.5">
            <p className="whitespace-nowrap font-display text-[10px] tracking-widest text-purple-300/80" style={{ animation: 'spyScan 30s linear infinite reverse' }}>
              🕵️ {feed.map((f) => `${nameOf(f.spy_country)} ← ${nameOf(f.target_country)} [${MISSIONS[f.mission]?.i || '💼'}] ${f.counter_detected ? '— شناسایی شد!' : f.success ? '— موفق' : '— شکست'}`).join('  ◆  ')}
            </p>
          </div>
        )}

        {!myCountry ? (
          <p className="py-10 text-center text-sm text-slate-500">برای جاسوسی اول کشور تصرف کن!</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* پنل عملیات */}
            <div className={cn('h-fit border border-purple-400/30 bg-[#0a0c08]/85 p-5 backdrop-blur-xl', CLIP)}>
              <div className="mb-4 flex gap-1">
                <button onClick={() => setDecoyTab(false)} className={cn('flex-1 border px-2 py-1.5 text-[9px] font-black', CLIP_SM, !decoyTab ? 'border-purple-400/60 bg-purple-400/15 text-purple-300' : 'border-white/10 bg-white/5 text-slate-500')}><Crosshair size={10} /> عملیات</button>
                <button onClick={() => setDecoyTab(true)} className={cn('flex-1 border px-2 py-1.5 text-[9px] font-black', CLIP_SM, decoyTab ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 bg-white/5 text-slate-500')}><Bug size={10} /> دام اطلاعاتی</button>
              </div>

              {!decoyTab ? (
                <>
                  {/* انتخاب مأموریت */}
                  <p className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-purple-300">۱) نوع مأموریت</p>
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {Object.entries(MISSIONS).map(([k, m]) => (
                      <motion.button key={k} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => setMission(k)} className={cn('border p-2.5 text-right transition', CLIP_SM, mission === k ? m.cls : 'border-white/10 bg-white/5 text-slate-500')}>
                        <p className="flex items-center justify-between text-[10px] font-black"><span>{m.i} {m.l}</span><RiskStars n={m.risk} /></p>
                        <p className="mt-1 text-[8px] leading-3 opacity-80">{m.d}</p>
                        <p className="mt-1 text-[8px]"><span className="text-emerald-300">{fmtNum(m.cost * 0.8)} WD</span> • پایه {toFa(m.suc)}٪</p>
                      </motion.button>
                    ))}
                  </div>
                  {/* هدف */}
                  <p className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-purple-300">۲) کشور هدف</p>
                  <select value={target} onChange={(e) => setTarget(e.target.value)} className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none" style={{ colorScheme: 'dark' }}>
                    <option value="">انتخاب هدف...</option>
                    {countries.filter((c) => c.id !== myCountry.id).map((c) => (<option key={c.id} value={c.id}>{c.flag} {c.name_fa}</option>))}
                  </select>

                  {target && (
                    <div className="mb-3 space-y-2 rounded-md border border-white/5 bg-white/5 p-3 text-[10px]">
                      <p className="flex justify-between"><span className="text-slate-500">شانس موفقیت:</span>
                        <b className={chance >= 70 ? 'text-emerald-300' : chance >= 50 ? 'text-amber-300' : 'text-red-400'}>{toFa(chance)}٪</b></p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div animate={{ width: `${chance}%` }} className={cn('h-full', chance >= 70 ? 'bg-emerald-400' : chance >= 50 ? 'bg-amber-400' : 'bg-red-500')} />
                      </div>
                      <p className="flex justify-between"><span className="text-slate-500">خطر ضدجاسوسی هدف:</span><b className="text-red-400">{toFa(counterChance)}٪</b></p>
                      <p className="flex justify-between"><span className="text-slate-500">هزینه عملیات:</span><b className="text-emerald-300">{fmtNum(cost)} WD</b></p>
                      {counterChance >= 25 && <p className="flex items-center gap-1 border border-red-400/30 bg-red-400/5 p-2 text-[9px] text-red-300"><AlertTriangle size={10} /> هدف شبکه ضدجاسوسی فعال دارد!</p>}
                    </div>
                  )}

                  {inCool ? (
                    <div className={cn('border border-amber-400/40 bg-amber-400/10 p-3 text-center', CLIP_SM)}>
                      <p className="text-[10px] font-black text-amber-300">⏳ سرد شدن شبکه: {pad(Math.floor(coolRemain / 60000))}:{pad(Math.floor((coolRemain % 60000) / 1000))}</p>
                    </div>
                  ) : (
                    <button onClick={doSpy} disabled={busy === target || !target} className={cn('w-full bg-gradient-to-r from-purple-500 to-cyan-400 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-40', CLIP_SM)}>
                      {M.i} اجرای {M.l}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300"><Bug size={12} /> دام اطلاعاتی (Honeypot)</p>
                  <p className="mb-3 text-[10px] leading-5 text-slate-400">اطلاعات جعلی بساز — جاسوس دشمن به‌جای واقعیت، همین را می‌دزدد!</p>
                  <p className="mb-1 text-[9px] text-slate-500">جمعیت جعلی:</p>
                  <input type="number" value={decoyPop} onChange={(e) => setDecoyPop(e.target.value)} className="mb-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none" />
                  <p className="mb-1 text-[9px] text-slate-500">قدرت نظامی جعلی:</p>
                  <input type="number" value={decoyPow} onChange={(e) => setDecoyPow(e.target.value)} className="mb-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none" />
                  <p className="mb-1 text-[9px] text-slate-500">ذخایر جعلی:</p>
                  <div className="mb-3 grid grid-cols-4 gap-1">
                    {Object.entries(RESOURCES).map(([k, r]) => (
                      <div key={k} className="text-center">
                        <p className="text-sm">{r.icon}</p>
                        <input type="number" value={decoyRes[k] || 0} onChange={(e) => setDecoyRes({ ...decoyRes, [k]: Number(e.target.value) })} className="w-full rounded border border-white/10 bg-black/40 px-1 py-0.5 text-[8px] text-white outline-none" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={setDecoy} disabled={busy === 'decoy'} className={cn('flex-1 bg-gradient-to-r from-amber-500 to-red-500 py-2.5 text-[10px] font-black text-slate-950 disabled:opacity-40', CLIP_SM)}>
                      {myCountry.decoy ? '🔄 به‌روزرسانی دام' : '🪤 ساخت دام'} (۲۰۰ WD)
                    </button>
                    {myCountry.decoy && <button onClick={clearDecoy} disabled={busy === 'clear'} className={cn('border border-white/10 bg-white/5 px-3 text-slate-400 hover:bg-white/10', CLIP_SM)}><Trash2 size={11} /></button>}
                  </div>
                </>
              )}
            </div>

            {/* تاریخچه + دفاع */}
            <div className="space-y-4 lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className={cn('border border-purple-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                  <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-purple-300"><Eye size={12} /> عملیات‌های من</p>
                  {myOps.length === 0 ? <p className="text-xs text-slate-600">هنوز عملیاتی نداری — اولین سایه را بینداز!</p> : myOps.slice(0, 8).map((op) => (
                    <div key={op.id} className={cn('mb-2 border p-2.5 text-[10px]', CLIP_SM, op.counter_detected ? 'border-red-400/40 bg-red-400/5' : op.success ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-amber-400/40 bg-amber-400/5')}>
                      <p className="flex items-center gap-2">
                        {MISSIONS[op.mission]?.i || '💼'} {MISSIONS[op.mission]?.l || 'جاسوسی'} ← {nameOf(op.target_country)}
                        <span className="mr-auto text-[8px] text-slate-500">{new Date(op.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                      <p className={cn('mt-1', op.counter_detected ? 'text-red-300' : op.success ? 'text-emerald-300' : 'text-amber-300')}>
                        {op.counter_detected ? '⚠️ شناسایی شد!' : op.success ? `✅ موفق${op.wd_stolen ? ' — ' + fmtNum(op.wd_stolen) + ' WD سرقت شد' : ''}` : '❌ شکست'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                  <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><ShieldAlert size={12} /> دفاع سایبری تو</p>
                  <div className="space-y-2 text-[10px] text-slate-400">
                    <p className="flex justify-between"><span>🛰 ضدجاسوسی (int2):</span><b className="text-cyan-300">{toFa(myCountry?.decoy || techLvl > 0 ? Math.min(60, 25 + techLvl * 5) : 0)}٪ شناسایی دشمن</b></p>
                    <p className="flex justify-between"><span>🪤 دام اطلاعاتی:</span><b className={myCountry?.decoy ? 'text-amber-300' : 'text-slate-600'}>{myCountry?.decoy ? 'فعال ✅' : 'غیرفعال'}</b></p>
                    <p className="flex justify-between"><span>🕵️ تلاش‌ها روی تو:</span><b className="text-white">{toFa(onMe.length)}</b></p>
                  </div>
                  <p className="mb-2 mt-4 font-display text-[9px] uppercase tracking-[0.25em] text-slate-500">آخرین نفوذها:</p>
                  {onMe.length === 0 ? <p className="text-[10px] text-slate-600">شبکه‌ات امن است 🕊</p> : onMe.slice(0, 5).map((op) => (
                    <p key={op.id} className="mb-1 text-[9px] text-slate-400">
                      {op.counter_detected ? '✅' : op.success ? '⚠️' : '❌'} {nameOf(op.spy_country)} — {op.counter_detected ? 'شناسایی و جریمه شد' : op.success ? 'نفوذ موفق!' : 'شکست خورد'}
                    </p>
                  ))}
                </div>
              </div>
              {/* راهنمای فناوری */}
              <div className={cn('border border-fuchsia-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-fuchsia-300"><Zap size={12} /> اثر درخت فناوری بر جاسوسی</p>
                <div className="grid gap-2 text-[10px] text-slate-400 md:grid-cols-3">
                  <p>🕵️ <b className="text-white">شبکه جاسوسی:</b> هزینه −۲۰٪</p>
                  <p>🛰 <b className="text-white">ضدجاسوسی:</b> +۲۵٪ شناسایی دشمن</p>
                  <p>💻 <b className="text-white">جنگ سایبری:</b> تحریم‌های قوی‌تر</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📁 پرونده محرمانه نتیجه */}
      <AnimatePresence>
        {showResult && lastResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setShowResult(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className={cn('relative w-full max-w-md border-2 bg-[#0a0c08]/95 p-6', CLIP, lastResult.detected ? 'border-red-500/60' : lastResult.success ? 'border-emerald-400/60' : 'border-amber-400/60')}>
              {/* مُهر محرمانه */}
              <span className="pointer-events-none absolute right-4 top-4 border-4 border-double border-red-500/70 px-3 py-1 font-display text-sm font-black uppercase tracking-widest text-red-500/80" style={{ animation: 'stampIn 0.5s ease both' }}>
                محرمانه
              </span>
              <p className="mb-1 font-mono text-[9px] tracking-[0.3em] text-slate-500">DOSSIER // {new Date().toLocaleDateString('fa-IR')}</p>
              <h3 className="font-display text-lg font-black text-white">
                {lastResult.detected ? '⚠️ عملیات لو رفت!' : lastResult.success ? '✅ پرونده دریافت شد' : '❌ عملیات ناموفق'}
              </h3>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">{lastResult.message}</p>

              {lastResult.success && lastResult.info && (
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  {lastResult.decoy && <p className="flex items-center gap-1 border border-amber-400/40 bg-amber-400/10 p-2 text-[10px] text-amber-300"><Bug size={11} /> هشدار: این اطلاعات جعلی است — هدف دام گذاشته بود!</p>}
                  {lastResult.info.stolen_wd != null && (
                    <p className="text-center font-display text-3xl font-black text-amber-300">+{fmtNum(lastResult.info.stolen_wd)} WD 💰</p>
                  )}
                  {lastResult.info.resources && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(lastResult.info.resources).map(([k, v]) => (
                        <span key={k} className="border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-slate-300">{RESOURCES[k]?.icon} {fmtNum(v)}</span>
                      ))}
                    </div>
                  )}
                  {lastResult.info.population != null && <p className="text-[10px] text-slate-400">👥 جمعیت هدف: <b className="text-white">{fmtNum(lastResult.info.population)}</b></p>}
                  {lastResult.info.military != null && <p className="text-[10px] text-slate-400">⚔️ قدرت نظامی: <b className="text-red-300">{fmtNum(lastResult.info.military)}</b></p>}
                  {Array.isArray(lastResult.info.units) && lastResult.info.units.map((u, i) => (
                    <p key={i} className="text-[9px] text-slate-500">🎖 {u.name} ×{toFa(u.qty)} (+{fmtNum(Number(u.power) * u.qty)})</p>
                  ))}
                  {lastResult.info.has_decoy != null && (
                    <p className="text-[10px] text-slate-400">🪤 دام اطلاعاتی هدف: <b className={lastResult.info.has_decoy ? 'text-amber-300' : 'text-emerald-300'}>{lastResult.info.has_decoy ? 'دارد!' : 'ندارد'}</b></p>
                  )}
                  {lastResult.info.wars != null && <p className="text-[10px] text-slate-400">⚔️ جنگ‌های فعال هدف: <b className="text-white">{toFa(lastResult.info.wars)}</b></p>}
                  {Array.isArray(lastResult.info.tech) && lastResult.info.tech.length > 0 && (
                    <p className="text-[10px] text-slate-400">🧬 فناوری‌ها: {lastResult.info.tech.map((t) => `${t.tech}(${toFa(t.level)})`).join('، ')}</p>
                  )}
                </div>
              )}
              <button onClick={() => setShowResult(false)} className={cn('mt-5 w-full bg-gradient-to-r from-purple-500 to-cyan-400 py-2.5 font-display text-[10px] font-black uppercase tracking-widest text-slate-950', CLIP_SM)}>بستن پرونده</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}