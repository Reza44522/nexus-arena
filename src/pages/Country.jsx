import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Users, Ruler, Factory, PackageOpen, Crown, Banknote, ArrowUpCircle, HandCoins, Pencil, X, Shield, Radar, Swords, Trophy, Search, Snowflake, Medal, Globe, Zap, Eye, Activity, Award, HeartHandshake, ChevronLeft, Flame, ScrollText, Clock, Target, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RESOURCES, CABINET_ROLES, toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const HAZARD = { background: 'repeating-linear-gradient(45deg, rgba(251,191,36,.14) 0 10px, transparent 10px 20px)' };
const SHIMMER = { backgroundImage: 'linear-gradient(110deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.35) 50%, rgba(255,255,255,0) 65%)', backgroundSize: '200% 100%', animation: 'shimmer 2.6s linear infinite' };
const pad = (n) => String(n).padStart(2, '0');
const MAX_LEVEL = 10;
const DAY = 24 * 3600 * 1000;
const UPGRADE_BASE = { wood: 100, gold: 250, iron: 150, copper: 140, silver: 200, oil: 220, gas: 210, uranium: 400 };
const upgradeCost = (comp) => (UPGRADE_BASE[comp.resource] || 150) * comp.level;
const SAN_LABEL = { sell_mult: 'فروش بازار', buy_mult: 'خرید بازار', tax_mult: 'مالیات روزانه', collect_mult: 'استخراج شرکت‌ها', buy_cost_mult: 'خرید تجهیزات' };

/* ─────────── درجه‌های نظامی واقعی ─────────── */
const IR_RANKS = [
  { w: 0, t: 'سرباز دوم', s: {} }, { w: 1, t: 'سرباز اول', s: { chevrons: 1 } }, { w: 2, t: 'گروهبان سوم', s: { chevrons: 2 } },
  { w: 4, t: 'گروهبان دوم', s: { chevrons: 3 } }, { w: 6, t: 'گروهبان یکم', s: { chevrons: 3, arcs: 1 } }, { w: 8, t: 'استوار دوم', s: { chevrons: 3, arcs: 2 } },
  { w: 10, t: 'استوار یکم', s: { chevrons: 3, arcs: 3 } }, { w: 12, t: 'ستوان سوم', s: { stars: 1 } }, { w: 15, t: 'ستوان دوم', s: { stars: 2 } },
  { w: 18, t: 'ستوان یکم', s: { stars: 3 } }, { w: 21, t: 'سروان', s: { stars: 1, sword: true } }, { w: 24, t: 'سرگرد', s: { stars: 2, sword: true } },
  { w: 28, t: 'سرهنگ دوم', s: { stars: 3, sword: true } }, { w: 32, t: 'سرهنگ', s: { stars: 3, sword: true, arcs: 1 } }, { w: 36, t: 'سرتیپ دوم', s: { stars: 1, wreath: true } },
  { w: 40, t: 'سرتیپ', s: { stars: 2, wreath: true } }, { w: 45, t: 'سرلشکر', s: { stars: 3, wreath: true } }, { w: 50, t: 'سپهبد', s: { stars: 4, wreath: true } }, { w: 55, t: 'ارتشبد', s: { stars: 5, wreath: true } },
];
const INTL_RANKS = [
  { w: 0, t: 'Private', s: {} }, { w: 1, t: 'Private First Class', s: { chevrons: 1 } }, { w: 3, t: 'Corporal', s: { chevrons: 2 } },
  { w: 5, t: 'Sergeant', s: { chevrons: 3 } }, { w: 8, t: 'Staff Sergeant', s: { chevrons: 3, arcs: 1 } }, { w: 11, t: 'Sergeant First Class', s: { chevrons: 3, arcs: 2 } },
  { w: 14, t: 'Master Sergeant', s: { chevrons: 3, arcs: 3 } }, { w: 17, t: 'Second Lieutenant', s: { bars: 1 } }, { w: 20, t: 'First Lieutenant', s: { bars: 1, silver: true } },
  { w: 23, t: 'Captain', s: { bars: 2 } }, { w: 26, t: 'Major', s: { leaf: true } }, { w: 29, t: 'Lieutenant Colonel', s: { leaf: true, silver: true } },
  { w: 32, t: 'Colonel', s: { eagle: true } }, { w: 36, t: 'Brigadier General', s: { stars: 1 } }, { w: 40, t: 'Major General', s: { stars: 2 } },
  { w: 45, t: 'Lieutenant General', s: { stars: 3 } }, { w: 50, t: 'General', s: { stars: 4 } },
];
const rankOf = (list, w) => { let r = list[0]; list.forEach((x) => { if (w >= x.w) r = x; }); return r; };
const nextRank = (list, w) => list.find((x) => w < x.w) || null;
function starPts(cx, cy, r) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    p.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
  }
  return p.join(' ');
}
function RankInsignia({ s = {}, size = 96 }) {
  const gold = '#fbbf24'; const silver = '#cbd5e1'; const col = s.silver ? silver : gold;
  const els = [];
  const n = s.stars || 0;
  if (n) {
    const xs = n === 1 ? [50] : n === 2 ? [36, 64] : n === 3 ? [26, 50, 74] : n === 4 ? [20, 40, 60, 80] : [14, 32, 50, 68, 86];
    xs.forEach((x, i) => els.push(<polygon key={'s' + i} points={starPts(x, s.wreath ? 30 : 24, s.wreath ? 9 : 8)} fill={col} />));
  }
  for (let i = 0; i < (s.chevrons || 0); i++) els.push(<path key={'c' + i} d={`M24 ${64 + i * 9} L50 ${54 + i * 9} L76 ${64 + i * 9}`} fill="none" stroke={col} strokeWidth="5" strokeLinecap="round" />);
  for (let i = 0; i < (s.arcs || 0); i++) els.push(<path key={'a' + i} d={`M28 ${94 - i * 7} Q50 ${87 - i * 7} 72 ${94 - i * 7}`} fill="none" stroke={col} strokeWidth="4" strokeLinecap="round" />);
  if (s.bars === 1) els.push(<rect key="b" x="38" y="20" width="24" height="9" rx="2" fill={col} />);
  if (s.bars === 2) els.push(<rect key="b1" x="28" y="20" width="19" height="9" rx="2" fill={col} />, <rect key="b2" x="53" y="20" width="19" height="9" rx="2" fill={col} />);
  if (s.leaf) els.push(<path key="l" d="M50 14 C63 22 63 38 50 45 C37 38 37 22 50 14 Z M50 18 L50 43" fill="none" stroke={col} strokeWidth="2.5" />);
  if (s.eagle) els.push(<text key="e" x="50" y="38" textAnchor="middle" fontSize="28">🦅</text>);
  if (s.sword) els.push(<path key="sw" d="M28 44 L72 44 M33 39 L33 49 M67 39 L67 49" stroke={col} strokeWidth="3" strokeLinecap="round" />);
  if (s.wreath) els.push(<path key="w1" d="M26 20 C18 32 20 44 33 49" fill="none" stroke={col} strokeWidth="3" />, <path key="w2" d="M74 20 C82 32 80 44 67 49" fill="none" stroke={col} strokeWidth="3" />);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-[0_0_16px_rgba(251,191,36,0.4)]">
      {els.length ? els : <circle cx="50" cy="50" r="5" fill={col} opacity="0.5" />}
    </svg>
  );
}

