import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Scale, Feather, CheckCircle2, XCircle, Gavel, Radio, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const pad = (n) => String(n).padStart(2, '0');
const TYPES = {
  sanction: { l: 'تحریم جمعی', i: '🥶', d: 'تحریم ۲۴ساعته بازار+مالیات روی هدف', c: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' },
  ceasefire: { l: 'آتش‌بس اجباری', i: '🕊️', d: 'پایان فوری همه نبردهای فعال هدف', c: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  condemn: { l: 'محکومیت + جریمه', i: '⚖️', d: 'کسر ۲۰۰ WD از هدف به‌عنوان غرامت', c: 'text-amber-300 border-amber-400/40 bg-amber-400/10' },
};

/* ─────────── سالن رأی‌گیری (چمبر نیم‌دایره‌ای مثل سازمان ملل) ─────────── */
function Chamber({ countries, votes, proposerId, myId }) {
  const n = countries.length;
  if (!n) return null;
  const perRow = Math.ceil(n / 3);
  const pos = (i) => {
    const row = Math.floor(i / perRow);
    const j = i % perRow;
    const cnt = Math.min(perRow, n - row * perRow);
    const radius = 120 + row * 52;
    const t = (j + 1) / (cnt + 1);
    const ang = Math.PI * t;
    return { x: 300 + radius * Math.cos(ang), y: 285 - radius * Math.sin(ang) };
  };
  return (
    <svg viewBox="0 0 600 300" className="w-full">
      {/* تریبون */}
      <circle cx="300" cy="285" r="24" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.5)" strokeWidth="1" />
      <text x="300" y="293" textAnchor="middle" fontSize="18">🏛</text>
      <line x1="60" y1="285" x2="540" y2="285" stroke="rgba(59,130,246,0.2)" strokeWidth="1" strokeDasharray="4 4" />
      {countries.map((c, i) => {
        const p = pos(i);
        const v = votes[c.id];
        const col = v === 'for' ? '#34d399' : v === 'against' ? '#f87171' : c.id === proposerId ? '#3b82f6' : 'rgba(148,163,184,0.2)';
        return (
          <g key={c.id}>
            <circle cx={p.x} cy={p.y} r="13" fill={col} opacity={v || c.id === proposerId ? 0.95 : 0.6} style={{ filter: v ? `drop-shadow(0 0 7px ${col})` : undefined }} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11">{c.flag}</text>
            {c.id === myId && <circle cx={p.x} cy={p.y} r="16" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />}
          </g>
        );
      })}
    </svg>
  );
}

/* حلقه شمارش معکوس */
function CountRing({ endsAt, now }) {
  const total = 30 * 60000;
  const remain = Math.max(0, new Date(endsAt).getTime() - now);
  const pct = Math.min(1, remain / total);
  const r = 15, c = 2 * Math.PI * r;
  const txt = remain <= 0 ? '۰۰:۰۰' : `${pad(Math.floor(remain / 60000))}:${pad(Math.floor((remain % 60000) / 1000))}`;
  return (
    <div className="relative h-10 w-10 shrink-0">
      <svg width="40" height="40">
        <circle cx="20" cy="20" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
        <circle cx="20" cy="20" r={r} stroke={pct > 0.3 ? '#3b82f6' : '#ef4444'} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 20 20)" />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-[7px] text-white">{txt}</span>
    </div>
  );
}

