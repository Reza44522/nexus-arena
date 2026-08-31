import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Map as MapIcon, Trophy, Swords } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toFa } from '../../data/countries';
import { cn } from '../../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const pad = (n) => String(n).padStart(2, '0');

const FORMATS = [
  { id: 'team_duels', icon: Shield, title: 'نبرد تیمی', desc: '۲۴ ساعت • هر دوئل بین اعضای دو اتحاد = ۱ امتیاز' },
  { id: 'blitz', icon: Zap, title: 'جنگ برق‌آسا', desc: '۶ ساعت فشرده • هر برد = ۱ امتیاز' },
  { id: 'coord', icon: MapIcon, title: 'جنگ مختصاتی', desc: '۲۴ ساعت • هر برد مختصاتی = ۳ امتیاز' },
];

/* ─────────── AllianceWarTab — جنگ بین اتحادها ─────────── */
export default function AllianceWarTab({ flash, pushLog }) {
  const { user } = useAuth();
  const [myAlliance, setMyAlliance] = useState(null);
  const [alliances, setAlliances] = useState([]);
  const [wars, setWars] = useState([]);
  const [target, setTarget] = useState(null);
  const [format, setFormat] = useState('team_duels');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const load = async () => {
    if (!user?.id) return;
    await supabase.rpc('war_settle_alliances');
    const [me, all, w] = await Promise.all([
      supabase.from('alliance_members').select('alliance:alliances(id, name, emblem)').eq('user_id', user.id).maybeSingle(),
      supabase.from('alliances').select('id, name, emblem'),
      supabase.from('alliance_wars').select('*').order('created_at', { ascending: false }).limit(12),
    ]);
    setMyAlliance(me.data?.alliance || null);
    setAlliances(all.data || []);
    setWars(w.data || []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('aw-' + user?.id).on('postgres_changes', { event: '*', schema: 'public', table: 'alliance_wars' }, () => load()).subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  const nameOf = (id) => { const a = alliances.find((x) => x.id === id); return a ? a.emblem + ' ' + a.name : '—'; };
  const countdown = (ts) => {
    const d = new Date(ts).getTime() - now;
    if (d <= 0) return 'پایان!';
    const h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000), s = Math.floor((d % 60000) / 1000);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const declare = async () => {
    if (!target) return flash('❌ اول اتحاد هدف را انتخاب کن');
    setBusy(true);
    const { data, error } = await supabase.rpc('war_declare_alliance', { p_defender: target.id, p_format: format });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    pushLog('⚔️ جنگ اتحادی با قالب ' + format + ' اعلام شد');
    flash('⚔️ جنگ اتحادی اعلام شد! اعضا بجنگند تا امتیاز جمع شود (اعضای برنده: +۲۰۰ WD)');
    load();
  };

  const active = wars.filter((w) => w.status === 'active');
  const done = wars.filter((w) => w.status === 'finished');

  if (!myAlliance) {
    return <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-14 text-center text-slate-500', CLIP)}>🛡 برای جنگ اتحادی اول باید عضو یک اتحاد باشی!</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* اعلام جنگ */}
      <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
        <p className="mb-1 font-display text-[10px] uppercase tracking-[0.3em] text-fuchsia-300">🛡 اتحاد تو: {myAlliance.emblem} {myAlliance.name}</p>
        <p className="mb-3 text-[9px] text-slate-500">هزینه اعلام: ۳۰۰ WD از خزانه تو</p>
        <p className="mb-2 text-[10px] font-black text-white">قالب جنگ:</p>
        <div className="space-y-1.5">
          {FORMATS.map((f) => (
            <button key={f.id} onClick={() => setFormat(f.id)} className={cn('flex w-full items-center gap-2 border p-2.5 text-right transition', CLIP_SM, format === f.id ? 'border-fuchsia-400/60 bg-fuchsia-400/15' : 'border-white/5 bg-white/5 hover:bg-white/10')}>
              <f.icon size={14} className="text-fuchsia-300" />
              <span className="flex-1">
                <span className="block text-xs font-bold text-white">{f.title}</span>
                <span className="block text-[9px] text-slate-500">{f.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mb-2 mt-4 text-[10px] font-black text-white">اتحاد هدف:</p>
        <div className="chat-scroll max-h-40 space-y-1.5 overflow-y-auto">
          {alliances.filter((a) => a.id !== myAlliance.id).map((a) => (
            <button key={a.id} onClick={() => setTarget(a)} className={cn('flex w-full items-center gap-2 border p-2 text-right', CLIP_SM, target?.id === a.id ? 'border-red-400/60 bg-red-400/15' : 'border-white/5 bg-white/5 hover:bg-white/10')}>
              <span className="text-lg">{a.emblem}</span>
              <span className="flex-1 text-xs font-bold text-white">{a.name}</span>
            </button>
          ))}
        </div>
        <button onClick={declare} disabled={busy || !target} className={cn('mt-4 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-red-500 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-40', CLIP_SM)}>
          <Swords size={14} /> اعلام جنگ اتحادی
        </button>
      </div>

      {/* اسکوربورد زنده */}
      <div className="space-y-4 lg:col-span-2">
        {active.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-10 text-center text-slate-500', CLIP)}>هیچ جنگ اتحادی فعالی نیست — اولین اعلام‌کننده باش!</div>
        ) : (
          active.map((w) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('relative border border-fuchsia-400/40 bg-fuchsia-400/5 p-5', CLIP)}>
              <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-fuchsia-400/60" />
              <p className="mb-3 flex flex-wrap items-center gap-2 text-[9px]">
                <span className={cn('border border-fuchsia-400/40 bg-fuchsia-400/10 px-2 py-0.5 font-black text-fuchsia-300', CLIP_SM)}>{FORMATS.find((f) => f.id === w.format)?.title || w.format}</span>
                <span className={cn('border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-display tabular-nums text-amber-300', CLIP_SM)}>⏱ {countdown(w.ends_at)}</span>
              </p>
              <div className="grid grid-cols-3 items-center gap-2 text-center">
                <p className="text-sm font-black text-white">{nameOf(w.attacker_alliance)}</p>
                <p className="font-display text-3xl font-black text-red-400">{toFa(w.att_score)} <span className="text-slate-600">-</span> {toFa(w.def_score)}</p>
                <p className="text-sm font-black text-white">{nameOf(w.defender_alliance)}</p>
              </div>
              <p className="mt-3 text-center text-[9px] text-slate-500">اعضای دو اتحاد با دوئل‌ها و نبردهای مختصاتی، خودکار امتیاز جمع می‌کنند</p>
            </motion.div>
          ))
        )}
        {/* تاریخچه */}
        <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-4', CLIP)}>
          <p className="mb-2 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300"><Trophy size={12} /> جنگ‌های پایان‌یافته</p>
          {done.length === 0 ? <p className="text-xs text-slate-600">هنوز جنگی تمام نشده</p> : done.slice(0, 6).map((w) => (
            <p key={w.id} className="mb-1.5 text-[10px] text-slate-400">
              {nameOf(w.attacker_alliance)} ⚔ {nameOf(w.defender_alliance)} — {toFa(w.att_score)}:{toFa(w.def_score)}
              {w.winner_alliance && <span className="mr-2 text-emerald-300">برنده: {nameOf(w.winner_alliance)} (+۲۰۰ WD اعضا)</span>}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}