/* شمارنده انیمیشنی */
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
function ResourceCard({ r, value, delay }) {
  const v = useCountUp(value);
  return (
    <motion.div initial={{ opacity: 0, y: 16, rotateX: -20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay }} whileHover={{ y: -6, rotateY: 6 }} className={cn('relative border border-amber-400/20 bg-[#0a0c08]/85 p-3 text-center backdrop-blur-xl hover:border-amber-400/45', CLIP_SM)}>
      <span className="pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 border-l-2 border-t-2 border-amber-400/40" />
      <p className="text-2xl drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">{r.icon}</p>
      <p className="mt-1 text-[10px] text-slate-500">{r.label}</p>
      <p className="font-display text-sm font-black text-amber-300">{fmtNum(v)}</p>
    </motion.div>
  );
}
/* حلقه پیشرفت SVG */
function Ring({ value, max = 100, size = 92, stroke = 8, color = '#fbbf24', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, max > 0 ? value / max : 0);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.2, ease: 'easeOut' }} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
/* ذرات شناور */
function Particles({ n = 26 }) {
  const dots = useMemo(() => Array.from({ length: n }, () => ({ l: Math.random() * 100, t: Math.random() * 100, d: 4 + Math.random() * 8, dl: Math.random() * 5, s: 1 + Math.random() * 2 })), [n]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((p, i) => (
        <span key={i} className="absolute rounded-full bg-amber-400/40" style={{ left: p.l + '%', top: p.t + '%', width: p.s, height: p.s, animation: `floatP ${p.d}s ease-in-out ${p.dl}s infinite` }} />
      ))}
    </div>
  );
}

