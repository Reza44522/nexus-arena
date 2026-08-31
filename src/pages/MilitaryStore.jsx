import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Flame, Shield, Lock, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RESOURCES, toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const HAZARD = { background: 'repeating-linear-gradient(45deg, rgba(251,191,36,.12) 0 10px, transparent 10px 20px)' };

/* ✅ فال‌بک محلی — اگر جدول خالی بود، صفحه هرگز خالی نماند */
const FALLBACK = [
  { key: 'f14', category: 'جنگنده‌ها', name: 'جنگنده F-14 تامکت', icon: '✈️', power: 40, cost_wd: 300, costs: { iron: 50, copper: 30, oil: 20 }, descr: 'گشت برتری هوایی کلاسیک' },
  { key: 'su35', category: 'جنگنده‌ها', name: 'جنگنده Su-35', icon: '✈️', power: 45, cost_wd: 350, costs: { iron: 60, copper: 30, oil: 20 }, descr: 'مانورپذیری فوق‌العاده' },
  { key: 'f35', category: 'جنگنده‌ها', name: 'جنگنده پنهان‌کار F-35', icon: '🛩️', power: 60, cost_wd: 500, costs: { iron: 70, copper: 50, silver: 20, gold: 10 }, descr: 'رادارگریز نسل پنجم' },
  { key: 'b2', category: 'بمب‌افکن‌ها', name: 'بمب‌افکن پنهان‌کار B-2', icon: '🛸', power: 80, cost_wd: 700, costs: { iron: 80, copper: 60, silver: 30, gold: 20 }, descr: 'ضربه عمیق بدون هشدار' },
  { key: 'tu160', category: 'بمب‌افکن‌ها', name: 'بمب‌افکن Tu-160', icon: '🛩️', power: 70, cost_wd: 600, costs: { iron: 90, copper: 50, oil: 40 }, descr: 'قوی‌ترین بال متحرک جهان' },
  { key: 'b52', category: 'بمب‌افکن‌ها', name: 'بمب‌افکن راهبردی B-52', icon: '🛩️', power: 55, cost_wd: 450, costs: { iron: 80, copper: 40, oil: 30 }, descr: 'فرش بمب استراتژیک' },
  { key: 'abrams', category: 'تانک‌ها', name: 'تانک M1A2 آبرامز', icon: '🛡️', power: 25, cost_wd: 180, costs: { iron: 40, copper: 20, oil: 15 }, descr: 'زره واکنشی پیشرفته' },
  { key: 't90', category: 'تانک‌ها', name: 'تانک T-90', icon: '🛡️', power: 22, cost_wd: 150, costs: { iron: 40, copper: 15, oil: 10 }, descr: 'سپر فعال اشتورا' },
  { key: 'leo2', category: 'تانک‌ها', name: 'تانک لئوپارد ۲', icon: '🛡️', power: 27, cost_wd: 200, costs: { iron: 45, copper: 25, oil: 15 }, descr: 'دقت شکارچی شب' },
  { key: 'burke', category: 'ناو و هواپیمابر', name: 'ناوشکن آرلی برک', icon: '🚢', power: 50, cost_wd: 450, costs: { iron: 80, copper: 40, oil: 30 }, descr: 'سامانه ایجیس چندمنظوره' },
  { key: 'nimitz', category: 'ناو و هواپیمابر', name: 'هواپیمابر کلاس نیمیتز', icon: '⚓', power: 90, cost_wd: 900, costs: { iron: 150, copper: 80, silver: 40, gold: 20, oil: 60 }, descr: 'پایگاه هوایی شناور' },
  { key: 'ford', category: 'ناو و هواپیمابر', name: 'هواپیمابر جرالد فورد', icon: '⚓', power: 100, cost_wd: 1100, costs: { iron: 170, copper: 90, silver: 50, gold: 30, oil: 70 }, descr: 'پیشرفته‌ترین ناو جهان' },
  { key: 'ohio', category: 'زیردریایی‌ها', name: 'زیردریایی اتمی اوهایو', icon: '☢️', power: 85, cost_wd: 800, costs: { iron: 120, copper: 60, uranium: 20, oil: 40 }, descr: 'بازدارندگی هسته‌ای' },
  { key: 'yasen', category: 'زیردریایی‌ها', name: 'زیردریایی اتمی یاسن', icon: '☢️', power: 88, cost_wd: 850, costs: { iron: 130, copper: 60, uranium: 25, oil: 40 }, descr: 'شکارچی خاموش اقیانوس' },
  { key: 'kilo', category: 'زیردریایی‌ها', name: 'زیردریایی دیزلی کیلو', icon: '🌊', power: 45, cost_wd: 350, costs: { iron: 70, copper: 30, oil: 30 }, descr: 'سیاه‌چاله دریایی' },
  { key: 'fateh', category: 'زیردریایی‌ها', name: 'زیردریایی دیزلی فاتح', icon: '🌊', power: 48, cost_wd: 380, costs: { iron: 75, copper: 35, oil: 30 }, descr: 'بومی سبک و چابک' },
  { key: 's400', category: 'سلاح و تجهیزات', name: 'پدافند هوایی S-400', icon: '📡', power: 55, cost_wd: 500, costs: { iron: 60, copper: 50, silver: 20 }, descr: 'چتر ضد هوایی برد بلند' },
  { key: 'cruise', category: 'سلاح و تجهیزات', name: 'موشک کروز', icon: '🚀', power: 35, cost_wd: 250, costs: { iron: 30, copper: 20, gold: 5 }, descr: 'ضربه دقیق نقطه‌ای' },
  { key: 'drone', category: 'سلاح و تجهیزات', name: 'پهپاد شاهد ۱۳۶', icon: '🛸', power: 20, cost_wd: 120, costs: { iron: 20, copper: 15, oil: 5 }, descr: 'ازدحام ارزان و مرگبار' },
  { key: 'ew', category: 'سلاح و تجهیزات', name: 'سامانه جنگ الکترونیک', icon: '📶', power: 40, cost_wd: 320, costs: { copper: 50, silver: 25, gold: 10 }, descr: 'کوری راداری دشمن' },
  { key: 'radar', category: 'سلاح و تجهیزات', name: 'رادار هشدار زودهنگام', icon: '📡', power: 30, cost_wd: 220, costs: { copper: 40, silver: 15 }, descr: 'چشم بیدار آسمان' },
];