/* ─────────── UNCouncil v2 — شورای امنیت جهانی ─────────── */
export default function UNCouncil() {
  const { user } = useAuth();
  const [myCountry, setMyCountry] = useState(null);
  const [countries, setCountries] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [allVotes, setAllVotes] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [selRes, setSelRes] = useState(null);
  const [pType, setPType] = useState('sanction');
  const [pTarget, setPTarget] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  const load = async () => {
    if (!user?.id) return;
    const { data: me } = await supabase.from('player_countries').select('id').eq('user_id', user.id).maybeSingle();
    setMyCountry(me || null);
    const [cR, rR, vR] = await Promise.all([
      supabase.from('player_countries').select('id, name_fa, flag').limit(200),
      supabase.from('un_resolutions').select('*').order('created_at', { ascending: false }).limit(15),
      supabase.from('un_votes').select('*').order('created_at', { ascending: false }).limit(120),
    ]);
    setCountries(cR.data || []);
    setResolutions(rR.data || []);
    setAllVotes(vR.data || []);
    if (!selRes && rR.data?.length) setSelRes(rR.data.find((r) => r.status === 'voting')?.id || rR.data[0].id);
  };

  useEffect(() => {
    load();
    const t1 = setInterval(() => setNow(Date.now()), 1000);
    const t2 = setInterval(() => { supabase.rpc('un_close_expired').then(() => load()); }, 20000);
    return () => { clearInterval(t1); clearInterval(t2); };
    // eslint-disable-next-line
  }, [user?.id]);

  const nameOf = (id) => { const c = countries.find((x) => x.id === id); return c ? `${c.flag} ${c.name_fa}` : '—'; };
  const flagOf = (id) => countries.find((x) => x.id === id)?.flag || '🌐';
  const active = resolutions.filter((r) => r.status === 'voting');
  const closed = resolutions.filter((r) => r.status !== 'voting').slice(0, 6);
  const cur = resolutions.find((r) => r.id === selRes) || active[0];
  const curVotes = useMemo(() => { const m = {}; allVotes.forEach((v) => { if (v.resolution_id === cur?.id) m[v.country_id] = v.vote; }); return m; }, [allVotes, cur]);
  const myVote = myCountry ? allVotes.find((v) => v.resolution_id === cur?.id && v.country_id === myCountry.id)?.vote : null;
  const myVotesCount = myCountry ? allVotes.filter((v) => v.country_id === myCountry.id).length : 0;
  const myProps = myCountry ? resolutions.filter((r) => r.proposer_country === myCountry.id).length : 0;
  const passedCount = resolutions.filter((r) => r.status === 'passed').length;
  const latestVotes = allVotes.slice(0, 6);

  const propose = async () => {
    setBusy('prop');
    const { data, error } = await supabase.rpc('un_propose', { p_type: pType, p_target: pTarget, p_descr: pDesc.trim() || null });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('🏛 قطعنامه تو روی میز شورای امنیت قرار گرفت!');
    setPTarget(''); setPDesc('');
    load();
  };
  const vote = async (id, v) => {
    setBusy(id + v);
    const { data, error } = await supabase.rpc('un_vote', { p_resolution: id, p_vote: v });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(v === 'for' ? '✅ رأی موافق ثبت شد' : '❌ رأی مخالف ثبت شد');
    load();
  };
  const withdraw = async (id) => {
    setBusy('wd' + id);
    const { data, error } = await supabase.rpc('un_withdraw', { p_resolution: id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    flash(' قطعنامه پس گرفته شد');
    load();
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes unScan { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes spinSlow { to { transform: rotate(360deg); } }
        @keyframes tickX { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(59,130,246,.5); transform: none; } 92% { text-shadow: -3px 0 #3b82f6, 3px 0 #22d3ee; transform: translateX(2px); } 94% { text-shadow: 3px 0 #3b82f6, -3px 0 #22d3ee; transform: translateX(-2px); } 96% { text-shadow: 0 0 26px rgba(59,130,246,.5); transform: none; } }
      `}</style>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[360px] w-[520px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-10 right-1/4 h-[300px] w-[440px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'64\' viewBox=\'0 0 56 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 0L56 16v32L28 64 0 48V16z\' fill=\'none\' stroke=\'%233b82f6\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '56px 64px' }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" style={{ animation: 'unScan 7s linear infinite' }} />
      </div>

      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-blue-400/40 bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(59,130,246,0.3)]', CLIP_SM)}>{notice}</motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl">
        {/* هدر با نشان چرخان */}
        <div className="mb-6 text-center">
          <p className="mb-2 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.4em] text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" style={{ animation: 'blinkDot 1.6s infinite' }} /> UNITED NEXUS COUNCIL // LIVE
          </p>
          <div className="relative mx-auto mb-3 h-24 w-24">
            <div className="absolute inset-0 rounded-full border border-blue-400/30" style={{ animation: 'spinSlow 12s linear infinite', borderStyle: 'dashed' }} />
            <div className="absolute inset-2 rounded-full border border-cyan-400/20" style={{ animation: 'spinSlow 8s linear infinite reverse', borderStyle: 'dotted' }} />
            <div className="absolute inset-0 m-auto grid h-14 w-14 place-items-center rounded-full border-2 border-blue-400/50 bg-blue-400/10 shadow-[0_0_40px_rgba(59,130,246,0.4)]">
              <Landmark size={26} className="text-blue-300" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-black text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            شورای <span className="text-gradient">امنیت جهانی</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-slate-400">
            قطعنامه بگذار، رأی بده و سرنوشت دشمنان را با دیپلماسی تعیین کن — تصویب = حداقل ۲ رأی موافق و برتری بر مخالف.
          </p>
          {/* آمار دیپلماتیک */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px]">
            <span className={cn('border border-blue-400/40 bg-blue-400/10 px-3 py-1 font-bold text-blue-300', CLIP_SM)}><Users size={10} /> {toFa(countries.length)} کشور عضو</span>
            <span className={cn('border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-bold text-emerald-300', CLIP_SM)}>✅ تصویب‌شده: {toFa(passedCount)}</span>
            <span className={cn('border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-bold text-cyan-300', CLIP_SM)}>🗳 رأی‌های تو: {toFa(myVotesCount)}</span>
            <span className={cn('border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 font-bold text-fuchsia-300', CLIP_SM)}>🏛 قطعنامه‌های تو: {toFa(myProps)}</span>
          </div>
        </div>

        {/* تیکر رأی‌های زنده */}
        {latestVotes.length > 0 && (
          <div className="relative mb-6 overflow-hidden border-y border-blue-400/20 bg-black/60 py-1.5">
            <p className="whitespace-nowrap font-display text-[10px] tracking-widest text-blue-300/80" style={{ animation: 'tickX 30s linear infinite' }}>
              🗳 {latestVotes.map((v) => `${flagOf(v.country_id)} ${v.vote === 'for' ? 'موافق' : 'مخالف'}`).join('  ◆  ')}
            </p>
          </div>
        )}

        {!myCountry ? (
          <p className="py-10 text-center text-sm text-slate-500">برای شرکت در شورا اول یک کشور تصرف کن!</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* پنل پیشنهاد */}
            <div className={cn('h-fit border border-blue-400/30 bg-[#0a0c08]/85 p-5 backdrop-blur-xl', CLIP)}>
              <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-blue-300"><Gavel size={12} /> پیشنهاد قطعنامه</p>
              <div className="mb-3 space-y-2">
                {Object.entries(TYPES).map(([k, t]) => (
                  <motion.button key={k} whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }} onClick={() => setPType(k)} className={cn('flex w-full items-center gap-2 border p-2.5 text-right text-[10px] font-bold transition', CLIP_SM, pType === k ? t.c : 'border-white/10 bg-white/5 text-slate-500 hover:text-white')}>
                    <span className="text-base">{t.i}</span>
                    <span className="flex-1">{t.l}<span className="block text-[8px] font-normal opacity-70">{t.d}</span></span>
                  </motion.button>
                ))}
              </div>
              <select value={pTarget} onChange={(e) => setPTarget(e.target.value)} className="mb-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none" style={{ colorScheme: 'dark' }}>
                <option value="">کشور هدف...</option>
                {countries.filter((c) => c.id !== myCountry.id).map((c) => (<option key={c.id} value={c.id}>{c.flag} {c.name_fa}</option>))}
              </select>
              <input value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="توضیح قطعنامه (اختیاری)..." className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none" />
              <button onClick={propose} disabled={busy === 'prop' || !pTarget} className={cn('w-full bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-40', CLIP_SM)}>
                🏛 ثبت قطعنامه
              </button>
            </div>

            {/* سالن رأی‌گیری + قطعنامه‌ها */}
            <div className="space-y-4 lg:col-span-2">
              {/* چمبر */}
              <div className={cn('border border-blue-400/30 bg-[#0a0c08]/85 p-4', CLIP)}>
                <p className="mb-1 flex items-center justify-between font-display text-[10px] uppercase tracking-[0.3em] text-blue-300">
                  <span>🗳 سالن رأی‌گیری {cur ? `— ${TYPES[cur.type]?.l} علیه ${nameOf(cur.target_country)}` : ''}</span>
                  <span className="text-[8px] text-slate-500">دور طلایی = تو</span>
                </p>
                <Chamber countries={countries} votes={curVotes} proposerId={cur?.proposer_country} myId={myCountry.id} />
              </div>

              {/* قطعنامه‌های فعال */}
              {active.length === 0 ? (
                <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-10 text-center', CLIP)}>
                  <Feather size={30} className="mx-auto text-blue-400/50" />
                  <p className="mt-3 text-xs text-slate-500">قطعنامه فعالی روی میز نیست — آرامش دیپلماتیک!</p>
                </div>
              ) : active.map((r) => {
                const total = r.votes_for + r.votes_against;
                const pctFor = total ? Math.round((r.votes_for / total) * 100) : 100;
                const isProp = r.proposer_country === myCountry.id;
                const mv = allVotes.find((v) => v.resolution_id === r.id && v.country_id === myCountry.id)?.vote;
                const votersFor = allVotes.filter((v) => v.resolution_id === r.id && v.vote === 'for');
                const votersAgainst = allVotes.filter((v) => v.resolution_id === r.id && v.vote === 'against');
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSelRes(r.id)} className={cn('cursor-pointer border bg-[#0a0c08]/85 p-5 transition', CLIP, selRes === r.id ? 'border-blue-400/60 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-white/10 hover:border-blue-400/30')}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={cn('border px-2.5 py-1 text-[10px] font-black', CLIP_SM, TYPES[r.type]?.c || 'text-white border-white/20')}>{TYPES[r.type]?.i} {TYPES[r.type]?.l}</span>
                      <span className="flex-1 text-xs font-bold text-white">علیه: {nameOf(r.target_country)}</span>
                      <CountRing endsAt={r.ends_at} now={now} />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">پیشنهاد: {nameOf(r.proposer_country)} {r.descr && `— «${r.descr}»`}</p>
                    <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10">
                      <motion.div animate={{ width: `${pctFor}%` }} className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                      <motion.div animate={{ width: `${100 - pctFor}%` }} className="h-full bg-gradient-to-r from-red-500 to-rose-400" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
                      <span className="text-emerald-300">موافق {toFa(r.votes_for)}: {votersFor.map((v) => flagOf(v.country_id)).join(' ') || '—'}</span>
                      <span className="text-red-400">مخالف {toFa(r.votes_against)}: {votersAgainst.map((v) => flagOf(v.country_id)).join(' ') || '—'}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {isProp ? (
                        <>
                          <span className="flex-1 text-[9px] text-blue-300">🏛 تو پیشنهاددهنده‌ای — رأی‌ات موافق شمرده شده</span>
                          <button onClick={(e) => { e.stopPropagation(); withdraw(r.id); }} disabled={busy === 'wd' + r.id} className={cn('border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-[9px] font-black text-red-300 hover:bg-red-400/20', CLIP_SM)}><Trash2 size={10} /> پس گرفتن</button>
                        </>
                      ) : mv ? (
                        <span className={cn('flex items-center gap-1 text-[10px] font-black', mv === 'for' ? 'text-emerald-300' : 'text-red-400')}>
                          {mv === 'for' ? <CheckCircle2 size={12} /> : <XCircle size={12} />} رأی تو: {mv === 'for' ? 'موافق' : 'مخالف'}
                        </span>
                      ) : (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); vote(r.id, 'for'); }} disabled={busy === r.id + 'for'} className={cn('flex-1 bg-gradient-to-r from-emerald-400 to-cyan-500 py-2 text-[10px] font-black text-slate-950', CLIP_SM)}>✅ موافق</button>
                          <button onClick={(e) => { e.stopPropagation(); vote(r.id, 'against'); }} disabled={busy === r.id + 'against'} className={cn('flex-1 bg-gradient-to-r from-red-500 to-rose-400 py-2 text-[10px] font-black text-slate-950', CLIP_SM)}>❌ مخالف</button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* بایگانی */}
              {closed.length > 0 && (
                <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
                  <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-slate-400"><Scale size={12} /> بایگانی قطعنامه‌ها</p>
                  {closed.map((r) => (
                    <p key={r.id} className="mb-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                      {r.status === 'passed' ? <CheckCircle2 size={12} className="text-emerald-300" /> : <XCircle size={12} className="text-red-400" />}
                      {TYPES[r.type]?.i} {TYPES[r.type]?.l} علیه {nameOf(r.target_country)} — {r.status === 'passed' ? '✅ تصویب و اجرا شد' : '❌ رد شد'}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}