/* ─────────── Country v4 — IMPERIUM ─────────── */
export default function Country() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [country, setCountry] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [wd, setWd] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const [showCabinet, setShowCabinet] = useState(false);
  const [cabinetForm, setCabinetForm] = useState({});
  const [tab, setTab] = useState('overview');
  const [mil, setMil] = useState([]);
  const [matches, setMatches] = useState([]);
  const [spies, setSpies] = useState([]);
  const [mySans, setMySans] = useState([]);
  const [alliance, setAlliance] = useState(null);
  const [allWars, setAllWars] = useState([]);
  const [rankModel, setRankModel] = useState(() => localStorage.getItem('nexus-rank-model-' + (user?.id || 'x')) || 'ir');
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3000); };

  const load = async () => {
    if (!user?.id) return;
    const { data: c } = await supabase.from('player_countries').select('*').eq('user_id', user.id).maybeSingle();
    setCountry(c || null);
    const { data: pr } = await supabase.from('profiles').select('war_dollars').eq('id', user.id).single();
    setWd(pr?.war_dollars ?? 0);
    if (c) {
      const [comps, inv, wm, sp, sa, am, aw] = await Promise.all([
        supabase.from('companies').select('*').eq('country_id', c.id).order('created_at'),
        supabase.from('military_inventory').select('*').eq('country_id', c.id),
        supabase.from('war_matches').select('*').or(`attacker_country.eq.${c.id},defender_country.eq.${c.id}`).order('created_at', { ascending: false }).limit(30),
        supabase.from('spy_ops').select('*').or(`spy_country.eq.${c.id},target_country.eq.${c.id}`).order('created_at', { ascending: false }).limit(30),
        supabase.from('sanctions').select('*').eq('defender_country', c.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('alliance_members').select('role, alliance:alliances(id, name, emblem)').eq('user_id', user.id).maybeSingle(),
        supabase.from('alliance_wars').select('*').eq('status', 'active').limit(10),
      ]);
      setCompanies(comps.data || []);
      setMil(inv.data || []);
      setMatches(wm.data || []);
      setSpies(sp.data || []);
      setMySans(sa.data || []);
      setAlliance(am.data?.alliance ? { ...am.data.alliance, role: am.data.role } : null);
      setAllWars(aw.data || []);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel('country-' + user.id + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_countries' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  const collect = async (comp) => {
    setBusy(comp.id);
    const { data, error } = await supabase.rpc('collect_company', { p_company_id: comp.id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`✅ ${RESOURCES[comp.resource]?.icon || ''} ${toFa(data.amount)} واحد ${RESOURCES[comp.resource]?.label || ''} به ذخایر اضافه شد!`);
    load();
  };
  const upgrade = async (comp) => {
    setBusy('up-' + comp.id);
    const { data, error } = await supabase.rpc('upgrade_company', { p_company_id: comp.id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`⬆️ پایگاه ${RESOURCES[comp.resource]?.label} به سطح ${toFa(comp.level + 1)} ارتقا یافت (−${toFa(data.cost)} WD)`);
    load();
  };
  const collectTax = async () => {
    setBusy('tax');
    const { data, error } = await supabase.rpc('collect_tax');
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`💵 ${toFa(data.amount)} دلار جنگ (WD) بودجه جنگی دریافت شد!`);
    load();
  };
  const migrate = async (tier) => {
    setBusy('mig' + tier);
    const { data, error } = await supabase.rpc('migrate_population', { p_tier: tier });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`👥 ${toFa(data.add)} مهاجر جدید به کشورت پیوستند (−${toFa(data.cost)} WD)`);
    load();
  };
  const openCabinet = () => {
    const form = {};
    CABINET_ROLES.forEach((r) => { form[r] = (country.cabinet || []).find((m) => m.role === r)?.name || ''; });
    setCabinetForm(form);
    setShowCabinet(true);
  };
  const saveCabinet = async () => {
    const cab = Object.entries(cabinetForm).filter(([, n]) => n?.trim()).map(([role, name]) => ({ role, name: name.trim() }));
    const { error } = await supabase.from('player_countries').update({ cabinet: cab }).eq('id', country.id);
    if (error) return flash('❌ ' + error.message);
    setShowCabinet(false);
    flash('✅ کابینه دولت به‌روزرسانی شد');
    load();
  };

  if (!country) {
    return (
      <div className="relative min-h-screen px-4 pt-32 text-center">
        <p className="text-slate-400">هنوز کشوری انتخاب نکرده‌ای.</p>
        <a href="/claim" className={cn('mt-4 inline-block bg-gradient-to-r from-amber-400 to-red-500 px-6 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950', CLIP_SM)}>🗺 انتخاب کشور</a>
      </div>
    );
  }

  /* ─── محاسبات ─── */
  const totalPower = mil.reduce((s, m) => s + Number(m.power) * m.qty, 0);
  const finishedMine = matches.filter((m) => m.status === 'finished' && m.winner_country);
  const wins = finishedMine.filter((m) => m.winner_country === country.id).length;
  const losses = finishedMine.length - wins;
  const RLIST = rankModel === 'ir' ? IR_RANKS : INTL_RANKS;
  const rank = rankOf(RLIST, wins);
  const nxt = nextRank(RLIST, wins);
  const spyOnMe = spies.filter((s) => s.target_country === country.id);
  const spyByMe = spies.filter((s) => s.spy_country === country.id);
  const sanActive = country.sanctions && country.sanctions.until && new Date(country.sanctions.until) > new Date() ? country.sanctions : null;
  const threat = Math.min(100, spyOnMe.filter((s) => new Date(s.created_at).getTime() > now - DAY).length * 25 + (sanActive ? 30 : 0));
  const dailyProd = companies.reduce((s, c) => s + c.rate_per_day * c.level, 0);
  const xp = wins * 100 + Math.floor(totalPower / 10) + companies.reduce((s, c) => s + c.level * 20, 0) + (country.cabinet || []).length * 10;
  const level = Math.floor(xp / 300) + 1;
  const countdown = (ts) => {
    const dd = new Date(ts).getTime() - now;
    if (dd <= 0) return 'پایان!';
    return `${pad(Math.floor(dd / 3600000))}:${pad(Math.floor((dd % 3600000) / 60000))}:${pad(Math.floor((dd % 60000) / 1000))}`;
  };
  const taxElapsed = country.last_tax_at ? now - new Date(country.last_tax_at).getTime() : DAY;
  const taxReady = taxElapsed >= DAY;
  const taxRemain = Math.max(0, DAY - taxElapsed);
  const th = Math.floor(taxRemain / 3600000), tm = Math.floor((taxRemain % 3600000) / 60000), ts2 = Math.floor((taxRemain % 60000) / 1000);
  const d = new Date(now);
  const natFeed = [
    ...finishedMine.map((m) => ({ t: m.finished_at || m.created_at, txt: (m.winner_country === country.id ? '🏆 ' : '💀 ') + (m.public_result || 'نبرد'), c: m.winner_country === country.id ? 'text-emerald-300' : 'text-red-300' })),
    ...spyOnMe.map((s) => ({ t: s.created_at, txt: '🕵️ عملیات جاسوسی دشمن از کشور', c: 'text-purple-300' })),
    ...mySans.map((s) => ({ t: s.created_at, txt: '🥶 تحریم جدید روی تو: ' + s.type, c: 'text-cyan-300' })),
  ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 8);
  const ORDERS = [
    { i: '💵', t: 'دریافت مالیات روزانه', ok: !taxReady },
    { i: '📦', t: 'استخراج از پایگاه‌ها', ok: companies.some((c) => (now - new Date(c.last_collect_at).getTime()) >= DAY) },
    { i: '🎖', t: 'قدرت نظامی ۱۰۰+', ok: totalPower >= 100 },
    { i: '👥', t: 'کابینه منصوب کن', ok: (country.cabinet || []).length >= 1 },
    { i: '🏆', t: 'یک نبرد ببر', ok: wins >= 1 },
    { i: '🏭', t: 'یک پایگاه را ارتقا بده', ok: companies.some((c) => c.level >= 2) },
  ];
  const ordersDone = ORDERS.filter((o) => o.ok).length;
  const ACH = [
    { i: '🥇', t: 'نخستین پیروزی', d: 'یک نبرد ببر', ok: wins >= 1 },
    { i: '🏆', t: 'فرمانده جنگ', d: '۳ پیروزی', ok: wins >= 3 },
    { i: '💰', t: 'بارون جنگ', d: '۱۰۰+ WD', ok: wd >= 1000 },
    { i: '🕵️', t: 'شبکه جاسوسی', d: 'اولین جاسوسی', ok: spyByMe.length >= 1 },
    { i: '🛡️', t: 'بازمانده', d: 'از جاسوسی دشمن جان به در برد', ok: spyOnMe.length >= 1 },
    { i: '🏭', t: 'صنعتگر', d: 'پایگاه سطح ۳', ok: companies.some((c) => c.level >= 3) },
    { i: '👥', t: 'ملت بزرگ', d: 'جمعیت ۲M+', ok: (country.population || 0) >= 2000000 },
    { i: '🎖️', t: 'ارتش فولاد', d: 'قدرت ۵۰+', ok: totalPower >= 500 },
    { i: '🤝', t: 'دیپلمات', d: 'عضو اتحاد', ok: !!alliance },
    { i: '🏛️', t: 'دولت کامل', d: '۶+ وزیر', ok: (country.cabinet || []).length >= 6 },
  ];
  const TABS = [
    { id: 'overview', label: 'نمای کلی', icon: Landmark },
    { id: 'military', label: 'ارتش', icon: Swords },
    { id: 'security', label: 'امنیت', icon: Shield },
    { id: 'record', label: 'کارنامه', icon: Trophy },
    { id: 'diplomacy', label: 'دیپلماسی', icon: HeartHandshake },
    { id: 'honors', label: 'نشان‌ها', icon: Award },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes nxSpin { to { transform: rotate(360deg); } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes aurora { from { transform: translate3d(-30px,0,0) scale(1); } to { transform: translate3d(40px,20px,0) scale(1.12); } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(251,191,36,.4); transform: none; } 92% { text-shadow: -2px 0 #ef4444, 2px 0 #fbbf24; transform: translateX(1px); } 94% { text-shadow: 2px 0 #ef4444, -2px 0 #fbbf24; transform: translateX(-1px); } 96% { text-shadow: 0 0 26px rgba(251,191,36,.4); transform: none; } }
        @keyframes typeW { from { width: 0; } to { width: 100%; } }
        @keyframes floatP { 0%,100% { transform: translateY(0); opacity: .3; } 50% { transform: translateY(-24px); opacity: .9; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes crt { 0% { opacity: .1; } 50% { opacity: .18; } 100% { opacity: .1; } }
        @keyframes warTick { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
      `}</style>

      {/* صحنه IMPERIUM */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[46vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(rgba(251,191,36,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,.5) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
        <div className="absolute -top-32 left-1/4 h-[380px] w-[520px] rounded-full bg-amber-500/10 blur-[130px]" style={{ animation: 'aurora 9s ease-in-out infinite alternate' }} />
        <div className="absolute top-10 right-1/4 h-[320px] w-[460px] rounded-full bg-red-600/10 blur-[120px]" style={{ animation: 'aurora 11s ease-in-out infinite alternate-reverse' }} />
        <div className="absolute top-1/3 left-1/2 h-[280px] w-[380px] rounded-full bg-fuchsia-600/10 blur-[110px]" style={{ animation: 'aurora 13s ease-in-out infinite alternate' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'64\' viewBox=\'0 0 56 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 0L56 16v32L28 64 0 48V16z\' fill=\'none\' stroke=\'%23fbbf24\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '56px 64px' }} />
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)', animation: 'crt 4s infinite' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.6) 100%)' }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" style={{ animation: 'scanY 7s linear infinite' }} />
        <Particles />
      </div>

      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-amber-400/40 bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(251,191,36,0.3)]', CLIP_SM)}>{notice}</motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl">
        {/* نوار CLASSIFIED + ساعت */}
        <div className="mb-6 flex items-center justify-between border-y border-amber-400/30 py-2" style={HAZARD}>
          <p className="flex items-center gap-2 px-3 font-display text-[9px] font-black uppercase tracking-[0.35em] text-amber-300"><Shield size={11} /> Top Secret // IMPERIUM Status Room</p>
          <p className="flex items-center gap-2 px-3 font-display text-[9px] uppercase tracking-[0.3em] text-red-400"><Clock size={11} /> {pad(d.getHours())}:{pad(d.getMinutes())}:{pad(d.getSeconds())}</p>
        </div>

        {/* تیکر رویدادهای ملی */}
        {natFeed.length > 0 && (
          <div className="relative mb-6 overflow-hidden border-y border-amber-400/20 bg-black/60 py-1.5">
            <p className="whitespace-nowrap font-display text-[10px] tracking-widest text-amber-300/80" style={{ animation: 'warTick 40s linear infinite' }}>
              📡 {natFeed.map((e) => e.txt).join('  ◆  ')}
            </p>
          </div>
        )}

        {/* ─────────── هدر امپراتوری ─────────── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className={cn('relative mb-6 border border-amber-400/30 bg-[#0a0c08]/90 p-6 backdrop-blur-xl', CLIP)}>
          <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-amber-400/60" />
          <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-red-500/60" />
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative h-28 w-28 shrink-0">
              <div className="absolute inset-0 rounded-full border border-amber-400/30" />
              <div className="absolute inset-3 rounded-full border border-amber-400/20" />
              <div className="absolute inset-6 rounded-full border border-amber-400/10" />
              <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(251,191,36,.35), transparent 70deg)', animation: 'nxSpin 4s linear infinite' }} />
              <div className={cn('absolute inset-0 m-auto grid h-16 w-16 place-items-center bg-gradient-to-br from-amber-400/20 to-red-500/20 text-3xl', CLIP_SM)}>{country.flag || '🌐'}</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-amber-400/70">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
                Imperial Status Room // Live
              </p>
              <h1 className="mt-1 font-display text-3xl font-black text-white md:text-4xl" style={{ animation: 'glitch 4s infinite' }}>{country.name_fa || country.name_en}</h1>
              <p className="mt-1 overflow-hidden whitespace-nowrap font-mono text-[10px] tracking-[0.3em] text-amber-400/70" style={{ animation: 'typeW 3s steps(40) 1 both' }}>
                فرماندهی کل // اقتصاد // ارتش // دیپلماسی // اطلاعات
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className={cn('flex items-center gap-1.5 border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300', CLIP_SM)}><Landmark size={11} className="text-amber-300" /> پایتخت: {country.capital_fa || '—'}</span>
                <span className={cn('flex items-center gap-1.5 border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300', CLIP_SM)}><Users size={11} className="text-red-400" /> جمعیت: {fmtNum(country.population || 0)}</span>
                <span className={cn('flex items-center gap-1.5 border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300', CLIP_SM)}><Ruler size={11} className="text-amber-300" /> مساحت: {country.area_km2 ? fmtNum(country.area_km2) + ' km²' : '—'}</span>
                <span className={cn('flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 font-bold text-emerald-300', CLIP_SM)}><Banknote size={11} /> {fmtNum(wd)} WD</span>
                <span className={cn('flex items-center gap-1.5 border border-red-400/40 bg-red-400/10 px-2.5 py-1 font-bold text-red-300', CLIP_SM)}><Zap size={11} /> قدرت: {fmtNum(totalPower)}</span>
                <span className={cn('flex items-center gap-1.5 border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 font-bold text-cyan-300', CLIP_SM)}><Activity size={11} /> تولید: {toFa(dailyProd)}/روز</span>
              </div>
            </div>
            {/* حلقه سطح ملی */}
            <div className="flex flex-col items-center gap-1">
              <Ring value={xp % 300} max={300} size={104} color="#fbbf24">
                <div className="text-center">
                  <p className="font-display text-2xl font-black text-white">{toFa(level)}</p>
                  <p className="text-[8px] uppercase tracking-widest text-amber-300">سطح ملی</p>
                </div>
              </Ring>
              <p className="text-[9px] text-slate-500">{toFa(xp % 300)}/۳۰۰ XP</p>
            </div>
            {/* دسترسی سریع */}
            <div className="flex flex-col gap-2">
              {[{ to: '/war', l: 'اتاق جنگ', i: Swords, c: 'text-red-300 border-red-400/40 bg-red-400/10' }, { to: '/military', l: 'فروشگاه نظامی', i: Shield, c: 'text-amber-300 border-amber-400/40 bg-amber-400/10' }, { to: '/market', l: 'بازار جهانی', i: Banknote, c: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' }, { to: '/diplomacy', l: 'دیپلماسی', i: Globe, c: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' }, { to: '/missions', l: 'مأموریت‌ها', i: ScrollText, c: 'text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-400/10' }, { to: '/spy', l: 'جاسوسی', i: Eye, c: 'text-purple-300 border-purple-400/40 bg-purple-400/10' }, { to: '/council', l: 'شورای امنیت', i: Landmark, c: 'text-blue-300 border-blue-400/40 bg-blue-400/10' } , { to: '/tech', l: 'درخت فناوری', i: Zap, c: 'text-lime-300 border-lime-400/40 bg-lime-400/10' }].map((q) => (
                <motion.button key={q.to} whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(q.to)} className={cn('flex items-center gap-2 border px-4 py-2 text-[10px] font-black transition hover:brightness-125', CLIP_SM, q.c)}>
                  <q.i size={12} /> {q.l} <ChevronLeft size={11} />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* تب‌ها */}
        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <motion.button key={t.id} whileTap={{ scale: 0.92 }} whileHover={{ y: -2 }} onClick={() => setTab(t.id)} className={cn('relative flex items-center gap-2 border px-5 py-2.5 font-display text-[10px] font-black uppercase tracking-widest transition-all', CLIP_SM, tab === t.id ? 'border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white')}>
              <t.icon size={13} /> {t.label}
              {tab === t.id && <motion.span layoutId="ctab-glow" className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-amber-400 to-red-500" />}
            </motion.button>
          ))}
        </div>

        {/* ═══════════ نمای کلی ═══════════ */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* فرمان‌های روزانه + گزارش استراتژیک */}
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-amber-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                <p className="mb-3 flex items-center justify-between font-display text-[10px] uppercase tracking-[0.3em] text-amber-300">
                  <span className="flex items-center gap-2"><Target size={12} /> فرمان‌های روزانه</span>
                  <span className="text-white">{toFa(ordersDone)}/{toFa(ORDERS.length)}</span>
                </p>
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(ordersDone / ORDERS.length) * 100}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-amber-400 to-red-500" />
                </div>
                {ORDERS.map((o, i) => (
                  <motion.p key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className={cn('mb-1.5 flex items-center gap-2 text-[10px]', o.ok ? 'text-emerald-300' : 'text-slate-500')}>
                    <span className={cn('grid h-4 w-4 place-items-center rounded-full border text-[8px]', o.ok ? 'border-emerald-400/60 bg-emerald-400/15' : 'border-white/15')}>{o.ok ? '✓' : ''}</span>
                    {o.i} {o.t}
                  </motion.p>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><TrendingUp size={12} /> گزارش استراتژیک</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500">سطح تهدید</span><span className={threat >= 60 ? 'font-black text-red-400' : threat >= 30 ? 'font-black text-amber-300' : 'font-black text-emerald-300'}>{toFa(threat)}٪</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${threat}%` }} transition={{ duration: 1 }} className={cn('h-full', threat >= 60 ? 'bg-red-500' : threat >= 30 ? 'bg-amber-400' : 'bg-emerald-400')} /></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500">تولید روزانه منابع</span><span className="font-black text-cyan-300">{toFa(dailyProd)} واحد</span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500">تراز نبردها</span><span className="font-black text-white">{toFa(wins)}🏆 / {toFa(losses)}💀</span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500">وضعیت دیپلماسی</span><span className="font-black text-fuchsia-300">{alliance ? 'عضو اتحاد' : 'بی‌طرف'}</span></div>
                </div>
              </motion.div>
              <div className={cn('flex flex-wrap items-center gap-4 border p-5 backdrop-blur-xl', CLIP, taxReady ? 'border-emerald-400/50 bg-emerald-400/5 shadow-[0_0_30px_rgba(52,211,153,0.15)]' : 'border-amber-400/20 bg-[#0a0c08]/85')}>
                <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 text-2xl', CLIP_SM)}>💵</div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-white">بودجه جنگی روزانه</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">هر ۲۴ ساعت بر اساس جمعیت، WD دریافت کن.</p>
                </div>
                {!taxReady && <p className="font-display text-xs tabular-nums text-slate-400">⏳ {toFa(pad(th))}:{toFa(pad(tm))}:{toFa(pad(ts2))}</p>}
                <button onClick={collectTax} disabled={!taxReady || busy === 'tax'} className={cn('flex items-center gap-2 px-5 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition-all', CLIP_SM, taxReady ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : 'border border-white/10 bg-white/5 text-slate-600')} style={taxReady ? SHIMMER : undefined}>
                  <HandCoins size={14} /> {busy === 'tax' ? '⏳ ...' : taxReady ? 'دریافت بودجه' : 'پردازش...'}
                </button>
              </div>
            </div>

            {/* مهاجرت */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-cyan-400/20 bg-[#0a0c08]/85 p-5 backdrop-blur-xl', CLIP)}>
              <div className="flex flex-wrap items-center gap-4">
                <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-2xl', CLIP_SM)}>👥</div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-white">مهاجرت جمعیت</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">جمعیت بیشتر = مالیات بیشتر!</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[{ t: 1, a: '۱۰,۰۰۰', c: 120 }, { t: 2, a: '۵۰,۰۰۰', c: 550 }, { t: 3, a: '۱,۰۰۰,۰۰۰', c: 1000 }].map((p) => (
                  <motion.button key={p.t} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => migrate(p.t)} disabled={busy === 'mig' + p.t || wd < p.c} className={cn('border border-cyan-400/30 bg-cyan-400/5 p-3 text-center transition hover:bg-cyan-400/15 disabled:opacity-40', CLIP_SM)}>
                    <p className="text-sm font-black text-white">+{p.a} 👥</p>
                    <p className="mt-1 text-[10px] font-bold text-emerald-300">{toFa(p.c)} WD</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* ذخایر */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-amber-300"><PackageOpen size={16} /> ذخایر استراتژیک ملی</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
                {Object.entries(RESOURCES).map(([key, r], i) => (
                  <ResourceCard key={key} r={r} value={country.resources?.[key] ?? 0} delay={i * 0.04} />
                ))}
              </div>
            </div>

            {/* پایگاه‌ها */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-amber-300"><Factory size={16} /> پایگاه‌های استخراج</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {companies.map((comp, i) => {
                  const r = RESOURCES[comp.resource] || { label: comp.resource, icon: '⛏️' };
                  const elapsed = now - new Date(comp.last_collect_at).getTime();
                  const ready = elapsed >= DAY;
                  const pct = Math.min(100, (elapsed / DAY) * 100);
                  const remain = Math.max(0, DAY - elapsed);
                  const h = Math.floor(remain / 3600000), m = Math.floor((remain % 3600000) / 60000), s = Math.floor((remain % 60000) / 1000);
                  const cost = upgradeCost(comp);
                  const maxed = comp.level >= MAX_LEVEL;
                  return (
                    <motion.div key={comp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -5, rotateY: 2 }} className={cn('relative border bg-[#0a0c08]/85 p-5 backdrop-blur-xl', CLIP, ready ? 'border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.2)]' : 'border-amber-400/20 hover:border-amber-400/40')}>
                      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-amber-400/40" />
                      <div className="flex items-center gap-3">
                        <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-amber-400/20 to-red-500/20 text-2xl', CLIP_SM)}>{r.icon}</div>
                        <div>
                          <p className="font-display text-sm font-bold text-white">پایگاه {r.label}</p>
                          <p className="text-[10px] text-slate-500">{toFa(comp.rate_per_day * comp.level)} واحد/روز</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-amber-300">LVL {toFa(comp.level)}</span>
                        <div className="flex flex-1 gap-1">
                          {Array.from({ length: MAX_LEVEL }).map((_, x) => (
                            <span key={x} className={cn('h-1.5 flex-1 rounded-sm', x < comp.level ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'bg-white/10')} />
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={cn('h-full rounded-full transition-all duration-1000', ready ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]' : 'bg-gradient-to-r from-amber-500 to-red-500')} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-2 text-center font-display text-xs tabular-nums text-slate-400">{ready ? '✅ استخراج تکمیل شد!' : `⏳ ${toFa(pad(h))}:${toFa(pad(m))}:${toFa(pad(s))} تا تکمیل`}</p>
                      <button onClick={() => collect(comp)} disabled={!ready || busy === comp.id} className={cn('mt-3 w-full py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition-all', CLIP_SM, ready ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : 'border border-white/10 bg-white/5 text-slate-600')} style={ready ? SHIMMER : undefined}>
                        {busy === comp.id ? '⏳ ...' : ready ? '📦 دریافت استخراج' : 'در حال استخراج...'}
                      </button>
                      <button onClick={() => upgrade(comp)} disabled={maxed || busy === 'up-' + comp.id} className={cn('mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-widest transition-all', CLIP_SM, maxed ? 'border border-amber-400/30 bg-amber-400/10 text-amber-300' : wd >= cost ? 'border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20' : 'border border-white/10 bg-white/5 text-slate-600')}>
                        {maxed ? (<><Crown size={11} /> حداکثر سطح</>) : (<><ArrowUpCircle size={12} /> ارتقا • {fmtNum(cost)} WD</>)}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* کابینه + فید ملی */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={cn('border border-amber-400/20 bg-[#0a0c08]/85 p-5', CLIP)}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300"><Crown size={12} /> کابینه جنگی</p>
                  <button onClick={openCabinet} className={cn('flex items-center gap-1.5 border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/20', CLIP_SM)}><Pencil size={11} /> ویرایش / انتخاب کابینه</button>
                </div>
                {(country.cabinet || []).length === 0 ? <p className="text-xs text-slate-500">هنوز کابینه‌ای معرفی نکرده‌ای.</p> : (
                  <div className="flex flex-wrap gap-2">
                    {country.cabinet.map((mm, i) => (
                      <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={cn('border border-amber-400/25 bg-amber-400/5 px-3 py-1.5 text-[11px] text-slate-300', CLIP_SM)}><span className="font-bold text-amber-300">{mm.role}:</span> {mm.name}</motion.span>
                    ))}
                  </div>
                )}
              </div>
              <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
                <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><Radar size={12} /> رویدادهای ملی (زنده)</p>
                {natFeed.length === 0 ? <p className="text-xs text-slate-600">هنوز رویدادی ثبت نشده — تاریخ را تو بساز!</p> : natFeed.map((e, i) => (
                  <motion.p key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={cn('mb-1.5 text-[10px]', e.c)}>
                    {e.txt} <span className="text-slate-600">— {new Date(e.t).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </motion.p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ ارتش ═══════════ */}
        {tab === 'military' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-red-400/30 bg-[#0a0c08]/85 p-6 text-center', CLIP)}>
              <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-red-300">قدرت نظامی کل</p>
              <div className="mx-auto w-fit">
                <Ring value={totalPower} max={Math.max(500, totalPower)} size={140} stroke={10} color="#ef4444">
                  <p className="font-display text-3xl font-black text-white">{fmtNum(totalPower)}</p>
                </Ring>
              </div>
              <p className="mt-3 text-[10px] text-slate-500">{toFa(mil.length)} نوع تجهیز فعال</p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => navigate('/military')} className={cn('mt-4 w-full bg-gradient-to-r from-red-500 to-amber-500 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950', CLIP_SM)} style={SHIMMER}>🛒 خرید تجهیزات جدید</motion.button>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn('border border-white/10 bg-[#0a0c08]/85 p-5 lg:col-span-2', CLIP)}>
              <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300">ترکیب ارتش</p>
              {mil.length === 0 ? <p className="py-8 text-center text-xs text-slate-600">ارتشت خالی است — همین حالا تجهیز بخر!</p> : [...mil].sort((a, b) => b.power * b.qty - a.power * a.qty).map((mm, i) => (
                <motion.div key={mm.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="mb-3">
                  <p className="mb-1 flex justify-between text-[10px] font-bold text-white"><span>🎖 {mm.name} ×{toFa(mm.qty)}</span><span className="text-red-300">+{fmtNum(Number(mm.power) * mm.qty)}</span></p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((Number(mm.power) * mm.qty) / Math.max(1, totalPower)) * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.06 }} className="h-full bg-gradient-to-r from-amber-400 to-red-500" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* ═══════════ امنیت ═══════════ */}
        {tab === 'security' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-purple-400/30 bg-[#0a0c08]/85 p-6 text-center', CLIP)}>
              <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-purple-300">سطح تهدید ملی</p>
              <div className="mx-auto w-fit">
                <Ring value={threat} max={100} size={140} stroke={10} color={threat >= 60 ? '#ef4444' : threat >= 30 ? '#fbbf24' : '#34d399'}>
                  <p className={cn('font-display text-3xl font-black', threat >= 60 ? 'text-red-400' : threat >= 30 ? 'text-amber-300' : 'text-emerald-300')}>{toFa(threat)}٪</p>
                </Ring>
              </div>
              <p className="mt-3 text-[10px] text-slate-500">بر اساس جاسوسی‌های ۲۴س + تحریم‌های فعال</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={cn('border border-red-400/20 bg-[#0a0c08]/85 p-5', CLIP)}>
              <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-red-300"><Eye size={12} /> جاسوسی‌ها از تو</p>
              {spyOnMe.length === 0 ? <p className="text-xs text-slate-600">فعلاً امن است 🕊</p> : spyOnMe.slice(0, 6).map((sp) => (
                <p key={sp.id} className="mb-1.5 text-[10px] text-slate-400">🕵️ {new Date(sp.created_at).toLocaleString('fa-IR')}</p>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className={cn('border border-purple-400/20 bg-[#0a0c08]/85 p-5', CLIP)}>
              <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-purple-300"><Search size={12} /> عملیات‌های تو</p>
              {spyByMe.length === 0 ? <p className="text-xs text-slate-600">هنوز جاسوسی نکرده‌ای</p> : spyByMe.slice(0, 6).map((sp) => (
                <p key={sp.id} className="mb-1.5 text-[10px] text-slate-400">🕵️ {new Date(sp.created_at).toLocaleString('fa-IR')} — موفق</p>
              ))}
            </motion.div>
            {sanActive && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-red-400/40 bg-red-400/5 p-4 lg:col-span-3', CLIP)}>
                <p className="mb-2 flex items-center gap-2 text-xs font-black text-red-300"><Snowflake size={12} /> تحریم‌های فعال روی تو — تا {countdown(sanActive.until)}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(SAN_LABEL).map((k) => sanActive[k] && (
                    <span key={k} className={cn('border px-2.5 py-1 text-[9px] font-bold', CLIP_SM, Number(sanActive[k]) < 1 ? 'border-red-400/40 bg-red-400/10 text-red-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300')}>
                      {SAN_LABEL[k]}: {Number(sanActive[k]) < 1 ? `−${toFa(Math.round((1 - sanActive[k]) * 100))}٪` : `+${toFa(Math.round((sanActive[k] - 1) * 100))}٪`}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══════════ کارنامه ═══════════ */}
        {tab === 'record' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-amber-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">درجه فرماندهی</p>
                <div className="flex gap-1">
                  <button onClick={() => { setRankModel('ir'); localStorage.setItem('nexus-rank-model-' + (user?.id || 'x'), 'ir'); }} className={cn('border px-2 py-1 text-[9px] font-black', CLIP_SM, rankModel === 'ir' ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-500')}>🇮🇷 ایرانی</button>
                  <button onClick={() => { setRankModel('int'); localStorage.setItem('nexus-rank-model-' + (user?.id || 'x'), 'int'); }} className={cn('border px-2 py-1 text-[9px] font-black', CLIP_SM, rankModel === 'int' ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-500')}>🌐 بین‌المللی</button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn('grid h-24 w-24 shrink-0 place-items-center border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-red-500/10', CLIP)}><RankInsignia s={rank.s} size={92} /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-black text-white">{rank.t}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{toFa(wins)} پیروزی</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: (nxt ? Math.min(100, (wins / nxt.w) * 100) : 100) + '%' }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-amber-400 to-red-500" />
                  </div>
                  <p className="mt-1 text-[9px] text-slate-500">{nxt ? `${toFa(nxt.w - wins)} برد تا «${nxt.t}»` : 'بالاترین درجه!'}</p>
                </div>
              </div>
            </motion.div>
            <div className="grid grid-cols-3 gap-3 lg:col-span-2">
              {[{ l: 'پیروزی', v: wins, c: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/5' }, { l: 'شکست', v: losses, c: 'text-red-300 border-red-400/30 bg-red-400/5' }, { l: 'نرخ پیروزی', v: (finishedMine.length ? Math.round((wins / finishedMine.length) * 100) : 0) + '٪', c: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/5' }].map((st, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16, rotateX: -20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }} className={cn('border p-5 text-center', CLIP, st.c)}>
                  <p className="font-display text-3xl font-black text-white">{toFa(st.v)}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.2em] opacity-70">{st.l}</p>
                </motion.div>
              ))}
              <div className={cn('col-span-3 border border-white/10 bg-[#0a0c08]/85 p-4', CLIP)}>
                <p className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-slate-400">آخرین نبردها</p>
                {finishedMine.length === 0 ? <p className="text-xs text-slate-600">هنوز نبردی نداشته‌ای</p> : finishedMine.slice(0, 5).map((mm) => (
                  <p key={mm.id} className="mb-1.5 text-[10px] text-slate-400">{mm.winner_country === country.id ? '🏆' : '💀'} {mm.public_result}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ دیپلماسی ═══════════ */}
        {tab === 'diplomacy' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-6', CLIP)}>
              <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><HeartHandshake size={12} /> اتحاد تو</p>
              {!alliance ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-slate-500">عضو هیچ اتحادی نیستی — قدرت در تعداد است!</p>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/alliances')} className={cn('mt-4 bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950', CLIP_SM)}>🤝 پیوستن به اتحاد</motion.button>
                </div>
              ) : (
                <div>
                  <p className="font-display text-2xl font-black text-white">{alliance.emblem} {alliance.name}</p>
                  <p className="mt-1 text-[10px] text-slate-500">نقش تو: {alliance.role === 'leader' ? '👑 رهبر' : alliance.role === 'officer' ? '🎖 افسر' : '🎮 عضو'}</p>
                  <button onClick={() => navigate('/alliance-chat')} className={cn('mt-4 border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-[10px] font-black text-cyan-300 hover:bg-cyan-400/20', CLIP_SM)}>💬 چت اتحاد</button>
                </div>
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn('border border-fuchsia-400/30 bg-[#0a0c08]/85 p-6', CLIP)}>
              <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-fuchsia-300"><Flame size={12} /> جنگ‌های اتحاد فعال</p>
              {allWars.length === 0 ? <p className="text-xs text-slate-600">جنگ اتحادی فعال نیست — آرامش قبل از طوفان!</p> : allWars.map((w) => (
                <p key={w.id} className="mb-2 text-[10px] text-slate-400">⚔️ {toFa(w.att_score)} - {toFa(w.def_score)} — تا {countdown(w.ends_at)}</p>
              ))}
            </motion.div>
          </div>
        )}

        {/* ═══════════ نشان‌ها ═══════════ */}
        {tab === 'honors' && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {ACH.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8, rotateY: -30 }} whileInView={{ opacity: 1, scale: 1, rotateY: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={{ y: -6, rotate: 2 }} className={cn('relative border p-4 text-center', CLIP, a.ok ? 'border-amber-400/50 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-white/10 bg-white/5 opacity-40 grayscale')}>
                <p className="text-3xl">{a.ok ? a.i : '🔒'}</p>
                <p className="mt-2 text-[10px] font-black text-white">{a.t}</p>
                <p className="mt-1 text-[8px] text-slate-500">{a.d}</p>
                {a.ok && <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* مودال کابینه */}
      <AnimatePresence>
        {showCabinet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[15000] grid place-items-center bg-black/70 px-4 backdrop-blur-[3px]" onClick={() => setShowCabinet(false)}>
            <motion.div initial={{ scale: 0.92, y: 20, rotateX: -20 }} animate={{ scale: 1, y: 0, rotateX: 0 }} exit={{ scale: 0.92, y: 20 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }} onClick={(e) => e.stopPropagation()} className={cn('relative max-h-[85vh] w-full max-w-lg overflow-y-auto border border-amber-400/40 bg-[#0a0c08]/95 p-6', CLIP)}>
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-sm font-black text-white"><Crown size={15} className="text-amber-300" /> کابینه جنگی {country.flag || ''}</p>
                <button onClick={() => setShowCabinet(false)} className="grid h-7 w-7 place-items-center text-slate-500 hover:text-white"><X size={14} /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {CABINET_ROLES.map((role) => (
                  <div key={role}>
                    <label className="mb-1 block font-display text-[9px] uppercase tracking-[0.25em] text-amber-300/70">{role}</label>
                    <input value={cabinetForm[role] || ''} onChange={(e) => setCabinetForm({ ...cabinetForm, [role]: e.target.value })} placeholder="نام وزیر..." className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50" />
                  </div>
                ))}
              </div>
              <button onClick={saveCabinet} className={cn('mt-5 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-red-500 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950', CLIP_SM)} style={SHIMMER}><Shield size={14} /> ثبت کابینه دولت</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}