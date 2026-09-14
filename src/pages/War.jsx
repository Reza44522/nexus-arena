import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Crosshair, Shield, Trophy, Banknote, Flame, Radar, X, ScrollText, Snowflake, Eye, BookOpen, Activity, Globe, Search, Terminal, Medal, FlaskConical, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { analyzeWar } from '../lib/warAI';
import AllianceWarTab from '../components/war/AllianceWarTab';
import CoordWarTab from '../components/war/CoordWarTab';
import { RESOURCES, toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const HAZARD = { background: 'repeating-linear-gradient(45deg, rgba(239,68,68,.14) 0 10px, transparent 10px 20px)' };
const pad = (n) => String(n).padStart(2, '0');

const SANCTIONS = [
  { key: 'oil', icon: '🛢️', title: 'تحریم نفتی', cost: 150, def: 'قیمت فروش هدف −۴۰٪', att: 'خرید خودت +۱۰٪ (۲۴س)' },
  { key: 'financial', icon: '🏦', title: 'محاصره مالی', cost: 120, def: 'مالیات هدف −۵۰٪', att: 'مالیات خودت −۱٪ (۲۴س)' },
  { key: 'naval', icon: '🚢', title: 'محاصره دریایی', cost: 180, def: 'استخراج هدف −۳۰٪', att: 'استخراج خودت −۱۰٪ (۲۴س)' },
  { key: 'arms', icon: '🎖', title: 'تحریم تسلیحاتی', cost: 200, def: 'هزینه تجهیزات هدف +۵۰٪', att: 'هزینه خودت +۱۰٪ (۲۴س)' },
  { key: 'cyber', icon: '🕹', title: 'جنگ سایبری', cost: 100, def: 'سرقت ۵٪ منبع تصادفی', att: '۲۵٪ احتمال نتیجه معکوس' },
];
const SAN_LABEL = { sell_mult: 'فروش بازار', buy_mult: 'خرید بازار', tax_mult: 'مالیات روزانه', collect_mult: 'استخراج شرکت‌ها', buy_cost_mult: 'خرید تجهیزات' };

/* ─────────── 🎖 درجه‌های نظامی — مدل ایران ─────────── */
const IR_RANKS = [
  { w: 0, t: 'سرباز دوم', s: {} },
  { w: 1, t: 'سرباز اول', s: { chevrons: 1 } },
  { w: 2, t: 'گروهبان سوم', s: { chevrons: 2 } },
  { w: 4, t: 'گروهبان دوم', s: { chevrons: 3 } },
  { w: 6, t: 'گروهبان یکم', s: { chevrons: 3, arcs: 1 } },
  { w: 8, t: 'استوار دوم', s: { chevrons: 3, arcs: 2 } },
  { w: 10, t: 'استوار یکم', s: { chevrons: 3, arcs: 3 } },
  { w: 12, t: 'ستوان سوم', s: { stars: 1 } },
  { w: 15, t: 'ستوان دوم', s: { stars: 2 } },
  { w: 18, t: 'ستوان یکم', s: { stars: 3 } },
  { w: 21, t: 'سروان', s: { stars: 1, sword: true } },
  { w: 24, t: 'سرگرد', s: { stars: 2, sword: true } },
  { w: 28, t: 'سرهنگ دوم', s: { stars: 3, sword: true } },
  { w: 32, t: 'سرهنگ', s: { stars: 3, sword: true, arcs: 1 } },
  { w: 36, t: 'سرتیپ دوم', s: { stars: 1, wreath: true } },
  { w: 40, t: 'سرتیپ', s: { stars: 2, wreath: true } },
  { w: 45, t: 'سرلشکر', s: { stars: 3, wreath: true } },
  { w: 50, t: 'سپهبد', s: { stars: 4, wreath: true } },
  { w: 55, t: 'ارتشبد', s: { stars: 5, wreath: true } },
];
/* ─────────── 🎖 درجه‌های نظامی — مدل بین‌المللی ─────────── */
const INTL_RANKS = [
  { w: 0, t: 'Private', s: {} },
  { w: 1, t: 'Private First Class', s: { chevrons: 1 } },
  { w: 3, t: 'Corporal', s: { chevrons: 2 } },
  { w: 5, t: 'Sergeant', s: { chevrons: 3 } },
  { w: 8, t: 'Staff Sergeant', s: { chevrons: 3, arcs: 1 } },
  { w: 11, t: 'Sergeant First Class', s: { chevrons: 3, arcs: 2 } },
  { w: 14, t: 'Master Sergeant', s: { chevrons: 3, arcs: 3 } },
  { w: 17, t: 'Second Lieutenant', s: { bars: 1 } },
  { w: 20, t: 'First Lieutenant', s: { bars: 1, silver: true } },
  { w: 23, t: 'Captain', s: { bars: 2 } },
  { w: 26, t: 'Major', s: { leaf: true } },
  { w: 29, t: 'Lieutenant Colonel', s: { leaf: true, silver: true } },
  { w: 32, t: 'Colonel', s: { eagle: true } },
  { w: 36, t: 'Brigadier General', s: { stars: 1 } },
  { w: 40, t: 'Major General', s: { stars: 2 } },
  { w: 45, t: 'Lieutenant General', s: { stars: 3 } },
  { w: 50, t: 'General', s: { stars: 4 } },
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
  const gold = '#fbbf24';
  const silver = '#cbd5e1';
  const col = s.silver ? silver : gold;
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

/* ─────────── موتور محلی شبیه‌ساز ─────────── */
const TERMS = ['حمله', 'دفاع', 'پدافند', 'هوایی', 'زرهی', 'موشک', 'پهپاد', 'الکترونیک', 'لجستیک', 'اطلاعات', 'جاسوسی', 'چریک', 'کمین', 'محاصره', 'بمباران', 'ضدحمله', 'سنگر', 'عقب‌نشینی', 'تدارکات', 'غافلگیری', 'خط مقدم', 'توپخانه', 'زیردریایی', 'شب', 'روحیه', 'پشتیبانی', 'ضد هوایی', 'جنگ الکترونیک', 'عملیات ویژه', 'بازشناسی'];
function scoreScenarioJS(t) {
  if (!t || !t.trim()) return 0;
  let s = Math.min(20, Math.floor(t.length / 60));
  let n = 0;
  TERMS.forEach((k) => { if (t.includes(k)) n += 1; });
  s += Math.min(40, n * 4);
  if (/[0-9۰-۹]/.test(t)) s += 10;
  if (t.includes('حمله') && t.includes('دفاع')) s += 15;
  if (t.includes('اگر') || t.includes('در صورت')) s += 10;
  if (/(۱|۲|۳|1|2|3)[.)]/.test(t)) s += 5;
  return Math.min(100, s);
}

/* ───────────  نوار خبری متحرک ─────────── */
function Ticker({ items }) {
  if (!items.length) return null;
  const row = items.join('  ◆  ');
  return (
    <div className="relative mb-6 overflow-hidden border-y border-red-400/20 bg-black/60 py-1.5">
      <style>{`@keyframes warTick { from { transform: translateX(100%); } to { transform: translateX(-100%); } }`}</style>
      <p className="whitespace-nowrap font-display text-[10px] tracking-widest text-red-300/80" style={{ animation: 'warTick 40s linear infinite' }}>📡 {row}</p>
    </div>
  );
}

/* ─────────── 📡 رادار زنده ─────────── */
function RadarPanel({ active, nameOf, spyAlert }) {
  const alertOn = !!spyAlert;
  return (
    <div className={cn('relative border bg-[#0a0c08]/85 p-4 transition-all', CLIP, alertOn ? 'border-purple-400/70 shadow-[0_0_40px_rgba(168,85,247,0.45)]' : 'border-red-400/30')}>
      <style>{`@keyframes nxSpin { to { transform: rotate(360deg); } } @keyframes blip { 0%,100% { opacity: .9; } 50% { opacity: .25; } } @keyframes spyPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(168,85,247,.55); } 50% { box-shadow: 0 0 0 16px rgba(168,85,247,0); } }`}</style>
      <p className={cn('mb-2 flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.3em]', alertOn ? 'text-purple-300' : 'text-red-400')}>
        <Radar size={11} /> رادار میدان نبرد
        {alertOn && <span className="animate-pulse text-[8px] font-black text-purple-300">⚠ شناسایی دشمن</span>}
      </p>
      <div className="relative mx-auto h-60 w-60 rounded-full md:h-64 md:w-64" style={alertOn ? { animation: 'spyPulse 1s infinite' } : undefined}>
        <div className={cn('absolute inset-0 rounded-full border', alertOn ? 'border-purple-400/40' : 'border-red-400/30')} />
        <div className={cn('absolute inset-5 rounded-full border', alertOn ? 'border-purple-400/30' : 'border-red-400/20')} />
        <div className={cn('absolute inset-11 rounded-full border', alertOn ? 'border-purple-400/20' : 'border-red-400/15')} />
        <div className={cn('absolute left-1/2 top-0 h-full w-px', alertOn ? 'bg-purple-400/15' : 'bg-red-400/10')} />
        <div className={cn('absolute left-0 top-1/2 h-px w-full', alertOn ? 'bg-purple-400/15' : 'bg-red-400/10')} />
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 0deg, ${alertOn ? 'rgba(168,85,247,.55)' : 'rgba(239,68,68,.45)'}, transparent 80deg)`, animation: `nxSpin ${alertOn ? '1.1s' : '3s'} linear infinite` }} />
        {active.slice(0, 6).map((m, i) => {
          const ang = (i * 137) % 360;
          const rad = 28 + ((i * 53) % 55);
          const x = 50 + rad * Math.cos((ang * Math.PI) / 180) * 0.9;
          const y = 50 + rad * Math.sin((ang * Math.PI) / 180) * 0.9;
          return <span key={m.id} title={nameOf(m.attacker_country) + ' ⚔ ' + nameOf(m.defender_country)} className={cn('absolute h-2 w-2 rounded-full', alertOn ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,1)]' : 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,1)]')} style={{ left: x + '%', top: y + '%', animation: `blip ${1 + (i % 3)}s infinite` }} />;
        })}
        {alertOn && <span className="absolute left-[62%] top-[30%] h-3 w-3 animate-ping rounded-full bg-purple-400 shadow-[0_0_16px_rgba(168,85,247,1)]" />}
        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]" />
      </div>
      {alertOn ? (
        <p className="mt-2 animate-pulse text-center text-[10px] font-black text-purple-300">🕵️ جاسوس دشمن: {spyAlert.name} در حال اسکن کشور توست!</p>
      ) : (
        <p className="mt-2 text-center text-[9px] text-slate-500">{toFa(active.length)} نبرد فعال در جهان</p>
      )}
    </div>
  );
}

/* ─────────── 🖥 کنسول رویدادها ─────────── */
function BattleConsole({ lines }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return (
    <div className={cn('border border-emerald-400/20 bg-black/80 p-3', CLIP)}>
      <p className="mb-2 flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.3em] text-emerald-400"><Terminal size={11} /> کنسول فرماندهی</p>
      <div ref={ref} className="chat-scroll h-36 overflow-y-auto font-mono text-[9px] leading-4 text-emerald-300/80">
        {lines.map((l, i) => (<p key={i}><span className="text-emerald-600">[{l.t}]</span> {l.m}</p>))}
        <p className="animate-pulse">▮</p>
      </div>
    </div>
  );
}

/* ─────────── ⚔️ War v5 — MEGA ULTRA + BLITZ ─────────── */
export default function War() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [country, setCountry] = useState(null);
  const [wd, setWd] = useState(0);
  const [targets, setTargets] = useState([]);
  const [powerMap, setPowerMap] = useState({});
  const [milMap, setMilMap] = useState({});
  const [matches, setMatches] = useState([]);
  const [tours, setTours] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sanctions, setSanctions] = useState([]);
  const [tab, setTab] = useState('duel');
  const [now, setNow] = useState(Date.now());
  const [target, setTarget] = useState(null);
  const [sanTarget, setSanTarget] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const [plan, setPlan] = useState(null);
  const [commit, setCommit] = useState(50);
  const [attText, setAttText] = useState('');
  const [defText, setDefText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [help, setHelp] = useState(false);
  const [spy, setSpy] = useState(null);
  const [spyData, setSpyData] = useState(null);
  const [sim, setSim] = useState(false);
  const [simA, setSimA] = useState('');
  const [simD, setSimD] = useState('');
  const [simCA, setSimCA] = useState(50);
  const [simCD, setSimCD] = useState(50);
  const [simRes, setSimRes] = useState(null);
  const [log, setLog] = useState([]);
    const audioRef = useRef(null);
  const lastPlanIdRef = useRef(null);
  const [spyAlert, setSpyAlert] = useState(null);
  const [blitzPoll, setBlitzPoll] = useState(false);

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 4000); };
  const pushLog = (m) => setLog((L) => [...L.slice(-40), { t: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), m }]);

  const load = async () => {
    if (!user?.id) return;
    const [cRes, prRes, tgRes, mRes, tRes, sRes, saRes, invRes] = await Promise.all([
      supabase.from('player_countries').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('war_dollars').eq('id', user.id).single(),
      supabase.from('player_countries').select('id, name_fa, name_en, flag, user_id').neq('user_id', user.id),
      supabase.from('war_matches').select('*').order('created_at', { ascending: false }).limit(60),
      supabase.from('war_tournaments').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('war_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('sanctions').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('military_inventory').select('country_id, name, power, qty'),
    ]);
    setCountry(cRes.data || null);
    setWd(prRes.data?.war_dollars ?? 0);
    setTargets(tgRes.data || []);
    const ms = mRes.data || [];
    setMatches(ms);
    setTours(tRes.data || []);
    setSettings(sRes.data || null);
    setSanctions(saRes.data || []);
    const pm = {}; const mm = {};
    (invRes.data || []).forEach((x) => {
      pm[x.country_id] = (pm[x.country_id] || 0) + Number(x.power) * x.qty;
      if (!mm[x.country_id]) mm[x.country_id] = [];
      mm[x.country_id].push(x);
    });
    setPowerMap(pm);
    setMilMap(mm);
    ms.forEach((m) => {
      if (m.status !== 'finished' && new Date(m.scheduled_at).getTime() < Date.now() - 10 * 60000) {
        supabase.rpc('war_resolve_match', { p_id: m.id }).then(() => load());
      }
    });
  };

  useEffect(() => {
    load();
    pushLog('سیستم فرماندهی آنلاین شد. منتظر دستورات...');
    const t = setInterval(() => setNow(Date.now()), 1000);
    const ch = supabase
      .channel('war-ultra-' + user?.id + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'war_matches' }, (p) => {
        pushLog(p.eventType === 'UPDATE' && p.new?.status === 'finished' ? '⚔️ یک نبرد به پایان رسید: ' + (p.new?.public_result || '') : '📡 رویداد جدید نبرد ثبت شد');
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sanctions' }, () => { pushLog('🥶 یک تحریم جدید در جهان ثبت شد'); load(); })
      .subscribe();
    return () => { clearInterval(t); supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id]);

  /* 🕵️ واکنش رادار به جاسوسی از کشور من */
  useEffect(() => {
    if (!country?.id) return undefined;
    const ch = supabase
      .channel('spy-radar-' + country.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'spy_ops', filter: `target_country=eq.${country.id}` }, async (p) => {
        const { data } = await supabase.from('player_countries').select('name_fa, flag').eq('id', p.new?.spy_country).maybeSingle();
        const nm = (data?.flag || '🕵️') + ' ' + (data?.name_fa || 'دشمن ناشناس');
        setSpyAlert({ name: nm });
        pushLog('🚨 شناسایی راداری دشمن: ' + nm);
        flash('🕵️ هشدار: ' + nm + ' در حال جاسوسی از کشور توست!');
        setTimeout(() => setSpyAlert(null), 10000);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [country?.id]);

  /* ─────────── ⚡ حالت جنگ سریع (BLITZ) ─────────── */
  const openBlitzPlan = async (matchId) => {
    const { data: m } = await supabase.from('war_matches').select('*').eq('id', matchId).single();
    if (!m || !country) return;
    const side = m.attacker_country === country.id ? 'att' : m.defender_country === country.id ? 'def' : null;
    if (!side) return;
    setPlan({ id: m.id, side, mode: 'blitz', deadline: m.scheduled_at });
  };
  const joinBlitz = async () => {
    setBusy('blitz');
    const { data, error } = await supabase.rpc('war_blitz_queue_join', { p_join: true });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data?.ok === false) return flash('❌ ' + data.error);
    if (data?.match) {
      setBlitzPoll(false);
      pushLog('⚡ حریف بلیتز پیدا شد — نبرد ۹۰ ثانیه‌ای آغاز شد!');
      flash('⚡ حریف پیدا شد! فقط ۹۰ ثانیه مهلت داری!');
      load();
      openBlitzPlan(data.match);
    } else {
      setBlitzPoll(true);
      flash('⚡ در صف جنگ سریع — دنبال حریف آنلاین...');
    }
  };
  const leaveBlitz = async () => {
    setBlitzPoll(false);
    await supabase.rpc('war_blitz_queue_join', { p_join: false });
    flash('🚪 از صف جنگ سریع خارج شدی');
  };
  useEffect(() => {
    if (!blitzPoll) return undefined;
    const t = setInterval(async () => {
      const { data } = await supabase.rpc('war_blitz_queue_join', { p_join: true });
      if (data?.match) {
        setBlitzPoll(false);
        pushLog('⚡ حریف بلیتز پیدا شد — نبرد ۹۰ ثانیه‌ای آغاز شد!');
        flash('⚡ حریف پیدا شد! فقط ۹۰ ثانیه مهلت داری!');
        load();
      }
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [blitzPoll]);
  /* ⚡ حل خودکار نبردهای بلیتز بعد از ۹۰ ثانیه + توزیع غنایم */
    useEffect(() => {
    const t = setInterval(async () => {
      const due = matches.some((m) => m.mode === 'blitz' && m.status !== 'finished' && new Date(m.scheduled_at).getTime() < Date.now());
      if (!due) return;
      await supabase.rpc('war_blitz_finish_expired');
      load();
    }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [matches]);
  /* 🎵 موسیقی جنگ برای همه نبردها (blitz/duel/tournament) با resume هوشمند */
  useEffect(() => {
    if (!plan) {
      // plan بسته شد — pause کن (ولی currentTime حفظ می‌شود)
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }
    // plan باز شد
    if (lastPlanIdRef.current !== plan.id) {
      // plan جدید — از اول شروع کن
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      window.dispatchEvent(new CustomEvent('nexus-music-pause'));
      const audio = new Audio('/audio/musicplaying_war.mp3');
      audio.loop = true;
      audio.volume = 0.9;
      audioRef.current = audio;
      lastPlanIdRef.current = plan.id;
      audio.play().catch(() => {
        const un = () => { window.removeEventListener('pointerdown', un); audio.play().catch(() => {}); };
        window.addEventListener('pointerdown', un);
      });
    } else {
      // همان plan — از ادامه پخش کن (resume)
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
    // eslint-disable-next-line
  }, [plan?.id]);

  /* 🎵 توقف موسیقی وقتی نبرد تمام شد */
  useEffect(() => {
    if (analysis && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      lastPlanIdRef.current = null;
    }
  }, [analysis]);
  /* ⏱ پایان زمان بلیتز: بستن مودال + قطع موسیقی + اعلام نتیجه */
  useEffect(() => {
    if (!plan || plan.mode !== 'blitz') return undefined;
    const t = setInterval(async () => {
      const { data: m } = await supabase.from('war_matches').select('*').eq('id', plan.id).single();
      if (!m) { setPlan(null); return; }
      const expired = new Date(m.scheduled_at).getTime() < Date.now();
      if (m.status === 'finished') {
        setPlan(null);
        setAnalysis(m);
        flash('🏁 زمان تمام شد — نتیجه نبرد سریع اعلام شد!');
        load();
            } else if (expired) {
        await supabase.rpc('war_blitz_finish_expired');
        const { data: m2 } = await supabase.from('war_matches').select('*').eq('id', m.id).single();
        setPlan(null);
        if (m2) setAnalysis(m2);
        flash('🏁 زمان تمام شد — نتیجه نبرد سریع اعلام شد!');
        load();
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [plan?.id, plan?.mode]);

  const mySide = (m) => (country && m.attacker_country === country.id ? 'att' : country && m.defender_country === country.id ? 'def' : null);
  const nameOf = (id) => {
    if (country && id === country.id) return country.name_fa;
    const t = targets.find((x) => x.id === id);
    return t?.name_fa || '—';
  };
  const finishedMine = matches.filter((m) => m.status === 'finished' && mySide(m) && m.winner_country);
  const wins = finishedMine.filter((m) => m.winner_country === country?.id).length;
  const losses = finishedMine.length - wins;
  const [rankModel, setRankModel] = useState(() => localStorage.getItem('nexus-rank-model-' + (user?.id || 'x')) || 'ir');
  const switchModel = (m) => { setRankModel(m); localStorage.setItem('nexus-rank-model-' + (user?.id || 'x'), m); };
  const RLIST = rankModel === 'ir' ? IR_RANKS : INTL_RANKS;
  const rank = rankOf(RLIST, wins);
  const nxt = nextRank(RLIST, wins);
  const hall = (() => {
    const c = {};
    matches.filter((m) => m.status === 'finished' && m.winner_country).forEach((m) => { c[m.winner_country] = (c[m.winner_country] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3);
  })();

  const declareDuel = async () => {
    if (!target) return flash('❌ اول هدف را انتخاب کن');
    setBusy('duel');
    const { data, error } = await supabase.rpc('war_declare_duel', { p_defender: target.id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    pushLog('⚔️ اعلام جنگ به ' + target.name_fa + ' — آژیر سراسری فعال شد');
    flash('🚨 اعلام جنگ! آژیر سراسری پخش شد — نبرد به‌زودی');
    load();
  };
  const forfeit = async (id) => {
    if (!window.confirm('از این نبرد انصراف می‌دهی؟ حریف برنده می‌شود!')) return;
    setBusy('ff' + id);
    const { data, error } = await supabase.rpc('war_forfeit', { p_match: id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    pushLog('🏳️ انصراف ثبت شد');
    flash('🏳️ انصراف ثبت شد — نبرد بسته شد');
    load();
  };
  const doSpy = async (t) => {
    setBusy('spy' + t.id);
    const { data, error } = await supabase.rpc('war_spy', { p_target: t.id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    pushLog('🕵️ عملیات جاسوسی روی ' + t.name_fa + ' ' + (data.free ? '(رایگان — قبلاً انجام شده)' : '(−۵۰ WD)') + ' موفق شد');
    setSpy(t);
    setSpyData(data.intel);
    load();
  };
  const applySanction = async (type) => {
    if (!sanTarget) return flash('❌ اول هدف تحریم را انتخاب کن');
    setBusy('san' + type);
    const { data, error } = await supabase.rpc('war_apply_sanction', { p_defender: sanTarget.id, p_type: type });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    pushLog('🥶 تحریم ' + SANCTIONS.find((s) => s.key === type)?.title + ' روی ' + sanTarget.name_fa + ' اعمال شد');
    flash('🥶 تحریم اعمال شد — جنگ سرد آغاز شد');
    load();
  };

  /* 📜 ثبت برنامه نبرد — مودال فوراً بسته می‌شود تا اعلان‌ها دیده شوند */
  const submitPlan = async () => {
    if (!plan) return;
    const { data: chk } = await supabase.from('war_matches').select('*').eq('id', plan.id).single();
    if (!chk || chk.status === 'finished' || new Date(chk.scheduled_at).getTime() < Date.now()) {
      setPlan(null);
      if (chk && chk.status === 'finished') { setAnalysis(chk); flash('🏁 این نبرد تمام شده — نتیجه را ببین'); }
      else flash('⏱ زمان این نبرد تمام شده — سناریو قابل ثبت نیست');
      load();
      return;
    }
    if (attText.trim().length < 30 || defText.trim().length < 30) return flash('❌ هر دو سناریو حداقل ۳۰ کاراکتر باشند');
    const planId = plan.id;
    const planSide = plan.side;
    const planCommit = commit;
    setBusy('plan');
    const combined = 'حمله: ' + attText.trim() + ' || دفاع: ' + defText.trim();
    const { data, error } = await supabase.rpc('war_submit_plan', { p_match: planId, p_side: planSide, p_commit: planCommit, p_scenario: combined });
    if (error) { setBusy(null); return flash('❌ ' + error.message); }
    if (data && data.ok === false) { setBusy(null); return flash('❌ ' + data.error); }
    pushLog('📜 برنامه نبرد با تعهد ' + planCommit + '٪ ثبت شد');
    flash('✅ برنامه ثبت شد');
    setPlan(null); setAttText(''); setDefText(''); setCommit(50);
    const { data: m2 } = await supabase.from('war_matches').select('*').eq('id', planId).single();
    if (m2?.att_sub && m2?.def_sub) {
      let res;
      let usedAI = false;
      let ai = null;
      flash(m2.mode === 'blitz' ? '⚡ نبرد سریع: ابتدا هوش مصنوعی، در صورت قطعی موتور داخلی...' : '🤖 هوش مصنوعی در حال تحلیل سناریوهاست...');
      ai = await analyzeWar({
        attName: nameOf(m2.attacker_country), defName: nameOf(m2.defender_country),
        attScenario: m2.att_scenario, defScenario: m2.def_scenario,
        attCommit: m2.att_commit, defCommit: m2.def_commit,
        playerSide: planSide,
      });
      usedAI = !!ai;
      res = ai
        ? await supabase.rpc('war_resolve_match', { p_id: planId, p_ai_sa: ai.sa, p_ai_sd: ai.sd, p_ai_att: ai.att, p_ai_def: ai.def, p_ai_pub: ai.pub })
        : await supabase.rpc('war_resolve_match_auto_ai', { p_id: planId });
      if (res.error) flash('❌ خطای حل نبرد: ' + res.error.message);
      else if (res.data && res.data.ok === false) flash('❌ ' + res.data.error);
      else {
        if (usedAI && ai.report) await supabase.rpc('war_set_ai_report', { p_id: planId, p_report: ai.report });
        pushLog('🎯 نبرد حل شد: ' + (usedAI ? 'تحلیل AI (Gemini)' : 'موتور داخلی ستاد'));
        flash(m2.mode === 'blitz' ? '⚡ نبرد سریع حل شد!' : usedAI ? '🤖 تحلیل AI ثبت شد!' : '⚙️ موتور داخلی ستاد تحلیل کرد');
        const { data: m3 } = await supabase.from('war_matches').select('*').eq('id', planId).single();
        if (m3) setAnalysis(m3);
      }
    } else {
      flash('✅ برنامه ثبت شد — منتظر سناریوی حریف');
    }
    setBusy(null);
    load();
  };

  const runSim = () => {
    const sa = scoreScenarioJS(simA);
    const sd = scoreScenarioJS(simD);
    const pa = (powerMap[country?.id] || 100) * (simCA / 100);
    const pd = (powerMap[target?.id] || 100) * (simCD / 100);
    const aa = Math.min(100, pa / 20);
    const ad = Math.min(100, pd / 20);
    const la = Math.random() * 100;
    const ld = Math.random() * 100;
    const fa = sa * 0.5 + aa * 0.4 + la * 0.1;
    const fd = sd * 0.5 + ad * 0.4 + ld * 0.1;
    setSimRes({ sa, sd, aa: Math.floor(aa), ad: Math.floor(ad), la: Math.floor(la), ld: Math.floor(ld), fa: Math.floor(fa), fd: Math.floor(fd), win: fa >= fd });
    pushLog('🧪 شبیه‌سازی نبرد انجام شد');
  };

  const countdown = (ts) => {
    const d = new Date(ts).getTime() - now;
    if (d <= 0) return 'زمان نبرد!';
    const h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000), s = Math.floor((d % 60000) / 1000);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const activeMatches = matches.filter((m) => m.status !== 'finished');
  const myActive = matches.filter((m) => m.status !== 'finished' && mySide(m));
  const nextTourAt = settings?.next_tournament_at ? new Date(settings.next_tournament_at).getTime() - now : null;
  const sanActive = country?.sanctions && country.sanctions.until && new Date(country.sanctions.until) > new Date() ? country.sanctions : null;
  const feed = matches.filter((m) => m.status === 'finished' && m.public_result).slice(0, 8);
  const tickerItems = [
    ...feed.map((m) => m.public_result),
    ...sanctions.slice(0, 4).map((s) => '🥶 تحریم ' + (SANCTIONS.find((x) => x.key === s.type)?.title || s.type)),
  ];

  const TABS = [
    { id: 'duel', label: 'نبرد تن‌به‌تن', icon: Swords },
    { id: 'blitz', label: '⚡ جنگ سریع', icon: Zap },
    { id: 'tournament', label: 'جام بزرگ جنگ', icon: Trophy },
    { id: 'cold', label: 'جنگ سرد', icon: Snowflake },
    { id: 'history', label: 'بایگانی + فید جهانی', icon: ScrollText },
    { id: 'alliance', label: 'جنگ اتحادها', icon: Shield },
    { id: 'coord', label: 'جنگ مختصاتی', icon: Crosshair },
  ];

  const modeLabel = (m) => (m.mode === 'blitz' ? '⚡ جنگ سریع (BLITZ)' : m.mode === 'duel' ? 'نبرد تن‌به‌تن' : `جام — دور ${toFa(m.round)}`);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`@keyframes gridFloor { to { background-position: 0 44px; } } @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } } @keyframes nxSpin { to { transform: rotate(360deg); } } @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } } @keyframes crt { 0% { opacity: .12; } 50% { opacity: .2; } 100% { opacity: .12; } } @keyframes aurora { from { transform: translate3d(-40px,0,0) scale(1); } to { transform: translate3d(60px,30px,0) scale(1.15); } } @keyframes typeW { from { width: 0; } to { width: 100%; } } @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(239,68,68,.5); transform: none; } 92% { text-shadow: -3px 0 #fbbf24, 3px 0 #ef4444; transform: translateX(2px); } 94% { text-shadow: 3px 0 #fbbf24, -3px 0 #ef4444; transform: translateX(-2px); } 96% { text-shadow: 0 0 26px rgba(239,68,68,.5); transform: none; } }`}</style>

      {/* صحنه پس‌زمینه */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[42vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'linear-gradient(rgba(239,68,68,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,.4) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[140px]" />
        <div className="absolute -top-32 left-1/4 h-[380px] w-[520px] rounded-full bg-fuchsia-600/10 blur-[130px]" style={{ animation: 'aurora 9s ease-in-out infinite alternate' }} />
        <div className="absolute top-10 right-1/4 h-[320px] w-[460px] rounded-full bg-cyan-500/10 blur-[120px]" style={{ animation: 'aurora 11s ease-in-out infinite alternate-reverse' }} />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'64\' viewBox=\'0 0 56 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 0L56 16v32L28 64 0 48V16z\' fill=\'none\' stroke=\'%2322d3ee\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '56px 64px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)' }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" style={{ animation: 'scanY 7s linear infinite' }} />
        <div className="absolute bottom-20 left-10 h-72 w-72 rounded-full bg-amber-500/10 blur-[110px]" />
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)', animation: 'crt 4s infinite' }} />
      </div>

      {/* 📢 اعلان — بالای همه‌چیز */}
      <AnimatePresence>
        {notice && (
          <div className="pointer-events-none fixed left-0 right-0 top-24 z-[20000] flex justify-center px-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn('border border-red-400/40 bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(239,68,68,0.35)]', CLIP_SM)}>{notice}</motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between border-y border-red-400/30 py-2" style={HAZARD}>
          <p className="flex items-center gap-2 px-3 font-display text-[9px] font-black uppercase tracking-[0.35em] text-red-400"><Radar size={11} /> War Room Ultra v5 // Live Combat Network</p>
          <div className="flex gap-2 px-3">
            <button onClick={() => setSim(true)} className={cn('flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black text-emerald-300 transition hover:bg-emerald-400/20', CLIP_SM)}>
              <FlaskConical size={11} /> 🧪 شبیه‌ساز نبرد
            </button>
            <button onClick={() => navigate('/worldmap')} className={cn('flex items-center gap-1.5 border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1.5 text-[9px] font-black text-fuchsia-300 transition hover:bg-fuchsia-400/20', CLIP_SM)}>
              <Globe size={11} /> 🗺 نقشه جهان
            </button>
            <button onClick={() => setHelp(true)} className={cn('flex items-center gap-1.5 border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-[9px] font-black text-cyan-300 transition hover:bg-cyan-400/20', CLIP_SM)}>
              <BookOpen size={11} /> 📖 راهنما
            </button>
          </div>
        </div>

        <Ticker items={tickerItems} />
    {/* 🔐 اطلاعیه مهم VPN — بزرگ و برجسته */}
    <div dir="rtl" className={cn('mb-6 flex items-center gap-4 border-2 border-amber-400/70 bg-gradient-to-r from-amber-500/20 via-red-500/15 to-amber-500/20 px-6 py-5 text-right shadow-[0_0_40px_rgba(251,191,36,0.4)]', CLIP)} style={{ animation: 'pulse 2s ease-in-out infinite' }}>
      <span className="text-5xl">🔐</span>
      <div className="flex-1">
        <p className="mb-1.5 font-display text-lg font-black tracking-widest text-amber-200 md:text-xl" style={{ textShadow: '0 0 20px rgba(251,191,36,0.6)' }}>
          ⚠️ فیلترشکن / VPN خود را روشن کنید!
        </p>
        <p className="text-sm leading-7 text-amber-100/90 md:text-base">
          برای دریافت <b className="text-white">تحلیل هوش مصنوعی دقیق</b> و <b className="text-white">گزارش کامل نبرد</b>، حتماً VPN خود را روشن کنید.
          {' '}بدون VPN، نتیجه با «موتور داخلی ستاد» اعلام می‌شود که دقت کمتری دارد.
        </p>
      </div>
    </div>

        {/* هدر + کارنامه + رتبه */}
        <div className="mb-6 flex flex-wrap items-center gap-6">
          <div className="relative h-24 w-24 shrink-0">
            <div className="absolute inset-0 rounded-full border border-red-400/30" />
            <div className="absolute inset-3 rounded-full border border-red-400/20" />
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(239,68,68,.4), transparent 70deg)', animation: 'nxSpin 3.5s linear infinite' }} />
            <div className={cn('absolute inset-0 m-auto grid h-14 w-14 place-items-center bg-gradient-to-br from-red-500/20 to-amber-500/20 text-3xl', CLIP_SM)}>{country?.flag || '⚔️'}</div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl font-black tracking-[0.1em] text-white md:text-6xl" style={{ animation: 'glitch 4s infinite' }}>
              اتاق <span className="text-gradient">جنگ</span>
            </h1>
            <p className="mt-1 overflow-hidden whitespace-nowrap font-mono text-[10px] tracking-[0.3em] text-red-400/70" style={{ animation: 'typeW 3s steps(40) 1 both' }}>
              فرماندهی کل نیروهای مسلح دیجیتال // پروتکل نبرد فعال
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <span className={cn('flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 font-bold text-emerald-300', CLIP_SM)}><Banknote size={11} /> {fmtNum(wd)} WD</span>
              <span className={cn('border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 font-bold text-emerald-300', CLIP_SM)}>برد: {toFa(wins)}</span>
              <span className={cn('border border-red-400/40 bg-red-400/10 px-2.5 py-1 font-bold text-red-300', CLIP_SM)}>💀 باخت: {toFa(losses)}</span>
              <span className={cn('flex items-center gap-1.5 border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 font-bold text-cyan-300', CLIP_SM)}><Activity size={11} /> نرخ پیروزی: {toFa(finishedMine.length ? Math.round((wins / finishedMine.length) * 100) : 0)}٪</span>
              {nextTourAt !== null && (
                <span className={cn('flex items-center gap-1.5 border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-bold text-amber-300', CLIP_SM)}>
                  <Trophy size={11} /> جام بعدی: {nextTourAt > 0 ? `${toFa(Math.floor(nextTourAt / 86400000))} روز دیگر` : 'در حال برگزاری!'}
                </span>
              )}
            </div>
          </div>
          {/* 🎖 کارت درجه فرماندهی */}
          <div className={cn('w-full border border-amber-400/30 bg-[#0a0c08]/85 p-5 md:w-80', CLIP)}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">درجه فرماندهی</p>
              <div className="flex gap-1">
                <button onClick={() => switchModel('ir')} className={cn('border px-2 py-1 text-[9px] font-black transition', CLIP_SM, rankModel === 'ir' ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-500 hover:text-white')}>🇮 ایرانی</button>
                <button onClick={() => switchModel('int')} className={cn('border px-2 py-1 text-[9px] font-black transition', CLIP_SM, rankModel === 'int' ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-500 hover:text-white')}>🌐 بین‌المللی</button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn('grid h-28 w-28 shrink-0 place-items-center border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-red-500/10', CLIP)}>
                <RankInsignia s={rank.s} size={104} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-black text-white">{rank.t}</p>
                <p className="mt-1 text-[10px] text-slate-500">{toFa(wins)} پیروزی ثبت‌شده</p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all" style={{ width: (nxt ? Math.min(100, (wins / nxt.w) * 100) : 100) + '%' }} />
                </div>
                <p className="mt-1 text-[9px] text-slate-500">{nxt ? `${toFa(nxt.w - wins)} پیروزی تا درجه «${nxt.t}»` : 'بالاترین درجه ممکن!'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* تحریم‌های روی خودت */}
        {sanActive && (
          <div className={cn('mb-6 border border-red-400/40 bg-red-400/5 p-4', CLIP)}>
            <p className="mb-2 flex items-center gap-2 text-xs font-black text-red-300">🥶 تحریم‌های فعال روی کشور تو — تا {countdown(sanActive.until)}</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(SAN_LABEL).map((k) => sanActive[k] && (
                <span key={k} className={cn('border px-2.5 py-1 text-[9px] font-bold', CLIP_SM, Number(sanActive[k]) < 1 ? 'border-red-400/40 bg-red-400/10 text-red-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300')}>
                  {SAN_LABEL[k]}: {Number(sanActive[k]) < 1 ? `−${toFa(Math.round((1 - sanActive[k]) * 100))}٪` : `+${toFa(Math.round((sanActive[k] - 1) * 100))}٪`}
                </span>
              ))}
            </div>
          </div>
        )}

    {/* 🔐 اطلاعیه VPN */}
    <div className={cn('mb-4 flex items-center gap-3 border border-amber-400/40 bg-amber-400/10 px-4 py-3', CLIP_SM)}>
      <span className="text-lg">🔐</span>
      <p className="text-[10px] leading-5 text-amber-200">
        <b>برای تحلیل هوش مصنوعی (نتیجهٔ دقیق‌تر و گزارش کامل) فیلترشکن/VPN خود را روشن کنید.</b>
        {' '}بدون VPN، نتیجه با «موتور داخلی ستاد» اعلام می‌شود و ممکن است دقت کمتری داشته باشد.
      </p>
    </div>

    {/* تب‌ها */}
    <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex items-center gap-2 border px-5 py-2.5 font-display text-[10px] font-black uppercase tracking-widest transition-all', CLIP_SM, tab === t.id ? 'border-red-400/60 bg-red-400/15 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white')}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* ─────────── تب دوئل ─────────── */}
        {tab === 'duel' && (
          <div className="grid gap-6 lg:grid-cols-4">
            <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5 backdrop-blur-xl lg:col-span-1', CLIP)}>
              <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-red-400">🎯 انتخاب هدف</p>
              <div className="chat-scroll max-h-72 space-y-1.5 overflow-y-auto">
                {targets.length === 0 && <p className="py-6 text-center text-xs text-slate-600">کشور دیگری نیست!</p>}
                {targets.map((t) => (
                  <button key={t.id} onClick={() => setTarget(t)} className={cn('flex w-full items-center gap-2 border p-2.5 text-right transition', CLIP_SM, target?.id === t.id ? 'border-red-400/60 bg-red-400/15' : 'border-white/5 bg-white/5 hover:bg-white/10')}>
                    <span className="text-xl">{t.flag}</span>
                    <span className="flex-1 text-xs font-bold text-white">{t.name_fa || t.name_en}</span>
                    <span className="text-[9px] text-amber-300">⚡ {fmtNum(powerMap[t.id] || 0)}</span>
                    {target?.id === t.id && <Crosshair size={13} className="text-red-400" />}
                  </button>
                ))}
              </div>
              <button onClick={declareDuel} disabled={busy === 'duel' || !target} className={cn('mt-4 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-amber-500 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_26px_rgba(239,68,68,0.4)] disabled:opacity-40', CLIP_SM)}>
                <Swords size={15} /> اعلام جنگ
              </button>
              {target && (
                <button onClick={() => doSpy(target)} disabled={busy === 'spy' + target.id} className={cn('mt-2 flex w-full items-center justify-center gap-2 border border-purple-400/40 bg-purple-400/10 py-2.5 text-[10px] font-black text-purple-300 transition hover:bg-purple-400/20 disabled:opacity-40', CLIP_SM)}>
                  <Search size={13} /> 🕵️ عملیات جاسوسی (۵۰ WD)
                </button>
              )}
              <p className="mt-2 text-[9px] leading-4 text-slate-500">⚡ قدرت نظامی • 🕵️ جاسوسی = ذخایر + کابینه + تجهیزات حریف</p>
            </div>
            <div className="space-y-4 lg:col-span-2">
              {myActive.filter((m) => m.mode !== 'blitz').length === 0 ? (
                <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-12 text-center text-slate-500', CLIP)}>نبرد فعالی نداری — هدفی انتخاب کن، منتظر جام بمان یا ⚡ جنگ سریع بزن!</div>
              ) : (
                                myActive.filter((m) => m.mode !== 'blitz').map((m) => {
                  const side = mySide(m);
                  const submitted = side === 'att' ? m.att_sub : m.def_sub;
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('relative border p-5', CLIP, m.mode === 'blitz' ? 'border-amber-400/50 bg-amber-400/5' : 'border-red-400/40 bg-red-400/5')}>
                      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-red-400/60" />
                      <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                        ⚔️ {modeLabel(m)}
                        <span className={cn('border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-display text-[10px] tabular-nums text-amber-300', CLIP_SM)}>⏱ {countdown(m.scheduled_at)}</span>
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">۱) درصد تعهد ۲) سناریوی حمله و دفاع ۳) قضاوت هوش مصنوعی. (اول با شبیه‌ساز تست کن!)</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!submitted && (
                          <button onClick={() => setPlan({ id: m.id, side, mode: m.mode, deadline: m.scheduled_at })} className={cn('bg-gradient-to-r from-amber-400 to-red-500 px-5 py-2.5 font-display text-[10px] font-black uppercase tracking-[0.2em] text-slate-950', CLIP_SM)}>
                            📜 ثبت برنامه نبرد
                          </button>
                        )}
                        {submitted && <span className={cn('border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300', CLIP_SM)}>✅ برنامه ثبت شد</span>}
                        <button onClick={() => forfeit(m.id)} disabled={busy === 'ff' + m.id} className={cn('border border-red-400/40 bg-red-400/10 px-4 py-2 text-[10px] font-bold text-red-300 transition hover:bg-red-400/20', CLIP_SM)}>
                          🏳️ انصراف
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <BattleConsole lines={log} />
            </div>
            <div className="space-y-4 lg:col-span-1">
              <RadarPanel active={activeMatches} nameOf={nameOf} spyAlert={spyAlert} />
              <div className={cn('border border-amber-400/30 bg-[#0a0c08]/85 p-4', CLIP)}>
                <p className="mb-2 flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.3em] text-amber-300"><Medal size={11} /> تالار افتخار</p>
                {hall.length === 0 ? <p className="text-[10px] text-slate-600">هنوز قهرمانی ثبت نشده</p> : hall.map(([id, w], i) => (
                  <p key={id} className="mb-1.5 flex items-center gap-2 text-[10px] font-bold text-white">
                    <span>{['🥇', '🥈', '🥉'][i]}</span>
                    <span className="flex-1">{nameOf(id)}</span>
                    <span className="text-amber-300">{toFa(w)} برد</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────── تب جنگ سریع (BLITZ) ─────────── */}
        {tab === 'blitz' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className={cn('relative border border-amber-400/40 bg-[#0a0c08]/85 p-6 lg:col-span-2', CLIP)} style={HAZARD}>
              <p className="font-display text-2xl font-black text-amber-300 md:text-4xl" style={{ animation: 'glitch 3s infinite' }}>⚡ حالت جنگ سریع (BLITZ)</p>
              <p className="mt-2 text-[11px] leading-6 text-slate-300">وصل شدن آنی به فرمانده آنلاین • مهلت ثبت سناریو فقط <b className="text-red-300">۹۰ ثانیه</b> • ضریب سختی ×۲</p>
              <div className="mt-4 grid gap-3 text-[10px] md:grid-cols-3">
                <div className={cn('border border-emerald-400/30 bg-emerald-400/5 p-3', CLIP_SM)}>
                  <p className="font-black text-emerald-300">🏆 پیروزی</p>
                  <p className="mt-1 text-slate-300">+۴۰۰ WD • +۶۰ XP • غنیمت ۱۵٪ از دو منبع تصادفی دشمن</p>
                </div>
                <div className={cn('border border-red-400/30 bg-red-400/5 p-3', CLIP_SM)}>
                  <p className="font-black text-red-300">💀 شکست</p>
                  <p className="mt-1 text-slate-300">−۲۵۰ WD غرامت • −۲۵ XP • از دست دادن ۱۵٪ دو منبع</p>
                </div>
                <div className={cn('border border-amber-400/30 bg-amber-400/5 p-3', CLIP_SM)}>
                  <p className="font-black text-amber-300">⏱ قوانین</p>
                  <p className="mt-1 text-slate-300">۹۰ ثانیه مهلت • ثبت نکردن = شکست خودکار • موسیقی جنگ فعال</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {!blitzPoll ? (
                  <button onClick={joinBlitz} disabled={busy === 'blitz'} className={cn('bg-gradient-to-r from-amber-400 to-red-500 px-8 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.5)] disabled:opacity-40', CLIP_SM)}>
                    ⚡ ورود به صف جنگ سریع
                  </button>
                ) : (
                  <>
                    <span className={cn('flex items-center gap-2 border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-[10px] font-black text-amber-300', CLIP_SM)}>
                      <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" /> در حال جست‌وجوی حریف آنلاین...
                    </span>
                    <button onClick={leaveBlitz} className={cn('border border-red-400/40 bg-red-400/10 px-4 py-3 text-[10px] font-black text-red-300', CLIP_SM)}>🚪 خروج از صف</button>
                  </>
                )}
              </div>
            </div>
            <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
              <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300">⚡ نبردهای سریع فعال</p>
              {matches.filter((m) => m.mode === 'blitz' && m.status !== 'finished').length === 0 ? (
                <p className="text-[10px] text-slate-600">نبرد سریعی در جریان نیست</p>
              ) : (
                matches.filter((m) => m.mode === 'blitz' && m.status !== 'finished').map((m) => {
                  const side = mySide(m);
                  const submitted = side === 'att' ? m.att_sub : side === 'def' ? m.def_sub : false;
                  return (
                    <div key={m.id} className={cn('mb-2 border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-[10px] font-bold text-amber-200', CLIP_SM)}>
                      <p>{nameOf(m.attacker_country)} ⚡ {nameOf(m.defender_country)} — ⏱ {countdown(m.scheduled_at)}</p>
                      {side && !submitted && new Date(m.scheduled_at).getTime() > now && (
                        <button onClick={() => setPlan({ id: m.id, side, mode: 'blitz', deadline: m.scheduled_at })} className={cn('mt-1.5 w-full bg-gradient-to-r from-amber-400 to-red-500 py-1.5 font-display text-[9px] font-black uppercase tracking-[0.2em] text-slate-950', CLIP_SM)}>
                          📜 ثبت سناریو (⏱ {countdown(m.scheduled_at)})
                        </button>
                      )}
                      {side && !submitted && new Date(m.scheduled_at).getTime() <= now && (
                        <p className="mt-1 text-[9px] font-black text-red-400">⏰ زمان این نبرد تمام شده — در حال اعلام نتیجه...</p>
                      )}
                      {side && submitted && <p className="mt-1 text-[9px] text-emerald-300">✅ سناریو ثبت شد — منتظر حریف</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─────────── تب تورنومنت ─────────── */}
        {tab === 'tournament' && (
          <div className="space-y-8">
            {tours.length === 0 ? (
              <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-14 text-center text-slate-500', CLIP)}>🏆 هنوز جامی برگزار نشده — ادمین از پنل مدیریت شروع می‌کند!</div>
            ) : (
              tours.map((t) => {
                const tms = matches.filter((m) => m.tournament_id === t.id);
                const rounds = Array.from(new Set(tms.map((m) => m.round))).sort((a, b) => a - b);
                return (
                  <div key={t.id}>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-lg font-black text-white">🏆 {t.title}</h3>
                      <span className={cn('border px-2 py-0.5 text-[9px] font-black uppercase', CLIP_SM, t.status === 'open' ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300')}>{t.status === 'open' ? 'در حال برگزاری' : 'پایان‌یافته'}</span>
                      <span className="text-[10px] text-slate-500">🥇 ۲۵۰ WD • 🥈 ۲۰۰ WD • 🥉 ۶۰۰ WD</span>
                    </div>
                    <div className="space-y-5">
                      {rounds.map((r) => (
                        <div key={r}>
                          <p className="mb-2 font-display text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">دور {toFa(r)}</p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {tms.filter((m) => m.round === r).map((m) => {
                              const side = mySide(m);
                              const submitted = side === 'att' ? m.att_sub : side === 'def' ? m.def_sub : false;
                              return (
                                <div key={m.id} className={cn('border p-4', CLIP_SM, m.status === 'finished' ? 'border-white/10 bg-white/5' : 'border-red-400/40 bg-red-400/5')}>
                                  <p className="flex items-center justify-between text-xs font-bold text-white">
                                    <span>{nameOf(m.attacker_country)} ⚔ {m.defender_country ? nameOf(m.defender_country) : 'استراحت'}</span>
                                    {m.status === 'finished' ? (
                                      <button onClick={() => setAnalysis(m)} className="flex items-center gap-1 text-[9px] text-cyan-300"><Eye size={10} /> نتیجه</button>
                                    ) : (
                                      <span className="font-display text-[10px] tabular-nums text-amber-300">⏱ {countdown(m.scheduled_at)}</span>
                                    )}
                                  </p>
                                  {m.status !== 'finished' && side && !submitted && (
                                    <button onClick={() => setPlan({ id: m.id, side, mode: m.mode, deadline: m.scheduled_at })} className={cn('mt-2 bg-gradient-to-r from-amber-400 to-red-500 px-4 py-1.5 text-[9px] font-black uppercase text-slate-950', CLIP_SM)}>📜 ثبت برنامه</button>
                                  )}
                                  {m.status !== 'finished' && side && submitted && <p className="mt-2 text-[9px] text-emerald-300">✅ برنامه تو ثبت شد</p>}
                                  {m.status === 'finished' && m.winner_country && <p className="mt-1 text-[9px] text-emerald-300">برنده: {nameOf(m.winner_country)}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─────────── تب جنگ سرد ─────────── */}
        {tab === 'cold' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
              <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300">🎯 هدف تحریم</p>
              <div className="chat-scroll max-h-72 space-y-1.5 overflow-y-auto">
                {targets.map((t) => (
                  <button key={t.id} onClick={() => setSanTarget(t)} className={cn('flex w-full items-center gap-2 border p-2.5 text-right', CLIP_SM, sanTarget?.id === t.id ? 'border-cyan-400/60 bg-cyan-400/15' : 'border-white/5 bg-white/5 hover:bg-white/10')}>
                    <span className="text-xl">{t.flag}</span>
                    <span className="flex-1 text-xs font-bold text-white">{t.name_fa || t.name_en}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {SANCTIONS.map((s) => (
                <motion.div key={s.key} whileHover={{ y: -4 }} className={cn('relative border border-cyan-400/20 bg-[#0a0c08]/85 p-4', CLIP)}>
                  <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-cyan-400/40" />
                  <p className="flex items-center gap-2 text-sm font-bold text-white"><span className="text-2xl">{s.icon}</span> {s.title}</p>
                  <p className="mt-2 text-[10px] text-red-300">روی هدف: {s.def}</p>
                  <p className="mt-1 text-[10px] text-amber-300">روی تو: {s.att}</p>
                  <button onClick={() => applySanction(s.key)} disabled={busy === 'san' + s.key || wd < s.cost} className={cn('mt-3 w-full border border-cyan-400/40 bg-cyan-400/10 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-40', CLIP_SM)}>
                    اعمال تحریم • {toFa(s.cost)} WD
                  </button>
                </motion.div>
              ))}
              <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-4 sm:col-span-2', CLIP)}>
                <p className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-slate-400">📜 تحریم‌های اخیر جهان</p>
                {sanctions.length === 0 ? <p className="text-xs text-slate-600">هنوز تحریمی ثبت نشده</p> : sanctions.slice(0, 6).map((s) => (
                  <p key={s.id} className="mb-1 text-[10px] text-slate-400">🥶 {SANCTIONS.find((x) => x.key === s.type)?.title || s.type} — {new Date(s.created_at).toLocaleString('fa-IR')}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────── تب جنگ اتحادها ─────────── */}
        {tab === 'alliance' && <AllianceWarTab flash={flash} pushLog={pushLog} />}

        {/* ─────────── تب جنگ مختصاتی ─────────── */}
        {tab === 'coord' && <CoordWarTab flash={flash} pushLog={pushLog} />}

        {/* ─────────── تب بایگانی + فید ─────────── */}
        {tab === 'history' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-slate-400">🗂 نبردهای من</p>
              <div className="space-y-2.5">
                {finishedMine.length === 0 ? (
                  <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-10 text-center text-slate-500', CLIP)}>📜 بایگانی خالی است</div>
                ) : (
                  finishedMine.map((m) => (
                    <button key={m.id} onClick={() => setAnalysis(m)} className={cn('flex w-full flex-wrap items-center gap-3 border p-4 text-right transition hover:border-cyan-400/40', CLIP_SM, 'border-white/10 bg-white/5')}>
                      <span className={cn('border px-2 py-0.5 text-[9px] font-black', CLIP_SM, m.winner_country === country?.id ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-red-400/40 bg-red-400/10 text-red-400')}>
                        {m.winner_country === country?.id ? 'پیروزی' : 'شکست'}
                      </span>
                      <span className="flex-1 text-xs text-slate-300">{m.public_result}</span>
                      <Eye size={13} className="text-cyan-300" />
                    </button>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-slate-400"><Globe size={12} /> فید زنده نبردهای جهانی</p>
              <div className="space-y-2">
                {feed.length === 0 ? <p className="text-xs text-slate-600">هنوز نبردی در جهان نیست</p> : feed.map((m) => (
                  <div key={m.id} className={cn('border border-white/5 bg-white/5 p-3 text-[10px] text-slate-400', CLIP_SM)}>
                    {m.public_result}
                    <span className="mr-2 text-slate-600">{new Date(m.finished_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────── مودال جاسوسی ─────────── */}
      <AnimatePresence>
        {spy && spyData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[16000] grid place-items-center bg-black/80 px-4 backdrop-blur-[4px]" onClick={() => { setSpy(null); setSpyData(null); }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} onClick={(e) => e.stopPropagation()} className={cn('max-h-[88vh] w-full max-w-lg overflow-y-auto border border-purple-400/40 bg-[#0a0c08]/95 p-6', CLIP)}>
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-sm font-black text-white"><Search size={15} className="text-purple-300" /> پرونده جاسوسی: {spy.flag} {spy.name_fa}</p>
                <button onClick={() => { setSpy(null); setSpyData(null); }} className="grid h-7 w-7 place-items-center text-slate-500 hover:text-white"><X size={14} /></button>
              </div>
              <p className="mb-3 text-[10px] text-slate-500">جمعیت: {fmtNum(spyData.population || 0)} • کابینه: {(spyData.cabinet || []).length} وزیر</p>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-300">💰 ذخایر استراتژیک</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(RESOURCES).map(([k, r]) => (
                  <div key={k} className={cn('border border-white/10 bg-white/5 p-2 text-center', CLIP_SM)}>
                    <p className="text-sm">{r.icon}</p>
                    <p className="text-[8px] text-slate-500">{r.label}</p>
                    <p className="font-display text-[10px] font-black text-white">{fmtNum(spyData.resources?.[k] ?? 0)}</p>
                  </div>
                ))}
              </div>
              <p className="mb-2 mt-4 text-[10px] font-black uppercase tracking-widest text-red-300">🎖 تجهیزات نظامی (قدرت کل: {fmtNum(powerMap[spy.id] || 0)})</p>
              {(milMap[spy.id] || []).length === 0 ? <p className="text-[10px] text-slate-600">بدون تجهیز — هدف آسان! 🎯</p> : (milMap[spy.id] || []).map((m, i) => (
                <p key={i} className={cn('mb-1.5 flex justify-between border border-white/10 bg-white/5 px-3 py-1.5 text-[10px]', CLIP_SM)}>
                  <span className="text-slate-300">🎖 {m.name} ×{toFa(m.qty)}</span>
                  <span className="font-black text-red-300">+{fmtNum(Number(m.power) * m.qty)}</span>
                </p>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال شبیه‌ساز ─────────── */}
      <AnimatePresence>
        {sim && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[16000] grid place-items-center bg-black/80 px-4 backdrop-blur-[4px]" onClick={() => setSim(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} onClick={(e) => e.stopPropagation()} className={cn('max-h-[88vh] w-full max-w-lg overflow-y-auto border border-emerald-400/40 bg-[#0a0c08]/95 p-6', CLIP)}>
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-sm font-black text-white"><FlaskConical size={15} className="text-emerald-300" /> 🧪 شبیه‌ساز نبرد (تست سناریو قبل از جنگ)</p>
                <button onClick={() => setSim(false)} className="grid h-7 w-7 place-items-center text-slate-500 hover:text-white"><X size={14} /></button>
              </div>
              <label className="mb-1 block text-[10px] font-bold text-red-300">سناریوی تو (حمله + دفاع)</label>
              <textarea value={simA} onChange={(e) => setSimA(e.target.value)} rows={4} placeholder="سناریوی خودت را بنویس..." className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-red-400/50" />
              <label className="mb-1 mt-2 block text-[10px] font-bold text-amber-300">تعهد تو: {toFa(simCA)}٪</label>
              <input type="range" min="10" max="100" step="5" value={simCA} onChange={(e) => setSimCA(Number(e.target.value))} className="w-full accent-red-500" />
              <label className="mb-1 mt-3 block text-[10px] font-bold text-cyan-300">سناریوی فرضی حریف</label>
              <textarea value={simD} onChange={(e) => setSimD(e.target.value)} rows={4} placeholder="حدس سناریوی حریف..." className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-cyan-400/50" />
              <label className="mb-1 mt-2 block text-[10px] font-bold text-amber-300">تعهد حریف: {toFa(simCD)}٪</label>
              <input type="range" min="10" max="100" step="5" value={simCD} onChange={(e) => setSimCD(Number(e.target.value))} className="w-full accent-cyan-400" />
              <button onClick={runSim} className={cn('mt-4 w-full bg-gradient-to-r from-emerald-400 to-cyan-500 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950', CLIP_SM)}>اجرای شبیه‌سازی</button>
              {simRes && (
                <div className="mt-4 space-y-3">
                  <p className={cn('border p-3 text-center text-sm font-black', CLIP_SM, simRes.win ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-red-400/40 bg-red-400/10 text-red-300')}>
                    {simRes.win ? '🏆 پیش‌بینی: پیروزی تو!' : '💀 پیش‌بینی: شکست تو!'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center text-[9px]">
                    <div className={cn('border border-red-400/20 bg-white/5 p-2', CLIP_SM)}>تو<br />سناریو {toFa(simRes.sa)} • منابع {toFa(simRes.aa)} • شانس {toFa(simRes.la)}<br /><b className="text-red-300">نهایی {toFa(simRes.fa)}</b></div>
                    <div className={cn('border border-cyan-400/20 bg-white/5 p-2', CLIP_SM)}>حریف<br />سناریو {toFa(simRes.sd)} • منابع {toFa(simRes.ad)} • شانس {toFa(simRes.ld)}<br /><b className="text-cyan-300">نهایی {toFa(simRes.fd)}</b></div>
                  </div>
                  <p className="text-[9px] text-slate-500">💡 سناریویت ضعیف شد؟ کلمات تاکتیکی، اعداد و برنامه احتمالی («اگر...») اضافه کن.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال راهنما ─────────── */}
      <AnimatePresence>
        {help && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[16000] grid place-items-center bg-black/80 px-4 backdrop-blur-[4px]" onClick={() => setHelp(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} onClick={(e) => e.stopPropagation()} className={cn('max-h-[88vh] w-full max-w-lg overflow-y-auto border border-cyan-400/40 bg-[#0a0c08]/95 p-6', CLIP)}>
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-sm font-black text-white"><BookOpen size={15} className="text-cyan-300" /> راهنمای کامل جنگ</p>
                <button onClick={() => setHelp(false)} className="grid h-7 w-7 place-items-center text-slate-500 hover:text-white"><X size={14} /></button>
              </div>
              <div className="space-y-4 text-[11px] leading-6 text-slate-300">
                <div><p className="font-black text-red-300">⚔️ نبرد تن‌به‌تن:</p><p>هدف انتخاب کن، اعلام جنگ بزن (آژیر سراسری)، هر دو فرمانده تعهد + سناریو می‌فرستند، AI قضاوت می‌کند. برنده ۱۵۰ WD + غنیمت.</p></div>
                <div><p className="font-black text-amber-300">⚡ جنگ سریع (BLITZ):</p><p>صف آنی با فرمانده آنلاین • فقط ۹۰ ثانیه مهلت سناریو • پیروزی: +۴۰۰ WD و +۶۰ XP و غنیمت منابع • شکست: −۲۵۰ WD و −۲۵ XP و از دست دادن منابع. ثبت نکردن = شکست خودکار!</p></div>
                <div><p className="font-black text-purple-300">🕵️ جاسوسی:</p><p>با ۵۰ WD ذخایر، کابینه و تجهیزات حریف را ببین و هوشمندانه‌تر حمله کن (۱۲ ساعت رایگان می‌ماند).</p></div>
                <div><p className="font-black text-emerald-300">🧪 شبیه‌ساز:</p><p>قبل از ارسال واقعی، سناریویت را تست کن و نمره‌اش را ببین — رایگان و نامحدود!</p></div>
                <div><p className="font-black text-amber-300">🏆 جام بزرگ:</p><p>براکت رندوم دوربه‌دور تا فینال. 🥇 ۵۰۰ • 🥈 ۲۰۰ • 🥉 ۶۰۰ WD.</p></div>
                <div><p className="font-black text-cyan-300">🥶 جنگ سرد:</p><p>تحریم = آسیب اقتصادی به حریف + هزینه کوچک برای تو. ۲۴ ساعت فعال.</p></div>
                <div><p className="font-black text-fuchsia-300">🧮 فرمول:</p><p>سناریو ۵۰٪ {'>'} منابع ۴۰٪ {'>'} شانس ۱۰٪. با برد، رتبه فرماندهی‌ات بالا می‌رود تا مارشال میدان! 👑</p></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال برنامه نبرد ─────────── */}
      <AnimatePresence>
        {plan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[16000] grid place-items-center bg-black/80 px-4 backdrop-blur-[4px]" onClick={() => setPlan(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} onClick={(e) => e.stopPropagation()} className={cn('max-h-[88vh] w-full max-w-lg overflow-y-auto border border-red-400/40 bg-[#0a0c08]/95 p-6', CLIP)}>
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-sm font-black text-white"><ScrollText size={15} className="text-red-400" /> برنامه نبرد — تعهد + سناریوها</p>
                <button onClick={() => setPlan(null)} className="grid h-7 w-7 place-items-center text-slate-500 hover:text-white"><X size={14} /></button>
              </div>
              {plan.mode === 'blitz' ? (
                <div className="mb-4 border-2 border-red-500/60 bg-red-500/10 p-3 text-center" style={HAZARD}>
                  <p className="font-display text-sm font-black text-red-400" style={{ animation: 'blinkDot 0.7s infinite' }}>⚡ حالت BLITZ — فقط {countdown(plan.deadline)} فرصت داری!</p>
                  <p className="mt-1 text-[9px] text-red-200">🎵 موسیقی جنگ در حال پخش — سریع بنویس، فرمانده!</p>
                </div>
              ) : (
                plan.deadline && (
                  <p className="mb-3 rounded-md border border-amber-400/30 bg-amber-400/10 p-2 text-center text-[10px] font-black text-amber-300">⏱ مهلت ثبت سناریو: {countdown(plan.deadline)}</p>
                )
              )}
              <label className="mb-1 block text-[10px] font-bold text-amber-300">درصد تجهیزات متعهدشده: {toFa(commit)}٪</label>
              <input type="range" min="10" max="100" step="5" value={commit} onChange={(e) => setCommit(Number(e.target.value))} className="w-full accent-red-500" />
              <p className="mt-1 text-[9px] text-slate-500">تعهد بیشتر = قدرت بیشتر + سوختن نفت/آهن/اورانیوم بیشتر</p>
              <label className="mb-1 mt-4 block text-[10px] font-bold text-red-300">سناریوی حمله *</label>
              <textarea value={attText} onChange={(e) => setAttText(e.target.value)} rows={5} placeholder={'۱) بمباران موشکی پدافند\n۲) یورش زرهی با پشتیبانی پهپاد\n۳) جنگ الکترونیک...'} className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-red-400/50" />
              <label className="mb-1 mt-3 block text-[10px] font-bold text-cyan-300">سناریوی دفاع *</label>
              <textarea value={defText} onChange={(e) => setDefText(e.target.value)} rows={5} placeholder={'۱) پدافند لایه‌ای\n۲) کمین زرهی در دره\n۳) ضدحمله شبانه...'} className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-cyan-400/50" />
              <p className="mt-2 rounded-md border border-amber-400/20 bg-amber-400/5 p-2 text-[9px] leading-4 text-amber-200/80">اولویت: سناریو (۵۰٪) {'>'} منابع (۴۰٪) {'>'} شانس (۱۰٪)</p>
              <button onClick={submitPlan} disabled={busy === 'plan'} className={cn('mt-4 w-full bg-gradient-to-r from-red-500 to-amber-500 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 disabled:opacity-50', CLIP_SM)}>
                {busy === 'plan' ? '⏳ ...' : '🚀 ارسال برنامه به فرماندهی'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* ─────────── مودال تحلیل — سوپر سینمایی ─────────── */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[16000] grid place-items-center bg-black/90 px-4 backdrop-blur-md"
            onClick={() => setAnalysis(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 40, rotateX: 15 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.85, y: 40, rotateX: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative max-h-[92vh] w-full max-w-3xl overflow-y-auto border-2 border-cyan-400/50 bg-gradient-to-br from-[#0a0c08] via-[#1a0a0a] to-[#0a0c08] p-8 shadow-[0_0_80px_rgba(239,68,68,0.3)]',
                CLIP
              )}
              style={{ perspective: '1000px' }}
            >
              {/* افکت‌های بصری پس‌زمینه */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-red-500/10 blur-[100px]" style={{ animation: 'aurora 8s ease-in-out infinite alternate' }} />
                <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-[100px]" style={{ animation: 'aurora 10s ease-in-out infinite alternate-reverse' }} />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
              </div>

              {(() => {
                const rep = analysis.ai_report || null;
                const mine = mySide(analysis);
                const aA = analysis.att_analysis || null;
                const aD = analysis.def_analysis || null;
                const attName = nameOf(analysis.attacker_country);
                const defName = analysis.defender_country ? nameOf(analysis.defender_country) : '—';
                const iWon = mine && analysis.winner_country === country?.id;
                const bars = [
                  { l: 'سناریو', a: aA?.scenario, d: aD?.scenario, icon: '📋' },
                  { l: 'منابع', a: aA?.asset, d: aD?.asset, icon: '⚙️' },
                  { l: 'شانس', a: aA?.luck, d: aD?.luck, icon: '🎲' },
                  { l: 'نهایی', a: aA?.final, d: aD?.final, icon: '🏆' },
                ];

                return (
                  <>
                    {/* هدر سینمایی */}
                    <div className="relative mb-6 border-b-2 border-cyan-400/30 pb-4 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="mb-2 text-6xl"
                      >
                        {iWon ? '🏆' : analysis.winner_country ? '⚔️' : '🤝'}
                      </motion.div>
                      <p className="mb-2 font-display text-[10px] uppercase tracking-[0.5em] text-cyan-400/70">
                        گزارش تحلیل نبرد {rep?.source === 'staff' ? '— ستاد کل' : '— هوش مصنوعی فرماندهی'}
                      </p>
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl font-black leading-7 text-amber-300 md:text-2xl"
                        style={{ textShadow: '0 0 30px rgba(251,191,36,0.5)' }}
                      >
                        {rep?.title || analysis.public_result}
                      </motion.h3>
                      {mine && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.4, type: "spring" }}
                          className={cn(
                            'mx-auto mt-4 inline-block border-2 px-6 py-2 font-display text-sm font-black',
                            CLIP_SM,
                            iWon
                              ? 'border-emerald-400/70 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 text-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                              : analysis.winner_country
                              ? 'border-red-400/70 bg-gradient-to-r from-red-400/20 to-amber-400/20 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                              : 'border-slate-400/40 bg-white/5 text-slate-300'
                          )}
                        >
                          {iWon ? '🏆 پیروزی از آن تو!' : analysis.winner_country ? '💀 شکست خوردی' : '🤝 بدون برنده'}
                        </motion.div>
                      )}
                    </div>

                    {/* نمودار مقایسه‌ای پیشرفته */}
                    {aA && aD && (
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className={cn('mb-6 border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5', CLIP)}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                            <span className="font-display text-sm font-black text-red-300">{attName}</span>
                          </div>
                          <span className="font-display text-xs text-slate-500">VS</span>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-black text-cyan-300">{defName}</span>
                            <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          {bars.map((b, idx) => (
                            <motion.div
                              key={b.l}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + idx * 0.1 }}
                            >
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                  <span>{b.icon}</span> {b.l}
                                </span>
                                <div className="flex gap-3 text-[10px] font-black">
                                  <span className="text-red-300">{toFa(b.a ?? 0)}</span>
                                  <span className="text-slate-600">/</span>
                                  <span className="text-cyan-300">{toFa(b.d ?? 0)}</span>
                                </div>
                              </div>
                              <div className="relative flex h-3 gap-1 overflow-hidden rounded-full bg-white/5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(Number(b.a) || 0) / 2}%` }}
                                  transition={{ delay: 0.7 + idx * 0.1, duration: 0.8 }}
                                  className="absolute left-0 h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                                />
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(Number(b.d) || 0) / 2}%` }}
                                  transition={{ delay: 0.7 + idx * 0.1, duration: 0.8 }}
                                  className="absolute right-0 h-full bg-gradient-to-l from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/10 pt-3">
                          <span className="text-[9px] text-slate-500">فرمول:</span>
                          <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[9px] text-cyan-300">
                            ۵۰٪ سناریو + ۴۰٪ منابع + ۱۰٪ شانس
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* فازهای نبرد — تایم‌لاین */}
                    {rep?.phases?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mb-6"
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <span className="text-2xl"></span>
                          <p className="font-display text-sm uppercase tracking-[0.3em] text-cyan-300">فازهای نبرد</p>
                        </div>

                        <div className="relative space-y-3">
                          {/* خط تایم‌لاین */}
                          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-400/50 via-amber-400/50 to-cyan-400/50" />

                          {rep.phases.map((ph, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.9 + i * 0.15 }}
                              className="relative flex gap-4"
                            >
                              {/* نقطه تایم‌لاین */}
                              <div className={cn(
                                'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-display text-xs font-black',
                                CLIP_SM,
                                ph.winner === 'att'
                                  ? 'border-red-400/70 bg-red-400/20 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                                  : ph.winner === 'def'
                                  ? 'border-cyan-400/70 bg-cyan-400/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                                  : 'border-slate-400/40 bg-white/10 text-slate-400'
                              )}>
                                {i + 1}
                              </div>

                              {/* کارت فاز */}
                              <div className={cn('flex-1 border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4', CLIP_SM)}>
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="font-display text-xs font-black text-white">{ph.name}</p>
                                  <span className={cn(
                                    'border px-2 py-0.5 text-[8px] font-black',
                                    CLIP_SM,
                                    ph.winner === 'att'
                                      ? 'border-red-400/50 bg-red-400/10 text-red-300'
                                      : ph.winner === 'def'
                                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                                      : 'border-slate-400/40 bg-white/5 text-slate-400'
                                  )}>
                                    {ph.winner === 'att' ? '🔴 برتری مهاجم' : ph.winner === 'def' ? ' برتری مدافع' : '⚖️ مساوی'}
                                  </span>
                                </div>
                                {ph.att && (
                                  <p className="mb-1.5 text-[10px] leading-5 text-red-200/90">
                                    <span className="mr-1 font-bold">🔴</span> {ph.att}
                                  </p>
                                )}
                                {ph.def && (
                                  <p className="text-[10px] leading-5 text-cyan-200/90">
                                    <span className="mr-1 font-bold">🔵</span> {ph.def}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* نقطه عطف و MVP */}
                    {(rep?.turning || rep?.mvp) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="mb-6 grid gap-3 md:grid-cols-2"
                      >
                        {rep.turning && (
                          <div className={cn('relative border-2 border-amber-400/40 bg-gradient-to-br from-amber-400/10 to-orange-400/5 p-4', CLIP_SM)}>
                            <div className="absolute -top-2 -left-2 text-3xl">🌀</div>
                            <p className="mb-2 font-display text-[10px] font-black uppercase tracking-widest text-amber-300">نقطه عطف نبرد</p>
                            <p className="text-[11px] leading-6 text-slate-200">{rep.turning}</p>
                          </div>
                        )}
                        {rep.mvp && (
                          <div className={cn('relative border-2 border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-400/10 to-purple-400/5 p-4', CLIP_SM)}>
                            <div className="absolute -top-2 -left-2 text-3xl">🌟</div>
                            <p className="mb-2 font-display text-[10px] font-black uppercase tracking-widest text-fuchsia-300">ستارهٔ میدان</p>
                            <p className="text-[11px] leading-6 text-slate-200">{rep.mvp}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* تلفات */}
                    {rep?.casualties && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.3 }}
                        className="mb-6 grid grid-cols-2 gap-3"
                      >
                        <div className={cn('relative border border-red-400/30 bg-gradient-to-br from-red-400/10 to-transparent p-4 text-center', CLIP_SM)}>
                          <div className="mb-1 text-2xl">💀</div>
                          <p className="text-[9px] font-bold text-slate-500">تلفات مهاجم</p>
                          <p className="mt-1 font-display text-sm font-black text-red-300">{rep.casualties.att}</p>
                        </div>
                        <div className={cn('relative border border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-transparent p-4 text-center', CLIP_SM)}>
                          <div className="mb-1 text-2xl"></div>
                          <p className="text-[9px] font-bold text-slate-500">تلفات مدافع</p>
                          <p className="mt-1 font-display text-sm font-black text-cyan-300">{rep.casualties.def}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* نقاط قوت و ضعف */}
                    {mine && rep && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        className="mb-6 grid gap-3 md:grid-cols-2"
                      >
                        <div className={cn('border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-transparent p-4', CLIP_SM)}>
                          <p className="mb-2 flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-widest text-emerald-300">
                            <span className="text-lg">💪</span> نقاط قوت تو
                          </p>
                          <div className="space-y-1.5">
                            {(rep.myStrengths || []).map((s, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.5 + i * 0.1 }}
                                className="flex items-start gap-2 text-[10px] leading-5 text-slate-300"
                              >
                                <span className="mt-0.5 text-emerald-400">✓</span>
                                <span>{s}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                        <div className={cn('border border-red-400/30 bg-gradient-to-br from-red-400/10 to-transparent p-4', CLIP_SM)}>
                          <p className="mb-2 flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-widest text-red-300">
                            <span className="text-lg">🩸</span> نقاط ضعف تو
                          </p>
                          <div className="space-y-1.5">
                            {(rep.myWeaknesses || []).map((s, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.5 + i * 0.1 }}
                                className="flex items-start gap-2 text-[10px] leading-5 text-slate-300"
                              >
                                <span className="mt-0.5 text-red-400">✗</span>
                                <span>{s}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* روایت کامل */}
                    {mine && aA && aD && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                        className="mb-6 space-y-3"
                      >
                        <div className={cn('border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4', CLIP_SM)}>
                          <p className="mb-2 flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="text-lg">📜</span> روایت کامل عملکرد تو
                          </p>
                          <p className="text-[11px] leading-6 text-slate-200">{mine === 'att' ? aA.summary : aD.summary}</p>
                        </div>
                        <div className={cn('border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4', CLIP_SM)}>
                          <p className="mb-2 flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="text-lg">👁</span> روایت کامل عملکرد حریف
                          </p>
                          <p className="text-[11px] leading-6 text-slate-200">{mine === 'att' ? aD.summary : aA.summary}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* درس‌های ستاد */}
                    {rep?.lessons?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.7 }}
                        className={cn('mb-6 border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-blue-400/5 p-5', CLIP_SM)}
                      >
                        <p className="mb-3 flex items-center gap-2 font-display text-[11px] font-black uppercase tracking-widest text-cyan-300">
                          <span className="text-2xl">🎓</span> درس‌های ستاد برای نبرد بعدی
                        </p>
                        <div className="space-y-2">
                          {rep.lessons.map((l, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.8 + i * 0.1 }}
                              className="flex items-start gap-3 border-b border-white/5 pb-2 last:border-0"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 font-display text-[10px] font-black text-cyan-300">
                                {toFa(i + 1)}
                              </span>
                              <p className="text-[10px] leading-5 text-slate-300">{l}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* قفل برای غیر شرکت‌کنندگان */}
                    {!mine && (
                      <div className={cn('mb-6 border border-white/10 bg-white/5 p-4 text-center', CLIP_SM)}>
                        <span className="text-2xl">🔒</span>
                        <p className="mt-2 text-[10px] text-slate-500">تحلیل کامل فقط در اختیار دو کشور نبرد است.</p>
                      </div>
                    )}

                    {/* دکمه بستن */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAnalysis(null)}
                      className={cn(
                        'w-full border-2 border-white/20 bg-gradient-to-r from-white/5 to-white/10 py-3 font-display text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 transition-all hover:border-cyan-400/50 hover:from-cyan-400/10 hover:to-cyan-400/5 hover:text-cyan-300',
                        CLIP_SM
                      )}
                    >
                      بستن گزارش
                    </motion.button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}