/* ─────────── MilitaryStore — فروشگاه نظامی (Arsenal) ─────────── */
export default function MilitaryStore() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [inv, setInv] = useState({});
  const [wd, setWd] = useState(0);
  const [country, setCountry] = useState(null);
  const [cat, setCat] = useState('همه');
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  const load = async () => {
    if (!user?.id) return;
    const [catRes, prRes, pcRes] = await Promise.all([
      supabase.from('military_catalog').select('*'),
      supabase.from('profiles').select('war_dollars').eq('id', user.id).single(),
      supabase.from('player_countries').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
        if (catRes.error) console.error('❌ catalog:', catRes.error.message);
    setCatalog((catRes.data && catRes.data.length) ? catRes.data : FALLBACK);
    setWd(prRes?.data?.war_dollars ?? 0);
    const c = pcRes?.data || null;
    setCountry(c);
    if (c) {
      const { data: invRes } = await supabase.from('military_inventory').select('*').eq('country_id', c.id);
      const map = {};
      (invRes || []).forEach((r) => { map[r.item_key] = { qty: r.qty, power: r.power, name: r.name }; });
      setInv(map);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('arsenal-' + user?.id + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'military_inventory' }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'player_countries' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  const buy = async (item) => {
    setBusy(item.key);
    const { data, error } = await supabase.rpc('buy_military', { p_item_key: item.key, p_qty: 1 });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`✅ ${item.name} به زرادخانه اضافه شد!`);
    load();
  };

  const cats = ['همه', ...Array.from(new Set(catalog.map((c) => c.category)))];
  const items = cat === 'همه' ? catalog : catalog.filter((c) => c.category === cat);
  const totalPower = Object.values(inv).reduce((s, r) => s + Number(r.power) * r.qty, 0);
  const totalUnits = Object.values(inv).reduce((s, r) => s + r.qty, 0);

  const canAfford = (item) =>
    wd >= item.cost_wd &&
    Object.entries(item.costs || {}).every(([k, v]) => (Number(country?.resources?.[k]) || 0) >= Number(v));

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(251,191,36,.4); transform: none; }
          92% { text-shadow: -2px 0 #ef4444, 2px 0 #fbbf24; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #ef4444, -2px 0 #fbbf24; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(251,191,36,.4); transform: none; }
        }
      `}</style>

      {/* صحنه */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[42vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'linear-gradient(rgba(251,191,36,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,.5) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-amber-600/10 blur-[130px]" />
      </div>

      {/* Toast */}
      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-amber-400/40 bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(251,191,36,0.3)]', CLIP_SM)}>
            {notice}
          </motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl">
        {/* نوار CLASSIFIED */}
        <div className="mb-6 flex items-center justify-between border-y border-amber-400/30 py-2" style={HAZARD}>
          <p className="flex items-center gap-2 px-3 font-display text-[9px] font-black uppercase tracking-[0.35em] text-amber-300">
            <Lock size={11} /> Armory // Classified Procurement
          </p>
          <p className="px-3 font-display text-[9px] uppercase tracking-[0.3em] text-red-400">⚠ خرید = WD + منابع</p>
        </div>

        {/* هدر */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
              فروشگاه <span className="text-gradient">نظامی</span>
            </h1>
            <p className="mt-3 text-sm text-slate-500">جنگنده، تانک، ناو، هواپیمابر، زیردریایی اتمی و دیزلی، بمب‌افکن و تسلیحات — قدرت بخر!</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={cn('flex items-center gap-2 border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 font-bold text-emerald-300', CLIP_SM)}>
              <Banknote size={14} /> {fmtNum(wd)} WD
            </span>
            <span className={cn('flex items-center gap-2 border border-red-400/40 bg-red-400/10 px-4 py-2.5 font-bold text-red-300', CLIP_SM)}>
              <Flame size={14} /> قدرت نظامی: {fmtNum(totalPower)}
            </span>
            <span className={cn('flex items-center gap-2 border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 font-bold text-amber-300', CLIP_SM)}>
              <Package size={14} /> {toFa(totalUnits)} تجهیز
            </span>
          </div>
        </div>

        {/* تب دسته‌ها */}
        <div className="mb-6 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn('border px-4 py-2 font-display text-[10px] font-black uppercase tracking-widest transition-all', CLIP_SM, cat === c ? 'border-amber-400/60 bg-amber-400/15 text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.25)]' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white')}
            >
              {c}
            </button>
          ))}
        </div>

        {/* کارت‌ها */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => {
            const ok = canAfford(item);
            const owned = inv[item.key]?.qty || 0;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 8) * 0.04 }}
                whileHover={{ y: -4 }}
                className={cn('relative border bg-[#0a0c08]/85 p-4 backdrop-blur-xl transition-colors', CLIP, owned > 0 ? 'border-emerald-400/40' : ok ? 'border-amber-400/25 hover:border-amber-400/50' : 'border-white/10 opacity-90')}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-amber-400/40" />
                {owned > 0 && (
                  <span className={cn('absolute left-3 top-3 border border-emerald-400/50 bg-emerald-400/15 px-2 py-0.5 text-[9px] font-black text-emerald-300', CLIP_SM)}>
                    ×{toFa(owned)}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={cn('grid h-14 w-14 place-items-center bg-gradient-to-br from-amber-400/20 to-red-500/20 text-3xl', CLIP_SM)}>{item.icon}</div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-white">{item.name}</p>
                    <p className="text-[9px] text-slate-500">{item.category}</p>
                  </div>
                </div>
                {item.descr && <p className="mt-2 text-[10px] leading-5 text-slate-400">{item.descr}</p>}

                <p className={cn('mt-2 flex items-center gap-1.5 border border-red-400/25 bg-red-400/5 px-2 py-1 text-[10px] font-black text-red-300', CLIP_SM)}>
                  <Flame size={10} /> قدرت: +{toFa(item.power)}
                </p>

                {/* هزینه‌ها */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px]">
                  <span className={cn('border px-2 py-1 font-black', CLIP_SM, wd >= item.cost_wd ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-red-400/40 bg-red-400/10 text-red-400')}>
                    {fmtNum(item.cost_wd)} WD
                  </span>
                  {Object.entries(item.costs || {}).map(([k, v]) => {
                    const enough = (Number(country?.resources?.[k]) || 0) >= Number(v);
                    return (
                      <span key={k} className={cn('flex items-center gap-1 border px-1.5 py-1', CLIP_SM, enough ? 'border-white/10 bg-white/5 text-slate-300' : 'border-red-400/40 bg-red-400/10 text-red-400')} title={RESOURCES[k]?.label}>
                        {RESOURCES[k]?.icon} {toFa(v)}
                      </span>
                    );
                  })}
                </div>

                <button
                  onClick={() => buy(item)}
                  disabled={!ok || busy === item.key}
                  className={cn('mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 font-display text-[10px] font-black uppercase tracking-[0.2em] transition-all', CLIP_SM, ok ? 'bg-gradient-to-r from-amber-400 to-red-500 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]' : 'border border-white/10 bg-white/5 text-slate-600')}
                >
                  {busy === item.key ? '⏳ ...' : ok ? '🎖 خرید تجهیز' : '🔒 منابع/بودجه ناکافی'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* زرادخانه من */}
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-amber-300">
            <Shield size={16} /> زرادخانه من ({toFa(totalUnits)} واحد)
          </h2>
          {totalUnits === 0 ? (
            <div className={cn('border border-white/10 bg-[#070b18]/80 p-10 text-center text-slate-500', CLIP)}>
              هنوز تجهیزی نخریده‌ای — اولین خرید نظامی‌ات را انجام بده! 🎖
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(inv).map(([key, r]) => {
                const c = catalog.find((x) => x.key === key);
                return (
                  <div key={key} className={cn('flex items-center gap-3 border border-emerald-400/25 bg-emerald-400/5 p-3', CLIP_SM)}>
                    <span className="text-2xl">{c?.icon || '🎖'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{r.name}</p>
                      <p className="text-[9px] text-slate-500">×{toFa(r.qty)} • قدرت: {fmtNum(Number(r.power) * r.qty)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}