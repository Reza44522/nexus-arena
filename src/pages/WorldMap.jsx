import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Swords, Snowflake, Shield, Eye, Zap, Users, X, Crosshair } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const ALLIANCE_COLORS = ['border-cyan-400/80 shadow-[0_0_16px_rgba(34,211,238,0.6)]', 'border-fuchsia-400/80 shadow-[0_0_16px_rgba(232,121,249,0.6)]', 'border-emerald-400/80 shadow-[0_0_16px_rgba(52,211,153,0.6)]', 'border-amber-400/80 shadow-[0_0_16px_rgba(251,191,36,0.6)]', 'border-rose-400/80 shadow-[0_0_16px_rgba(251,113,133,0.6)]'];

/* سیلوئت هولوگرافیک قاره‌ها (مختصات 360x180) */
const CONTINENTS = [
  [[15,22],[50,20],[90,18],[110,28],[125,40],[115,45],[105,55],[100,65],[85,70],[75,70],[65,60],[55,50],[45,35],[25,30]],
  [[135,30],[150,22],[160,15],[140,10],[120,15]],
  [[100,80],[120,80],[130,90],[145,98],[140,110],[125,125],[115,140],[110,145],[105,135],[110,110],[100,95]],
  [[170,54],[170,46],[180,40],[175,32],[185,28],[195,20],[210,20],[220,25],[220,42],[210,45],[205,52],[195,52],[190,46]],
  [[170,55],[190,53],[210,58],[223,78],[230,80],[220,95],[215,110],[210,120],[200,125],[192,108],[188,86],[170,85],[163,75]],
  [[220,25],[225,20],[270,15],[320,18],[358,24],[350,30],[330,40],[315,55],[300,65],[285,80],[280,85],[275,75],[268,68],[260,82],[250,70],[240,65],[235,65],[230,60],[225,50],[220,42]],
  [[294,120],[295,112],[305,105],[315,102],[322,101],[330,112],[333,120],[326,129],[315,125],[304,123]],
];

const COORDS = {
  'iran': [32, 53], 'ایران': [32, 53], 'united states': [38, -97], 'usa': [38, -97], 'آمریکا': [38, -97],
  'russia': [60, 100], 'روسیه': [60, 100], 'china': [35, 105], 'چین': [35, 105], 'saudi arabia': [24, 45],
  'عربستان سعودی': [24, 45], 'عربستان': [24, 45], 'kuwait': [29.5, 47.5], 'کویت': [29.5, 47.5],
  'uae': [24, 54], 'امارات': [24, 54], 'iraq': [33, 44], 'عراق': [33, 44], 'turkey': [39, 35], 'ترکیه': [39, 35],
  'israel': [31, 35], 'اسرائیل': [31, 35], 'egypt': [26, 30], 'مصر': [26, 30], 'germany': [51, 10], 'آلمان': [51, 10],
  'france': [46, 2], 'فرانسه': [46, 2], 'united kingdom': [54, -2], 'انگلستان': [54, -2], 'بریتانیا': [54, -2],
  'japan': [36, 138], 'ژاپن': [36, 138], 'south korea': [36, 128], 'کره جنوبی': [36, 128], 'north korea': [40, 127], 'کره شمالی': [40, 127],
  'india': [21, 78], 'هند': [21, 78], 'pakistan': [30, 70], 'پاکستان': [30, 70], 'brazil': [-10, -55], 'برزیل': [-10, -55],
  'canada': [56, -106], 'کانادا': [56, -106], 'australia': [-25, 134], 'استرالیا': [-25, 134], 'italy': [42, 12], 'ایتالیا': [42, 12],
  'spain': [40, -4], 'اسپانیا': [40, -4], 'syria': [35, 38], 'سوریه': [35, 38], 'qatar': [25.3, 51.2], 'قطر': [25.3, 51.2],
  'bahrain': [26, 50.5], 'بحرین': [26, 50.5], 'oman': [21, 57], 'عمان': [21, 57], 'jordan': [31, 36], 'اردن': [31, 36],
  'lebanon': [34, 36], 'لبنان': [34, 36], 'yemen': [15.5, 48], 'یمن': [15.5, 48], 'afghanistan': [33, 65], 'افغانستان': [33, 65],
  'ukraine': [49, 32], 'اوکراین': [49, 32], 'poland': [52, 19], 'لهستان': [52, 19], 'sweden': [62, 15], 'سوئد': [62, 15],
  'greece': [39, 22], 'یونان': [39, 22], 'mexico': [23, -102], 'مکزیک': [23, -102], 'argentina': [-34, -64], 'آرژانتین': [-34, -64],
  'venezuela': [7, -66], 'ونزوئلا': [7, -66], 'cuba': [21.5, -79.5], 'کوبا': [21.5, -79.5], 'south africa': [-29, 25], 'آفریقای جنوبی': [-29, 25],
  'nigeria': [9.5, 8], 'نیجریه': [9.5, 8], 'libya': [27, 17.5], 'لیبی': [27, 17.5], 'algeria': [28, 2.5], 'الجزایر': [28, 2.5],
  'morocco': [32, -6], 'مراکش': [32, -6], 'indonesia': [-2, 118], 'اندونزی': [-2, 118], 'malaysia': [4, 109], 'مالزی': [4, 109],
  'vietnam': [16, 106], 'ویتنام': [16, 106], 'thailand': [15.5, 101], 'تایلند': [15.5, 101], 'philippines': [12.5, 122.5], 'فیلیپین': [12.5, 122.5],
  'kazakhstan': [48, 68], 'قزاقستان': [48, 68], 'turkmenistan': [39, 59.5], 'ترکمنستان': [39, 59.5], 'azerbaijan': [40.3, 47.8], 'آذربایجان': [40.3, 47.8],
  'armenia': [40.2, 44.5], 'ارمنستان': [40.2, 44.5], 'georgia': [42.2, 43.5], 'گرجستان': [42.2, 43.5], 'netherlands': [52, 5], 'هلند': [52, 5],
};
const hashPos = (id) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997; return { x: 8 + (h % 84), y: 14 + ((h * 7) % 62) }; };
const posOf = (c) => {
  const co = COORDS[(c.name_en || '').toLowerCase()] || COORDS[c.name_en] || COORDS[c.name_fa];
  if (co) return { x: ((co[1] + 180) / 360) * 100, y: ((90 - co[0]) / 180) * 100 };
  return hashPos(c.id);
};

