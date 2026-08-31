import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Printer, Flame, Eye, Snowflake, Trophy, Users, HeartHandshake, TrendingUp, Skull } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const JOKES = [
  'تحلیلگر ارشد نکسوس: «اگر سناریوی حمله‌ات را با ایموجی بنویسی، هوش مصنوعی آن را شعر تلقی می‌کند نه جنگ!»',
  'شایعه بازار: قیمت موشک به دلیل خرید هیجانی یک فرمانده ناشناس ۳٪ بالا رفت.',
  'گزارش ویژه: یک جاسوس هنگام اسکن کشور دشمن لو رفت چون اسمش را «جاسوس۱۲۳» گذاشته بود.',
  'مصاحبه با سرباز صفر: «منتظر دستور حمله‌ام؛ فرماندهم گفته اول سناریو را با غلط املایی ننویسم.»',
  'هشدار سردبیر: تحریم‌های پیاپی روی یک کشور، طبق قوانین ژنوِ آرنا، فقط ۲۴ ساعت مجاز است!',
];

/* ─────────── NexusTimes — روزنامه زنده آرنا ─────────── */
export default function NexusTimes() {
  const [matches, setMatches] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [spies, setSpies] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [tours, setTours] = useState([]);
  const [allWars, setAllWars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 24 * 3600000).toISOString();
      const [mR, sR, spR, uR, cR, tR, wR] = await Promise.all([
        supabase.from('war_matches').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(60),
        supabase.from('sanctions').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(30),
        supabase.from('spy_ops').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(30),
        supabase.from('profiles').select('username').gte('created_at', since).limit(30),
        supabase.from('player_countries').select('id, name_fa, flag').limit(200),
        supabase.from('war_tournaments').select('*').eq('status', 'open').limit(3),
        supabase.from('alliance_wars').select('*').eq('status', 'active').limit(5),
      ]);
      setMatches(mR.data || []);
      setSanctions(sR.data || []);
      setSpies(spR.data || []);
      setNewUsers(uR.data || []);
      setCountries(cR.data || []);
      setTours(tR.data || []);
      setAllWars(wR.data || []);
      setLoading(false);
    })();
  }, []);

  const nameOf = (id) => { const c = countries.find((x) => x.id === id); return c ? `${c.flag} ${c.name_fa}` : '—'; };
  const finished = matches.filter((m) => m.status === 'finished');
  const declared = matches.filter((m) => m.status !== 'finished');
  const headline = finished[0];
  const wdPaid = finished.length * 150;
  const topToday = (() => {
    const c = {};
    finished.forEach((m) => { if (m.winner_country) c[m.winner_country] = (c[m.winner_country] || 0) + 1; });
    const e = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return e ? { name: nameOf(e[0]), w: e[1] } : null;
  })();
  const edition = Math.floor(Date.now() / 86400000) % 1000;
  const today = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const joke = JOKES[new Date().getDate() % JOKES.length];
  const winnerSummary = headline ? ((headline.winner_country === headline.attacker_country ? headline.att_analysis : headline.def_analysis)?.summary || '') : '';

  if (loading) return <div className="grid min-h-screen place-items-center pt-24"><div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" /></div>;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-20 pt-24">
      <style>{`
        @keyframes ntFlicker { 0%,100% { opacity: 1; } 92% { opacity: .85; } 94% { opacity: 1; } 96% { opacity: .9; } }
        @keyframes ntTick { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/3 h-[360px] w-[520px] rounded-full bg-amber-500/10 blur-[130px]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,.6) 100%)' }} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* ─────────── سردر روزنامه ─────────── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border-2 border-amber-400/40 bg-[#0a0c08]/95 p-6', CLIP)} style={{ animation: 'ntFlicker 6s infinite' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-400/30 pb-4">
            <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">نسخه {toFa(edition)} • {today}</p>
            <p className="flex items-center gap-2 font-display text-lg font-black text-amber-300"><Newspaper size={18} /> NEXUS TIMES // نکسوس تایمز</p>
            <p className="text-[9px] text-slate-500">قیمت: ۱ WD • توزیع سراسری</p>
          </div>
          {/* نوار خبر فوری */}
          <div className="relative mt-3 overflow-hidden border-y border-red-400/30 bg-red-400/5 py-1.5">
            <p className="whitespace-nowrap font-display text-[10px] tracking-widest text-red-300" style={{ animation: 'ntTick 30s linear infinite' }}>
              🚨 فوری: {declared.length ? declared.slice(0, 4).map((m) => `اعلام جنگ ${nameOf(m.attacker_country)} ⚔ ${nameOf(m.defender_country)}`).join('  ◆  ') : 'جبهه‌ها آرام هستند — فعلاً!'}
            </p>
          </div>

          {/* ─────────── تیتر یک ─────────── */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-400"><Flame size={12} /> تیتر یک</p>
              <h1 className="font-display text-3xl font-black leading-snug text-white md:text-5xl">
                {headline ? `پیروزی ${nameOf(headline.winner_country)} بر ${nameOf(headline.winner_country === headline.attacker_country ? headline.defender_country : headline.attacker_country)}` : 'آرامش موقت در آرنا'}
              </h1>
              <p className="mt-4 text-sm leading-8 text-slate-300">
                {headline ? headline.public_result : 'در ۲۴ ساعت گذشته نبردی به پایان نرسیده است؛ اما دیپلمات‌ها می‌گویند طوفان در راه است. فرماندهان در اتاق‌های جنگ خود مشغول نگارش سناریوهای تازه‌اند...'}
              </p>
              {winnerSummary && <p className="mt-3 border-r-2 border-amber-400/50 pr-3 text-xs leading-6 text-slate-400">از تحلیل ژنرال AI: «{winnerSummary}»</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-[9px]">
                <span className={cn('border border-white/10 bg-white/5 px-2 py-1 text-slate-400', CLIP_SM)}>📡 خبرنگار جنگ: رادار مرکزی</span>
                <span className={cn('border border-white/10 bg-white/5 px-2 py-1 text-slate-400', CLIP_SM)}>⏱ {headline ? new Date(headline.finished_at || headline.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              </div>
            </div>
            {/* آمار روز */}
            <div className={cn('border border-amber-400/30 bg-amber-400/5 p-4', CLIP)}>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300"><TrendingUp size={12} /> آمار روز</p>
              {[{ l: 'نبرد پایان‌یافته', v: finished.length, i: '⚔️' }, { l: 'اعلام جنگ جدید', v: declared.length, i: '🚨' }, { l: 'عملیات جاسوسی', v: spies.length, i: '🕵️' }, { l: 'تحریم اعمال‌شده', v: sanctions.length, i: '🥶' }, { l: 'فرمانده تازه‌وارد', v: newUsers.length, i: '👥' }, { l: 'WD پرداختی جوایز', v: wdPaid, i: '💵' }].map((s, i) => (
                <motion.p key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="mb-2 flex items-center justify-between border-b border-white/5 pb-2 text-[11px] text-slate-300">
                  <span>{s.i} {s.l}</span>
                  <b className="font-display text-amber-300">{toFa(s.v)}</b>
                </motion.p>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─────────── ستون‌های خبری ─────────── */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* جاسوسی */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={cn('border border-purple-400/30 bg-[#0a0c08]/90 p-5', CLIP)}>
            <p className="mb-3 flex items-center gap-2 border-b border-purple-400/20 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-purple-300"><Eye size={12} /> صفحه اطلاعات</p>
            {spies.length === 0 ? <p className="text-xs text-slate-600">امروز هیچ جاسوسی لو نرفت — روزنامه فردا جذاب‌تر خواهد بود.</p> : spies.slice(0, 5).map((s, i) => (
              <p key={s.id} className="mb-2 text-[11px] leading-5 text-slate-300">🕵️ <b>{nameOf(s.spy_country)}</b> مخفیانه از <b>{nameOf(s.target_country)}</b> نقشه‌برداری کرد. منابع امنیتی می‌گویند پرونده کامل (ذخایر + تجهیزات) لو رفته است.</p>
            ))}
          </motion.div>
          {/* تحریم */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className={cn('border border-cyan-400/30 bg-[#0a0c08]/90 p-5', CLIP)}>
            <p className="mb-3 flex items-center gap-2 border-b border-cyan-400/20 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300"><Snowflake size={12} /> صفحه تحریم</p>
            {sanctions.length === 0 ? <p className="text-xs text-slate-600">بازارهای جهانی امروز بدون تحریم نفس کشیدند.</p> : sanctions.slice(0, 5).map((s) => (
              <p key={s.id} className="mb-2 text-[11px] leading-5 text-slate-300">🥶 اقتصاد <b>{nameOf(s.defender_country)}</b> با تحریم «{s.type}» هدف قرار گرفت. تحلیلگران: قیمت‌ها در بازار فردا جابه‌جا می‌شود.</p>
            ))}
          </motion.div>
          {/* ورزش جنگ */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className={cn('border border-amber-400/30 bg-[#0a0c08]/90 p-5', CLIP)}>
            <p className="mb-3 flex items-center gap-2 border-b border-amber-400/20 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300"><Trophy size={12} /> ورزش جنگ</p>
            {tours.length === 0 ? <p className="text-xs text-slate-600">جام فعالی نیست؛ هواداران منتظر سوت آغاز داور (ادمین) هستند.</p> : tours.map((t) => (
              <p key={t.id} className="mb-2 text-[11px] leading-5 text-slate-300">🏆 «{t.title}» در حال برگزاری است — جوایز: 🥇 ۰۰ • 🥈 ۱۲۰۰ • 🥉 ۶۰۰ WD.</p>
            ))}
            {topToday && <p className="mt-3 border-t border-white/5 pt-2 text-[11px] text-amber-200">👑 مرد روز میدان: <b>{topToday.name}</b> با {toFa(topToday.w)} پیروزی.</p>}
          </motion.div>
          {/* دیپلماسی */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={cn('border border-fuchsia-400/30 bg-[#0a0c08]/90 p-5', CLIP)}>
            <p className="mb-3 flex items-center gap-2 border-b border-fuchsia-400/20 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300"><HeartHandshake size={12} /> صفحه دیپلماسی</p>
            {allWars.length === 0 ? <p className="text-xs text-slate-600">اتحادها امروز چای می‌نوشند و نقشه می‌کشند — جنگ اتحادی فعال نیست.</p> : allWars.map((w) => (
              <p key={w.id} className="mb-2 text-[11px] leading-5 text-slate-300">🛡 جبهه اتحادها شعله‌ور است؛ نتیجه لحظه‌ای: {toFa(w.att_score)} - {toFa(w.def_score)}.</p>
            ))}
          </motion.div>
          {/* مهاجرت */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className={cn('border border-emerald-400/30 bg-[#0a0c08]/90 p-5', CLIP)}>
            <p className="mb-3 flex items-center gap-2 border-b border-emerald-400/20 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300"><Users size={12} /> مهاجرت و ثبت‌نام</p>
            {newUsers.length === 0 ? <p className="text-xs text-slate-600">امروز فرمانده جدیدی وارد آرنا نشد.</p> : (
              <>
                <p className="mb-2 text-[11px] leading-5 text-slate-300">👥 {toFa(newUsers.length)} فرمانده تازه‌وارد امروز پای به آرنا گذاشتند:</p>
                <div className="flex flex-wrap gap-1.5">
                  {newUsers.slice(0, 8).map((u, i) => (<span key={i} className={cn('border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-slate-400', CLIP_SM)}>{u.username}</span>))}
                </div>
              </>
            )}
          </motion.div>
          {/* طنز روز */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className={cn('border border-red-400/30 bg-[#0a0c08]/90 p-5', CLIP)}>
            <p className="mb-3 flex items-center gap-2 border-b border-red-400/20 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-300"><Skull size={12} /> طنز روز</p>
            <p className="text-[11px] leading-6 text-slate-300">{joke}</p>
            <div className="mt-4 flex items-end gap-0.5 opacity-60">
              {Array.from({ length: 30 }).map((_, i) => (<span key={i} className="w-0.5 bg-white" style={{ height: 6 + ((i * 7) % 14) }} />))}
              <span className="ml-2 font-mono text-[8px] text-slate-500">NX-{toFa(edition)}</span>
            </div>
          </motion.div>
        </div>

        {/* ─────────── پایان نسخه ─────────── */}
        <div className={cn('mt-8 flex flex-wrap items-center justify-between gap-4 border border-amber-400/30 bg-[#0a0c08]/90 p-5', CLIP)}>
          <p className="text-[10px] text-slate-500">پایان نسخه {toFa(edition)} — نکسوس تایمز، صدای میدان نبرد دیجیتال. نسخه فردا رأس ساعت ۰۰:۰۰ منتشر می‌شود.</p>
          <button onClick={() => window.print()} className={cn('no-print flex items-center gap-2 border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-[10px] font-black text-amber-300 transition hover:bg-amber-400/20', CLIP_SM)}>
            <Printer size={12} /> چاپ نسخه
          </button>
        </div>
      </div>
    </div>
  );
}