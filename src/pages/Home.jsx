import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Trophy, Snowflake, Search, Activity, Users, Banknote, Radar, Medal, Zap, Skull, ChevronLeft, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';
import HomeWorldMap from '../components/HomeWorldMap';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const HAZARD = { background: 'repeating-linear-gradient(45deg, rgba(34,211,238,.12) 0 10px, transparent 10px 20px)' };
const pad = (n) => String(n).padStart(2, '0');

/* شمارنده انیمیشنی */
function useCountUp(target, dur = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, dur]);
  return v;
}

const timeAgo = (ts) => {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return 'همین حالا';
  if (m < 60) return `${toFa(m)} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${toFa(h)} ساعت پیش`;
  return `${toFa(Math.floor(h / 24))} روز پیش`;
};

function StatCard({ icon: Icon, label, value, suffix, cls, delay }) {
  const v = useCountUp(value);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }} className={cn('relative border p-4 backdrop-blur-xl', CLIP, cls)}>
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-white/20" />
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10"><Icon size={20} /></div>
        <div className="min-w-0">
          <p className="font-display text-2xl font-black tabular-nums text-white">{toFa(v)}{suffix || ''}</p>
          <p className="truncate text-[9px] uppercase tracking-[0.2em] opacity-70">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────── Home v2 — ضربان زنده آرنا ─────────── */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [matches, setMatches] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [spies, setSpies] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [tours, setTours] = useState([]);
  const [countries, setCountries] = useState([]);

  const load = async () => {
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    const [mR, sR, spR, uR, tR, cR] = await Promise.all([
      supabase.from('war_matches').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(120),
      supabase.from('sanctions').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(60),
      supabase.from('spy_ops').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(60),
      supabase.from('profiles').select('username').gte('created_at', since).limit(60),
      supabase.from('war_tournaments').select('*').eq('status', 'open').limit(3),
      supabase.from('player_countries').select('id, name_fa, flag').limit(200),
    ]);
    setMatches(mR.data || []);
    setSanctions(sR.data || []);
    setSpies(spR.data || []);
    setNewUsers(uR.data || []);
    setTours(tR.data || []);
    setCountries(cR.data || []);
  };

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    const ch = supabase
      .channel('home-live-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'war_matches' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sanctions' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'spy_ops' }, () => load())
      .subscribe();
    return () => { clearInterval(t); supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, []);

  const nameOf = (id) => { const c = countries.find((x) => x.id === id); return c ? `${c.flag} ${c.name_fa}` : '—'; };

  /* نمودار ۲۴ ساعت */
  const hours = useMemo(() => {
    const H = Array.from({ length: 24 }, (_, i) => ({ i, count: 0 }));
    const bump = (ts) => {
      const d = new Date(ts);
      const idx = 23 - Math.floor((Date.now() - d.getTime()) / 3600000);
      if (idx >= 0 && idx < 24) H[idx].count += 1;
    };
    matches.forEach((m) => bump(m.created_at));
    sanctions.forEach((s) => bump(s.created_at));
    spies.forEach((s) => bump(s.created_at));
    return H;
  }, [matches, sanctions, spies]);
  const maxCount = Math.max(1, ...hours.map((h) => h.count));

  /* فید زنده */
  const feed = useMemo(() => {
    const ev = [
      ...matches.filter((m) => m.status === 'finished').map((m) => ({ t: m.finished_at || m.created_at, icon: Swords, cls: 'text-red-300 border-red-400/30 bg-red-400/5', txt: `نبرد ${nameOf(m.attacker_country)} ⚔ ${nameOf(m.defender_country)} — برنده: ${nameOf(m.winner_country)}` })),
      ...matches.filter((m) => m.status !== 'finished').map((m) => ({ t: m.created_at, icon: Flame, cls: 'text-amber-300 border-amber-400/30 bg-amber-400/5', txt: `🚨 اعلام جنگ: ${nameOf(m.attacker_country)} ⚔ ${nameOf(m.defender_country)}` })),
      ...sanctions.map((s) => ({ t: s.created_at, icon: Snowflake, cls: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/5', txt: `🥶 تحریم جدید روی ${nameOf(s.defender_country)}` })),
      ...spies.map((s) => ({ t: s.created_at, icon: Search, cls: 'text-purple-300 border-purple-400/30 bg-purple-400/5', txt: `🕵️ جاسوسی ${nameOf(s.spy_country)} از ${nameOf(s.target_country)}` })),
    ];
    return ev.sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 10);
    // eslint-disable-next-line
  }, [matches, sanctions, spies, countries]);

  /* فرماندهان برتر واقعی */
  const top = useMemo(() => {
    const all = {};
    matches.forEach((m) => { if (m.status === 'finished' && m.winner_country) all[m.winner_country] = (all[m.winner_country] || 0) + 1; });
    return Object.entries(all).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [matches]);

  const countdown = (ts) => {
    const d = new Date(ts).getTime() - now;
    if (d <= 0) return 'در حال برگزاری!';
    return `${pad(Math.floor(d / 3600000))}:${pad(Math.floor((d % 3600000) / 60000))}:${pad(Math.floor((d % 60000) / 1000))}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-20 pt-28">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes nxSpin { to { transform: rotate(360deg); } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes aurora { from { transform: translate3d(-40px,0,0) scale(1); } to { transform: translate3d(60px,30px,0) scale(1.15); } }
        @keyframes typeW { from { width: 0; } to { width: 100%; } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 30px rgba(34,211,238,.5); transform: none; } 92% { text-shadow: -3px 0 #22d3ee, 3px 0 #e879f9; transform: translateX(2px); } 94% { text-shadow: 3px 0 #22d3ee, -3px 0 #e879f9; transform: translateX(-2px); } 96% { text-shadow: 0 0 30px rgba(34,211,238,.5); transform: none; } }
        @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
      `}</style>

      {/* صحنه اولترا */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[46vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.13]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,.4) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
        <div className="absolute -top-32 left-1/4 h-[380px] w-[520px] rounded-full bg-cyan-500/10 blur-[130px]" style={{ animation: 'aurora 9s ease-in-out infinite alternate' }} />
        <div className="absolute top-10 right-1/4 h-[320px] w-[460px] rounded-full bg-fuchsia-600/10 blur-[120px]" style={{ animation: 'aurora 11s ease-in-out infinite alternate-reverse' }} />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'64\' viewBox=\'0 0 56 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 0L56 16v32L28 64 0 48V16z\' fill=\'none\' stroke=\'%2322d3ee\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '56px 64px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.6) 100%)' }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" style={{ animation: 'scanY 7s linear infinite' }} />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* ─────────── HERO ─────────── */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.4em] text-cyan-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> SERVERS ONLINE // فصل ۱۲ زنده است
            </p>
            <h1 className="font-display text-5xl font-black leading-tight text-white md:text-7xl" style={{ animation: 'glitch 4s infinite' }}>
              نبض <span className="text-gradient">نبرد</span><br />در دستان تو
            </h1>
            <p className="mt-2 overflow-hidden whitespace-nowrap font-mono text-[11px] tracking-[0.3em] text-cyan-400/70" style={{ animation: 'typeW 3s steps(40) 1 both' }}>
              دیپلماسی // جاسوسی // تحریم // جنگ تمام‌عیار
            </p>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              یک کشور بساز، اتحاد ببند، جاسوسی کن، تحریم بزن و در نبردهای تن‌به‌تن، جام‌های بزرگ و جنگ‌های مختصاتی، تاریخ دیجیتال را تو بنویس.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => navigate(user ? '/war' : '/register')} className={cn('flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:brightness-110', CLIP_SM)}>
                <Swords size={15} /> ورود به اتاق جنگ
              </button>
              <button onClick={() => navigate('/rankings')} className={cn('flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-7 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-cyan-300 transition hover:bg-cyan-400/20', CLIP_SM)}>
                <Medal size={15} /> رتبه‌بندی جهانی
              </button>
                        <button onClick={() => navigate('/times')} className={cn('flex items-center gap-2 border border-amber-400/40 bg-amber-400/10 px-7 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-amber-300 transition hover:bg-amber-400/20', CLIP_SM)}>
            📰 نکسوس تایمز
          </button>
            </div>
          </div>

          {/* رادار تزئینی HERO */}
          <div className="relative mx-auto hidden h-72 w-72 lg:block" style={{ animation: 'floatY 6s ease-in-out infinite' }}>
            <div className="absolute inset-0 rounded-full border border-cyan-400/30" />
            <div className="absolute inset-6 rounded-full border border-cyan-400/20" />
            <div className="absolute inset-12 rounded-full border border-cyan-400/15" />
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(34,211,238,.4), transparent 80deg)', animation: 'nxSpin 3s linear infinite' }} />
            <span className="absolute left-[30%] top-[40%] h-2 w-2 animate-ping rounded-full bg-red-400" />
            <span className="absolute left-[65%] top-[60%] h-2 w-2 animate-ping rounded-full bg-amber-400" style={{ animationDelay: '0.7s' }} />
            <span className="absolute left-[55%] top-[25%] h-2 w-2 animate-ping rounded-full bg-fuchsia-400" style={{ animationDelay: '1.3s' }} />
            <div className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.4)]"><Radar size={28} className="text-cyan-300" /></div>
          </div>
        </div>


        {/* ─────────── 🛰 نقشه ماهواره‌ای تصرف جهانی ─────────── */}
    <HomeWorldMap />

    {/* ─────────── آمار ۲۴ ساعت ─────────── */}
    <div className="mt-16 border-y border-cyan-400/20 py-2" style={HAZARD}>
          <p className="flex items-center gap-2 px-3 font-display text-[9px] font-black uppercase tracking-[0.35em] text-cyan-300"><Activity size={11} /> ضربان ۲۴ ساعت گذشته آرنا</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard delay={0} icon={Swords} label="نبرد در ۲۴ ساعت" value={matches.length} cls="border-red-400/30 bg-red-400/5 text-red-300" />
          <StatCard delay={0.08} icon={Snowflake} label="تحریم جدید" value={sanctions.length} cls="border-cyan-400/30 bg-cyan-400/5 text-cyan-300" />
          <StatCard delay={0.16} icon={Search} label="عملیات جاسوسی" value={spies.length} cls="border-purple-400/30 bg-purple-400/5 text-purple-300" />
          <StatCard delay={0.24} icon={Users} label="فرمانده جدید" value={newUsers.length} cls="border-emerald-400/30 bg-emerald-400/5 text-emerald-300" />
          <StatCard delay={0.32} icon={Trophy} label="جام فعال" value={tours.length} cls="border-amber-400/30 bg-amber-400/5 text-amber-300" />
          <StatCard delay={0.4} icon={Banknote} label="جوایز پرداختی (WD)" value={matches.filter((m) => m.status === 'finished').length * 150} cls="border-fuchsia-400/30 bg-fuchsia-400/5 text-fuchsia-300" />
        </div>

        {/* ─────────── نمودار + فید زنده ─────────── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={cn('border border-white/10 bg-[#0a0c08]/85 p-5 backdrop-blur-xl', CLIP)}>
            <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><Zap size={12} /> نمودار فعالیت ساعت‌به‌ساعت</p>
            <div className="flex h-40 items-end gap-1">
              {hours.map((h, i) => (
                <div key={i} className="group relative flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: Math.max(6, (h.count / maxCount) * 150) }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03, duration: 0.5, ease: 'easeOut' }}
                    className={cn('w-full rounded-t transition-colors', h.count ? 'bg-gradient-to-t from-cyan-500/50 to-fuchsia-400/80 group-hover:from-cyan-400 group-hover:to-fuchsia-300' : 'bg-white/10')}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/90 px-1.5 py-0.5 text-[8px] text-white opacity-0 transition group-hover:opacity-100">{toFa(h.count)} رویداد</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[8px] text-slate-600">
              <span>۲۴ ساعت پیش</span><span>۱۲ ساعت پیش</span><span>اکنون</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={cn('border border-white/10 bg-[#0a0c08]/85 p-5 backdrop-blur-xl', CLIP)}>
            <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-red-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> فید زنده رویدادها
            </p>
            <div className="chat-scroll max-h-64 space-y-2 overflow-y-auto">
              {feed.length === 0 ? <p className="py-8 text-center text-xs text-slate-600">آرنا آرام است... اولین اتفاق را تو بساز!</p> : feed.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={cn('flex items-center gap-3 border p-2.5 text-[10px]', CLIP_SM, e.cls)}>
                  <e.icon size={13} className="shrink-0" />
                  <span className="flex-1 leading-4 text-slate-300">{e.txt}</span>
                  <span className="shrink-0 text-[8px] text-slate-500">{timeAgo(e.t)}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ─────────── برترین‌ها + جام‌ها ─────────── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={cn('border border-amber-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
            <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300"><Medal size={12} /> فرماندهان برتر ۲۴ ساعت</p>
            {top.length === 0 ? <p className="py-6 text-center text-xs text-slate-600">هنوز نبردی تمام نشده — اولین قهرمان باش!</p> : top.map(([id, w], i) => (
              <div key={id} className={cn('mb-2 flex items-center gap-3 border p-3', CLIP_SM, i === 0 ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10 bg-white/5')}>
                <span className="font-display text-lg font-black text-white">#{toFa(i + 1)}</span>
                <span className="flex-1 text-xs font-bold text-white">{nameOf(id)}</span>
                <span className="text-[10px] font-black text-amber-300">{toFa(w)} پیروزی</span>
                {i === 0 && <Skull size={14} className="text-amber-300" />}
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
            <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><Trophy size={12} /> جام‌های در حال برگزاری</p>
            {tours.length === 0 ? <p className="py-6 text-center text-xs text-slate-600">جامی فعال نیست — ادمین به‌زودی شروع می‌کند!</p> : tours.map((t) => (
              <div key={t.id} className={cn('mb-2 border border-cyan-400/30 bg-cyan-400/5 p-3', CLIP_SM)}>
                <p className="flex items-center justify-between text-xs font-bold text-white">
                  🏆 {t.title}
                  <span className="font-display text-[10px] tabular-nums text-amber-300">⏱ {t.next_round_at ? countdown(t.next_round_at) : '—'}</span>
                </p>
                <button onClick={() => navigate('/war')} className="mt-2 flex items-center gap-1 text-[9px] font-black text-cyan-300 hover:text-white">
                  شرکت در نبردها <ChevronLeft size={11} />
                </button>
              </div>
            ))}
          </motion.div>
        </div>

        {/* CTA پایانی */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className={cn('relative mt-14 overflow-hidden border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500/10 via-red-500/10 to-cyan-500/10 p-10 text-center', CLIP)}>
          <div className="absolute inset-x-0 top-0 h-2" style={HAZARD} />
          <h2 className="font-display text-2xl font-black text-white md:text-4xl">امپراتوری‌ات را همین حالا بساز</h2>
          <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-slate-400">{toFa(countries.length)} کشور فعال در آرنا منتظر چالش تو هستند. تاریخ را قهرمانان می‌نویسند — نه تماشاگران.</p>
          <button onClick={() => navigate(user ? '/war' : '/claim')} className={cn('mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-amber-500 px-10 py-4 font-display text-xs font-black uppercase tracking-[0.3em] text-slate-950 shadow-[0_0_40px_rgba(239,68,68,0.4)] transition hover:brightness-110', CLIP_SM)}>
            <Flame size={15} /> شروع فرماندهی
          </button>
        </motion.div>
      </div>
    </div>
  );
}