/* ─────────── WorldMap v2 — نقشه هولوگرافیک واقعی جهان ─────────── */
export default function WorldMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [myCountry, setMyCountry] = useState(null);
  const [wars, setWars] = useState([]);
  const [power, setPower] = useState({});
  const [wins, setWins] = useState({});
  const [allByCountry, setAllByCountry] = useState({});
  const [alliances, setAlliances] = useState([]);
  const [sel, setSel] = useState(null);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    const [cR, mR, iR, aR, amR, myR] = await Promise.all([
      supabase.from('player_countries').select('id, name_fa, name_en, flag, user_id, population, sanctions'),
      supabase.from('war_matches').select('*').limit(200),
      supabase.from('military_inventory').select('country_id, power, qty').limit(3000),
      supabase.from('alliances').select('id, name, emblem').limit(100),
      supabase.from('alliance_members').select('user_id, alliance_id').limit(1000),
      supabase.from('player_countries').select('id').eq('user_id', user?.id).maybeSingle(),
    ]);
    const cs = cR.data || [];
    setCountries(cs);
    setMyCountry(myR.data || null);
    setWars((mR.data || []).filter((m) => m.status !== 'finished'));
    const pw = {};
    (iR.data || []).forEach((x) => { pw[x.country_id] = (pw[x.country_id] || 0) + Number(x.power) * x.qty; });
    setPower(pw);
    const wn = {};
    (mR.data || []).forEach((m) => { if (m.status === 'finished' && m.winner_country) wn[m.winner_country] = (wn[m.winner_country] || 0) + 1; });
    setWins(wn);
    const byUser = {};
    cs.forEach((c) => { byUser[c.user_id] = c.id; });
    const abc = {};
    (amR.data || []).forEach((mm) => { const cid = byUser[mm.user_id]; if (cid) abc[cid] = mm.alliance_id; });
    setAllByCountry(abc);
    setAlliances(aR.data || []);
  };

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    const ch = supabase.channel('worldmap-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'war_matches' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_countries' }, () => load())
      .subscribe();
    return () => { clearInterval(t); supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, []);

  const posMap = useMemo(() => { const m = {}; countries.forEach((c) => { m[c.id] = posOf(c); }); return m; }, [countries]);
  const atWar = useMemo(() => { const s = new Set(); wars.forEach((m) => { s.add(m.attacker_country); s.add(m.defender_country); }); return s; }, [wars]);
  const sanActive = (c) => c.sanctions && c.sanctions.until && new Date(c.sanctions.until) > new Date(now);
  const allIndexOf = (cid) => { const aid = allByCountry[cid]; if (!aid) return -1; return alliances.findIndex((a) => a.id === aid); };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes dashMove { to { stroke-dashoffset: -20; } }
        @keyframes scanX { 0% { left: -10%; } 100% { left: 110%; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes oceanPulse { 0%,100% { opacity: .5; } 50% { opacity: .9; } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(34,211,238,.5); transform: none; } 92% { text-shadow: -3px 0 #22d3ee, 3px 0 #e879f9; transform: translateX(2px); } 94% { text-shadow: 3px 0 #22d3ee, -3px 0 #e879f9; transform: translateX(-2px); } 96% { text-shadow: 0 0 26px rgba(34,211,238,.5); transform: none; } }
      `}</style>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[360px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute top-10 right-1/4 h-[300px] w-[440px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.65) 100%)' }} />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* هدر */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 font-mono text-[10px] tracking-[0.4em] text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" style={{ animation: 'blinkDot 1.6s infinite' }} /> GLOBAL THEATER // LIVE
            </p>
            <h1 className="font-display text-3xl font-black text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
              نقشه <span className="text-gradient">جهان</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className={cn('flex items-center gap-1.5 border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 font-bold text-cyan-300', CLIP_SM)}><Globe size={11} /> {toFa(countries.length)} کشور</span>
            <span className={cn('flex items-center gap-1.5 border border-red-400/40 bg-red-400/10 px-2.5 py-1 font-bold text-red-300', CLIP_SM)}><Swords size={11} /> {toFa(wars.length)} جنگ فعال</span>
            <span className={cn('flex items-center gap-1.5 border border-fuchsia-400/40 bg-fuchsia-400/10 px-2.5 py-1 font-bold text-fuchsia-300', CLIP_SM)}><Shield size={11} /> {toFa(alliances.length)} اتحاد</span>
            <span className={cn('flex items-center gap-1.5 border border-cyan-300/40 bg-cyan-300/10 px-2.5 py-1 font-bold text-cyan-200', CLIP_SM)}><Snowflake size={11} /> {toFa(countries.filter(sanActive).length)} کشور تحریم</span>
          </div>
        </div>

        {/* ─────────── نقشه ─────────── */}
        <div className={cn('relative w-full overflow-hidden border border-cyan-400/30 bg-[#03101d]/95', CLIP)} style={{ aspectRatio: '2 / 1' }}>
          {/* اقیانوس */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(14,60,90,.5), rgba(3,16,29,.9) 75%)', animation: 'oceanPulse 6s infinite' }} />
          {/* قاره‌های هولوگرافیک + خطوط مختصات + جنگ‌ها */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 180" preserveAspectRatio="none">
            {/* خطوط مدار و نصف‌النهار */}
            {Array.from({ length: 11 }, (_, i) => (<line key={'v' + i} x1={i * 36} y1="0" x2={i * 36} y2="180" stroke="rgba(34,211,238,0.08)" strokeWidth="0.3" />))}
            {Array.from({ length: 5 }, (_, i) => (<line key={'h' + i} x1="0" y1={(i + 1) * 30} x2="360" y2={(i + 1) * 30} stroke="rgba(34,211,238,0.08)" strokeWidth="0.3" />))}
            <line x1="0" y1="90" x2="360" y2="90" stroke="rgba(34,211,238,0.25)" strokeWidth="0.4" strokeDasharray="2 2" />
            {/* قاره‌ها */}
            {CONTINENTS.map((poly, i) => (
              <polygon key={i} points={poly.map((p) => p.join(',')).join(' ')} fill="rgba(34,211,238,0.07)" stroke="rgba(34,211,238,0.35)" strokeWidth="0.5" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.35))' }} />
            ))}
            {/* خطوط جنگ */}
            {wars.map((m) => {
              const a = posMap[m.attacker_country]; const b = posMap[m.defender_country];
              if (!a || !b) return null;
              const ax = a.x * 3.6, ay = a.y * 1.8, bx = b.x * 3.6, by = b.y * 1.8;
              const mx = (ax + bx) / 2, my = Math.max(4, (ay + by) / 2 - 18);
              return (
                <g key={m.id}>
                  <path d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`} fill="none" stroke="rgba(239,68,68,0.75)" strokeWidth="0.6" strokeDasharray="2 1.6" style={{ animation: 'dashMove 1.2s linear infinite' }} />
                  <circle r="1.1" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 2px #ef4444)' }}>
                    <animateMotion dur="2s" repeatCount="indefinite" path={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`} />
                  </circle>
                </g>
              );
            })}
          </svg>
          {/* خط اسکن متحرک */}
          <div className="absolute bottom-0 top-0 w-20 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" style={{ animation: 'scanX 6s linear infinite' }} />

          {/* گره‌های کشورها */}
          {countries.map((c) => {
            const p = posMap[c.id];
            if (!p) return null;
            const mine = myCountry?.id === c.id;
            const ai = allIndexOf(c.id);
            const war = atWar.has(c.id);
            return (
              <button key={c.id} onClick={() => setSel(c)} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x + '%', top: p.y + '%' }}>
                {war && <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />}
                <span className={cn('relative grid h-10 w-10 place-items-center rounded-full border-2 bg-[#0a0c08]/95 text-lg transition group-hover:scale-125', mine ? 'border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.9)]' : ai >= 0 ? ALLIANCE_COLORS[ai % ALLIANCE_COLORS.length] : 'border-white/25')}>
                  {c.flag}
                  {sanActive(c) && <span className="absolute -right-1.5 -top-1.5 text-[11px]">🥶</span>}
                  {war && <span className="absolute -left-1.5 -top-1.5 text-[11px]">⚔️</span>}
                </span>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/90 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {c.name_fa}
                </span>
              </button>
            );
          })}

          {/* گوشه‌های HUD */}
          <span className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-cyan-400/60" />
          <span className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-cyan-400/60" />
          <span className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-cyan-400/60" />
          <span className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-cyan-400/60" />

          {/* راهنما */}
          <div className={cn('absolute bottom-3 right-3 border border-white/10 bg-black/85 p-3 text-[9px] text-slate-400', CLIP_SM)}>
            <p className="mb-1 font-black text-white">راهنما:</p>
            <p><span className="text-cyan-300">●</span> کشور تو • <span className="text-red-400">⚔️</span> در جنگ • 🥶 تحریم‌شده</p>
            <p className="mt-1">حلقه رنگی = اتحاد • خط قرمز متحرک = جبهه جنگ</p>
          </div>
        </div>

        {/* ─────────── پرونده کشور انتخاب‌شده ─────────── */}
        {sel && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn('mt-6 border border-cyan-400/40 bg-[#0a0c08]/90 p-6', CLIP)}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-cyan-400/50 bg-cyan-400/10 text-3xl">{sel.flag}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-black text-white">{sel.name_fa || sel.name_en}</p>
                <p className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><Users size={10} /> جمعیت: {fmtNum(sel.population || 0)}</span>
                  <span className="flex items-center gap-1 text-red-300"><Zap size={10} /> قدرت: {fmtNum(power[sel.id] || 0)}</span>
                  <span className="flex items-center gap-1 text-emerald-300">🏆 بردها: {toFa(wins[sel.id] || 0)}</span>
                  <span className="flex items-center gap-1 text-fuchsia-300"><Shield size={10} /> {allIndexOf(sel.id) >= 0 ? alliances[allIndexOf(sel.id)]?.name : 'بدون اتحاد'}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/intel/${sel.id}`)} className={cn('flex items-center gap-1.5 border border-purple-400/40 bg-purple-400/10 px-4 py-2.5 text-[10px] font-black text-purple-300 hover:bg-purple-400/20', CLIP_SM)}>
                  <Eye size={12} /> پرونده اطلاعاتی
                </button>
                <button onClick={() => navigate('/war')} className={cn('flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-amber-500 px-4 py-2.5 text-[10px] font-black text-slate-950', CLIP_SM)}>
                  <Crosshair size={12} /> اعلام جنگ
                </button>
                <button onClick={() => setSel(null)} className="grid h-9 w-9 place-items-center text-slate-500 hover:text-white"><X size={14} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}