import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Radio, Clock, X, BarChart3, ListOrdered, History, Snowflake, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* اسپارک‌لاین کوچک برای جدول نمادها */
function Spark({ points, up }) {
  if (!points || points.length < 2) return <svg width="72" height="26" />;
  const min = Math.min(...points); const max = Math.max(...points);
  const span = max - min || 1;
  const W = 72, H = 26;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${((i / (points.length - 1)) * W).toFixed(1)} ${(H - ((p - min) / span) * (H - 6) - 3).toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} className="overflow-visible">
      <path d={d} fill="none" stroke={up ? '#34d399' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${up ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)'})` }} />
    </svg>
  );
}

/* کندل‌استیک حرفه‌ای v3 — گرید + سطح گرادیانی + واترمارک + نقطه زنده */
function Candles({ data, height = 260, lastPrice, symbol }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  if (!data.length) return <div className="grid h-64 place-items-center text-xs text-slate-600">در حال دریافت داده...</div>;
  const min = Math.min(...data.map((d) => d.l));
  const max = Math.max(...data.map((d) => d.h));
  const span = max - min || max * 0.02 || 1;
  const pad = span * 0.12;
  const lo = min - pad, hi = max + pad;
  const W = 680, H = height;
  const n = data.length;
  const slot = W / n;
  const bw = Math.max(2, Math.min(14, slot * 0.62));
  const y = (v) => H - ((v - lo) / (hi - lo)) * (H - 34) - 8;
  const gridH = [0, 0.25, 0.5, 0.75, 1].map((p) => lo + (hi - lo) * p);
  const maxBody = Math.max(...data.map((d) => Math.abs(d.c - d.o)), 0.001);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.min(n - 1, Math.max(0, Math.floor(x / slot))));
  };
  const hd = hover != null ? data[hover] : null;
  const closePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i * slot + slot / 2).toFixed(1)} ${y(d.c).toFixed(1)}`).join(' ');
  return (
    <div ref={ref} className="relative cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      {/* واترمارک */}
      <p className="pointer-events-none absolute inset-0 grid place-items-center font-display text-5xl font-black uppercase tracking-widest text-white/5">{symbol}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        {/* گرید افقی + عمودی */}
        {gridH.map((g, i) => (
          <g key={'h' + i}>
            <line x1="0" x2={W} y1={y(g)} y2={y(g)} stroke="rgba(148,163,184,0.1)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={W - 4} y={y(g) - 3} textAnchor="end" fontSize="9" fill="rgba(148,163,184,0.55)">{Number(g).toFixed(2)}</text>
          </g>
        ))}
        {Array.from({ length: 7 }, (_, i) => (<line key={'v' + i} x1={(i + 1) * (W / 8)} x2={(i + 1) * (W / 8)} y1="0" y2={H} stroke="rgba(148,163,184,0.06)" strokeWidth="1" />))}
        {/* سطح گرادیانی زیر قیمت */}
        <path d={`${closePath} L ${W} ${H} L 0 ${H} Z`} fill="url(#areaG)" />
        <path d={closePath} fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="1" />
        {/* حجم */}
        {data.map((d, i) => {
          const x = i * slot + (slot - bw) / 2;
          const vh = Math.max(2, (Math.abs(d.c - d.o) / maxBody) * 26);
          return <rect key={'v' + i} x={x} y={H - vh} width={bw} height={vh} fill={d.c >= d.o ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'} />;
        })}
        {/* کندل‌ها */}
        {data.map((d, i) => {
          const x = i * slot + (slot - bw) / 2;
          const up = d.c >= d.o;
          const col = up ? '#34d399' : '#f87171';
          return (
            <g key={i}>
              <line x1={x + bw / 2} x2={x + bw / 2} y1={y(d.h)} y2={y(d.l)} stroke={col} strokeWidth="1" />
              <rect x={x} y={Math.min(y(d.o), y(d.c))} width={bw} height={Math.max(1.5, Math.abs(y(d.o) - y(d.c)))} fill={col} opacity="0.95" style={{ filter: `drop-shadow(0 0 3px ${up ? 'rgba(52,211,153,0.55)' : 'rgba(248,113,113,0.55)'})` }} />
            </g>
          );
        })}
        {/* خط قیمت زنده + نقطه تپنده */}
        {lastPrice != null && lastPrice >= lo && lastPrice <= hi && (
          <g>
            <line x1="0" x2={W} y1={y(lastPrice)} y2={y(lastPrice)} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.85" />
            <circle cx={W - slot / 2} cy={y(lastPrice)} r="3" fill="#fbbf24">
              <animate attributeName="r" values="2;5;2" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <rect x={W - 58} y={y(lastPrice) - 9} width="58" height="18" rx="3" fill="#fbbf24" />
            <text x={W - 29} y={y(lastPrice) + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0a0c08">{Number(lastPrice).toFixed(2)}</text>
          </g>
        )}
        {/* کراس‌هیر */}
        {hover != null && (
          <g>
            <line x1={hover * slot + slot / 2} x2={hover * slot + slot / 2} y1="0" y2={H} stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" x2={W} y1={y(data[hover].c)} y2={y(data[hover].c)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />
          </g>
        )}
      </svg>
      {hd && (
        <div className="pointer-events-none absolute top-1 z-10 rounded border border-white/10 bg-black/90 px-2.5 py-1.5 text-[9px] text-slate-300 shadow-lg" style={hover < n / 2 ? { right: 8 } : { left: 8 }}>
          باز <b className="text-white">{Number(hd.o).toFixed(2)}</b> • بسته <b className={hd.c >= hd.o ? 'text-emerald-300' : 'text-red-300'}>{Number(hd.c).toFixed(2)}</b> • زیاد <b className="text-emerald-300">{Number(hd.h).toFixed(2)}</b> • کم <b className="text-red-300">{Number(hd.l).toFixed(2)}</b>
        </div>
      )}
    </div>
  );
}

/* ─────────── Market v3 — ترمینال بورسی آرنا ─────────── */
export default function Market() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sparks, setSparks] = useState({});
  const [sel, setSel] = useState('oil');
  const [hist, setHist] = useState([]);
  const [tf, setTf] = useState('1h');
  const [side, setSide] = useState('buy');
  const [qty, setQty] = useState(10);
  const [otype, setOtype] = useState('market');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [tape, setTape] = useState([]);
  const [myTrades, setMyTrades] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [res, setRes] = useState({});
  const [wd, setWd] = useState(0);
  const [sub, setSub] = useState('tape');
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  const loadCore = async () => {
    await supabase.rpc('market_tick');
    const [aR, sR, hR] = await Promise.all([
      supabase.from('market_assets').select('*').order('id'),
      supabase.from('market_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('market_history').select('asset_id, price, created_at').gte('created_at', new Date(Date.now() - 2 * 3600000).toISOString()).order('created_at').limit(1500),
    ]);
    setAssets(aR.data || []);
    setSettings(sR.data || null);
    const sp = {};
    (hR.data || []).forEach((h) => { (sp[h.asset_id] = sp[h.asset_id] || []).push(Number(h.price)); });
    Object.keys(sp).forEach((k) => { const arr = sp[k]; sp[k] = arr.filter((_, i) => i % Math.max(1, Math.floor(arr.length / 24)) === 0); });
    setSparks(sp);
  };
  const loadHist = async () => {
    const since = tf === '1h' ? new Date(Date.now() - 3600000).toISOString() : tf === '24h' ? new Date(Date.now() - 86400000).toISOString() : new Date(Date.now() - 7 * 86400000).toISOString();
    const { data } = await supabase.from('market_history').select('price, created_at').eq('asset_id', sel).gte('created_at', since).order('created_at').limit(500);
    setHist(data || []);
  };
  const loadMe = async () => {
    if (!user?.id) return;
    const [cR, pR, tR, oR] = await Promise.all([
      supabase.from('player_countries').select('resources').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('war_dollars').eq('id', user.id).single(),
      supabase.from('market_trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('market_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]);
    setRes(cR.data?.resources || {});
    setWd(pR.data?.war_dollars ?? 0);
    setMyTrades(tR.data || []);
    setMyOrders(oR.data || []);
  };
  const loadTape = async () => {
    const { data } = await supabase.from('market_trades').select('*').order('created_at', { ascending: false }).limit(40);
    setTape(data || []);
  };

  useEffect(() => {
    loadCore(); loadMe(); loadTape();
    const t1 = setInterval(() => { loadCore(); loadHist(); }, 5000);
    const t2 = setInterval(() => { loadMe(); loadTape(); }, 8000);
    const ch = supabase.channel('mkt-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'market_trades' }, () => loadTape())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'market_assets' }, () => loadCore())
      .subscribe();
    return () => { clearInterval(t1); clearInterval(t2); supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, []);
  useEffect(() => { loadHist(); /* eslint-disable-next-line */ }, [sel, tf]);

  const candles = useMemo(() => {
    const bucket = tf === '1h' ? 60000 : tf === '24h' ? 30 * 60000 : 3 * 3600000;
    const map = new Map();
    hist.forEach((h) => {
      const k = Math.floor(new Date(h.created_at).getTime() / bucket);
      const p = Number(h.price);
      const c = map.get(k) || { o: p, h: p, l: p, c: p };
      c.h = Math.max(c.h, p); c.l = Math.min(c.l, p); c.c = p;
      map.set(k, c);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([, v]) => v).slice(-80);
  }, [hist, tf]);

  const A = assets.find((x) => x.id === sel);
  const tax = settings?.tax_pct ?? 1;
  const total = A ? A.price * qty * (side === 'buy' ? 1 + tax / 100 : 1 - tax / 100) : 0;
  const vol24 = tape.reduce((s, t) => s + Number(t.total), 0);

  const doTrade = async () => {
    setBusy(true);
    let r;
    if (otype === 'limit') r = await supabase.rpc('market_place_order', { p_asset: sel, p_side: side, p_qty: Number(qty) || 0, p_target: Number(target) || 0 });
    else r = await supabase.rpc(side === 'buy' ? 'market_buy' : 'market_sell', { p_asset: sel, p_qty: Number(qty) || 0 });
    setBusy(false);
    if (r.error) return flash('❌ ' + r.error.message);
    if (r.data && r.data.ok === false) return flash('❌ ' + r.data.error);
    flash(otype === 'limit' ? '✅ سفارش لیمیت ثبت شد — با رسیدن قیمت اجرا می‌شود' : side === 'buy' ? '✅ خرید انجام شد!' : '✅ فروش انجام شد!');
    loadMe(); loadTape();
  };
  const cancelOrder = async (id) => {
    await supabase.rpc('market_cancel_order', { p_order: id });
    flash('✅ سفارش لغو شد');
    loadMe();
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes mktScan { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes tapeMove { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes flashUp { 0% { color: #34d399; text-shadow: 0 0 14px rgba(52,211,153,.9); } 100% { color: #fff; } }
        @keyframes flashDown { 0% { color: #f87171; text-shadow: 0 0 14px rgba(248,113,113,.9); } 100% { color: #fff; } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(52,211,153,.5); transform: none; } 92% { text-shadow: -3px 0 #34d399, 3px 0 #f87171; transform: translateX(2px); } 94% { text-shadow: 3px 0 #34d399, -3px 0 #f87171; transform: translateX(-2px); } 96% { text-shadow: 0 0 26px rgba(52,211,153,.5); transform: none; } }
      `}</style>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[360px] w-[520px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute top-10 right-1/4 h-[300px] w-[440px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'64\' viewBox=\'0 0 56 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 0L56 16v32L28 64 0 48V16z\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '56px 64px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.6) 100%)' }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" style={{ animation: 'mktScan 7s linear infinite' }} />
      </div>

      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-emerald-400/40 bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(52,211,153,0.3)]', CLIP_SM)}>{notice}</motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl">
        {/* هدر */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 font-mono text-[10px] tracking-[0.4em] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'blinkDot 1.6s infinite' }} /> NEXUS EXCHANGE // LIVE
            </p>
            <h1 className="font-display text-3xl font-black text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
              بازار <span className="text-gradient">آزاد</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className={cn('flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 font-bold text-emerald-300', CLIP_SM)}><Wallet size={11} /> {fmtNum(wd)} WD</span>
            <span className={cn('flex items-center gap-1.5 border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 font-bold text-cyan-300', CLIP_SM)}><BarChart3 size={11} /> حجم ۲۴س: {fmtNum(Math.round(vol24))}</span>
            <span className={cn('flex items-center gap-1.5 border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-slate-300', CLIP_SM)}><Clock size={11} /> کارمزد: {toFa(tax)}٪</span>
            {settings?.frozen && <span className={cn('flex items-center gap-1.5 border border-cyan-300/40 bg-cyan-300/10 px-2.5 py-1 font-bold text-cyan-200', CLIP_SM)}><Snowflake size={11} /> بازار متوقف</span>}
          </div>
        </div>

        {/* 🎞 نوار تیکر متحرک */}
        <div dir="ltr" className={cn('relative mb-6 overflow-hidden border-y border-emerald-400/20 bg-black/70 py-2', CLIP_SM)}>
          <div className="flex w-max gap-10" style={{ animation: 'tapeMove 35s linear infinite' }}>
            {[...assets, ...assets].map((a, i) => (
              <span key={i} className="flex items-center gap-2 font-mono text-[10px]">
                <span className="text-sm">{a.icon}</span>
                <span className="uppercase text-slate-500">{a.id}</span>
                <span key={a.price} className="font-bold text-white" style={{ animation: a.change_24h >= 0 ? 'flashUp 1s ease' : 'flashDown 1s ease' }}>{fmtNum(a.price)}</span>
                <span className={a.change_24h >= 0 ? 'text-emerald-300' : 'text-red-400'}>{a.change_24h >= 0 ? '▲' : '▼'} {Math.abs(Number(a.change_24h)).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* ─────────── جدول نمادها (گرافیکی) ─────────── */}
          <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-3 lg:col-span-1', CLIP)}>
            <p className="mb-2 flex items-center gap-2 px-1 font-display text-[10px] uppercase tracking-[0.3em] text-emerald-300"><Zap size={12} /> نمادهای زنده</p>
            {assets.map((a, i) => (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: -3 }}
                onClick={() => setSel(a.id)}
                className={cn('mb-1.5 grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-2 border p-2.5 text-right transition', CLIP_SM, sel === a.id ? 'border-emerald-400/60 bg-gradient-to-l from-emerald-400/15 to-transparent shadow-[inset_0_0_20px_rgba(52,211,153,0.08)]' : 'border-white/5 bg-white/5 hover:bg-white/10')}
              >
                <span className={cn('grid h-9 w-9 place-items-center rounded-lg border text-lg', a.change_24h >= 0 ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-red-400/30 bg-red-400/10')}>{a.icon}</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-white">{a.name_fa}</span>
                  <span className="block font-mono text-[8px] uppercase text-slate-500">{a.id}/WD</span>
                </span>
                <Spark points={sparks[a.id]} up={a.change_24h >= 0} />
                <span className="text-left">
                  <span key={a.price} className="block font-display text-xs font-black tabular-nums text-white" style={{ animation: a.change_24h >= 0 ? 'flashUp 1s ease' : 'flashDown 1s ease' }}>{fmtNum(a.price)}</span>
                  <span className={cn('flex items-center justify-end gap-0.5 text-[9px] font-bold', a.change_24h >= 0 ? 'text-emerald-300' : 'text-red-400')}>
                    {a.change_24h >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />} {toFa(Math.abs(Math.round(a.change_24h * 10) / 10))}٪
                  </span>
                </span>
              </motion.button>
            ))}
          </div>

          {/* ─────────── نمودار ─────────── */}
          <div className="space-y-6 lg:col-span-2">
            <div className={cn('relative border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-emerald-400/50" />
              <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-emerald-400/50" />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-display text-sm font-black text-white">{A?.icon} {A?.name_fa} <span className="font-mono text-[9px] uppercase text-slate-500">{sel}/WD</span></p>
                <div className="flex gap-1">
                  {[['1h', '۱ ساعت'], ['24h', '۲۴ ساعت'], ['7d', '۷ روز']].map(([k, l]) => (
                    <button key={k} onClick={() => setTf(k)} className={cn('border px-2.5 py-1 text-[9px] font-black transition', CLIP_SM, tf === k ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-500 hover:text-white')}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <p key={A?.price} className={cn('font-display text-4xl font-black tabular-nums', A?.change_24h >= 0 ? 'text-emerald-300' : 'text-red-400')} style={{ animation: A?.change_24h >= 0 ? 'flashUp 1s ease' : 'flashDown 1s ease' }}>
                  {fmtNum(A?.price || 0)} <span className="text-xs">WD</span>
                </p>
                <div className="flex flex-wrap gap-2 text-[9px]">
                  <span className={cn('border border-emerald-400/30 bg-emerald-400/5 px-2 py-1 text-emerald-300', CLIP_SM)}>▲ بیشترین: {fmtNum(candles.length ? Math.max(...candles.map((c) => c.h)) : 0)}</span>
                  <span className={cn('border border-red-400/30 bg-red-400/5 px-2 py-1 text-red-300', CLIP_SM)}>▼ کمترین: {fmtNum(candles.length ? Math.min(...candles.map((c) => c.l)) : 0)}</span>
                </div>
              </div>
              <Candles data={candles} lastPrice={A?.price} symbol={sel} />
            </div>

            {/* ─────────── پنل سفارش ─────────── */}
            <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button onClick={() => setSide('buy')} className={cn('py-3 font-display text-xs font-black uppercase tracking-widest transition', CLIP_SM, side === 'buy' ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.45)]' : 'border border-white/10 bg-white/5 text-slate-500')}>خرید 📈</button>
                <button onClick={() => setSide('sell')} className={cn('py-3 font-display text-xs font-black uppercase tracking-widest transition', CLIP_SM, side === 'sell' ? 'bg-gradient-to-r from-red-500 to-rose-400 text-slate-950 shadow-[0_0_24px_rgba(239,68,68,0.45)]' : 'border border-white/10 bg-white/5 text-slate-500')}>فروش 📉</button>
              </div>
              <div className="mb-3 flex gap-1">
                <button onClick={() => setOtype('market')} className={cn('border px-3 py-1.5 text-[9px] font-black', CLIP_SM, otype === 'market' ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-500')}>سفارش بازار</button>
                <button onClick={() => setOtype('limit')} className={cn('border px-3 py-1.5 text-[9px] font-black', CLIP_SM, otype === 'limit' ? 'border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-300' : 'border-white/10 bg-white/5 text-slate-500')}>لیمیت (Pending)</button>
              </div>
              {otype === 'limit' && (
                <label className="mb-3 block">
                  <span className="mb-1 block text-[9px] font-bold text-fuchsia-300">قیمت هدف:</span>
                  <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={String(A?.price || '')} className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-400/50" />
                </label>
              )}
              <label className="mb-1 block text-[9px] font-bold text-slate-400">مقدار: {toFa(qty)}</label>
              <input type="range" min="1" max={Math.max(1, side === 'buy' ? Math.floor(wd / Math.max(1, A?.price || 1)) : Math.floor(res[sel] || 0))} value={qty} onChange={(e) => setQty(Number(e.target.value))} className={cn('w-full', side === 'buy' ? 'accent-emerald-400' : 'accent-red-400')} />
              <div className="mt-2 flex gap-1">
                {[25, 50, 100].map((p) => (
                  <button key={p} onClick={() => setQty(Math.max(1, Math.floor((side === 'buy' ? wd / Math.max(1, A?.price || 1) : res[sel] || 0) * p / 100)))} className={cn('flex-1 border border-white/10 bg-white/5 py-1 text-[8px] font-bold text-slate-400 hover:bg-white/10', CLIP_SM)}>{toFa(p)}٪</button>
                ))}
              </div>
              <div className="mt-3 space-y-1 rounded-md border border-white/5 bg-white/5 p-2.5 text-[9px] text-slate-400">
                <p className="flex justify-between"><span>موجودی {side === 'buy' ? 'WD' : A?.name_fa}:</span><b className="text-white">{side === 'buy' ? fmtNum(wd) : fmtNum(res[sel] || 0)}</b></p>
                <p className="flex justify-between"><span>کارمزد:</span><b className="text-white">{toFa(tax)}٪</b></p>
                <p className="flex justify-between"><span>مجموع:</span><b className="text-emerald-300">{fmtNum(Math.round(total * 100) / 100)} WD</b></p>
              </div>
              <button onClick={doTrade} disabled={busy} className={cn('mt-3 w-full py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 disabled:opacity-50', CLIP_SM, side === 'buy' ? 'bg-gradient-to-r from-emerald-400 to-cyan-500' : 'bg-gradient-to-r from-red-500 to-rose-400')}>
                {busy ? '⏳ ...' : side === 'buy' ? '🛒 خرید ' + (A?.name_fa || '') : '💰 فروش ' + (A?.name_fa || '')}
              </button>
            </div>
          </div>

          {/* ─────────── پورتفوی + معاملات ─────────── */}
          <div className="space-y-6 lg:col-span-1">
            <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-4', CLIP)}>
              <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300"><Wallet size={12} /> پورتفوی من</p>
              {assets.map((a) => (
                <p key={a.id} className="mb-1.5 flex justify-between text-[10px] text-slate-400">
                  <span>{a.icon} {a.name_fa}: <b className="text-white">{fmtNum(res[a.id] || 0)}</b></span>
                  <span className="text-amber-300">={fmtNum(Math.round((res[a.id] || 0) * a.price))} WD</span>
                </p>
              ))}
            </div>
            <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-4', CLIP)}>
              <div className="mb-3 flex gap-1">
                <button onClick={() => setSub('tape')} className={cn('flex-1 border px-2 py-1.5 text-[9px] font-black', CLIP_SM, sub === 'tape' ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-500')}><Radio size={10} /> زنده</button>
                <button onClick={() => setSub('mine')} className={cn('flex-1 border px-2 py-1.5 text-[9px] font-black', CLIP_SM, sub === 'mine' ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300' : 'border-white/10 bg-white/5 text-slate-500')}><History size={10} /> من</button>
                <button onClick={() => setSub('orders')} className={cn('flex-1 border px-2 py-1.5 text-[9px] font-black', CLIP_SM, sub === 'orders' ? 'border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-300' : 'border-white/10 bg-white/5 text-slate-500')}><ListOrdered size={10} /> لیمیت</button>
              </div>
              <div className="chat-scroll max-h-80 space-y-1.5 overflow-y-auto">
                {sub === 'tape' && (tape.length === 0 ? <p className="text-[9px] text-slate-600">هنوز معامله‌ای نیست</p> : tape.map((t) => (
                  <motion.p key={t.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className={cn('flex justify-between border px-2 py-1.5 text-[9px]', CLIP_SM, t.side === 'buy' ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300' : 'border-red-400/20 bg-red-400/5 text-red-300')}>
                    <span>{t.side === 'buy' ? '📈' : '📉'} {t.asset_id} ×{fmtNum(t.qty)}</span>
                    <span>@{fmtNum(t.price)}</span>
                  </motion.p>
                )))}
                {sub === 'mine' && (myTrades.length === 0 ? <p className="text-[9px] text-slate-600">معامله‌ای نداشته‌ای</p> : myTrades.map((t) => (
                  <p key={t.id} className={cn('flex justify-between border px-2 py-1.5 text-[9px]', CLIP_SM, t.side === 'buy' ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300' : 'border-red-400/20 bg-red-400/5 text-red-300')}>
                    <span>{t.side === 'buy' ? 'خرید' : 'فروش'} {t.asset_id} ×{fmtNum(t.qty)}</span>
                    <span>{new Date(t.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                )))}
                {sub === 'orders' && (myOrders.length === 0 ? <p className="text-[9px] text-slate-600">سفارش بازی نداری</p> : myOrders.map((o) => (
                  <div key={o.id} className={cn('flex items-center justify-between border px-2 py-1.5 text-[9px]', CLIP_SM, o.status === 'open' ? 'border-fuchsia-400/30 bg-fuchsia-400/5 text-fuchsia-300' : 'border-white/10 bg-white/5 text-slate-500')}>
                    <span>{o.side === 'buy' ? 'خرید' : 'فروش'} {o.asset_id} ×{fmtNum(o.qty)} @{fmtNum(o.target_price)} [{o.status === 'open' ? 'باز' : o.status === 'filled' ? 'اجرا شد' : 'لغو'}]</span>
                    {o.status === 'open' && <button onClick={() => cancelOrder(o.id)} className="text-red-400"><X size={10} /></button>}
                  </div>
                )))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}