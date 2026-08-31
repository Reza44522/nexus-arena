import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Lock, Zap, Banknote, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa, fmtNum, RESOURCES } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const BRANCH_STYLE = {
  military: { border: 'border-red-400/30', text: 'text-red-300', bg: 'bg-red-400/10', grad: 'from-red-500 to-amber-500' },
  economy: { border: 'border-emerald-400/30', text: 'text-emerald-300', bg: 'bg-emerald-400/10', grad: 'from-emerald-400 to-cyan-500' },
  intel: { border: 'border-purple-400/30', text: 'text-purple-300', bg: 'bg-purple-400/10', grad: 'from-purple-500 to-fuchsia-500' },
};
const BRANCHES = [
  { id: 'military', label: 'شاخه نظامی', icon: Zap },
  { id: 'economy', label: 'شاخه اقتصادی', icon: Banknote },
  { id: 'intel', label: 'شاخه اطلاعات', icon: Eye },
];

/* ─────────── TechTree — درخت فناوری امپراتوری ─────────── */
export default function TechTree() {
  const { user } = useAuth();
  const [techs, setTechs] = useState([]);
  const [mine, setMine] = useState({});
  const [wd, setWd] = useState(0);
  const [res, setRes] = useState({});
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  const load = async () => {
    if (!user?.id) return;
    const { data: c } = await supabase.from('player_countries').select('id, resources').eq('user_id', user.id).maybeSingle();
    setRes(c?.resources || {});
    const [tR, mR, pR] = await Promise.all([
      supabase.from('tech_tree').select('*').order('sort'),
      c ? supabase.from('country_tech').select('tech_id, level').eq('country_id', c.id) : Promise.resolve({ data: [] }),
      supabase.from('profiles').select('war_dollars').eq('id', user.id).single(),
    ]);
    setTechs(tR.data || []);
    const mm = {};
    (mR.data || []).forEach((x) => { mm[x.tech_id] = x.level; });
    setMine(mm);
    setWd(pR.data?.war_dollars ?? 0);
  };
  useEffect(() => { load(); }, [user?.id]);

  const research = async (t) => {
    setBusy(t.id);
    const { data, error } = await supabase.rpc('tech_research', { p_tech: t.id });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`🧬 «${t.name_fa}» به سطح ${toFa(data.level)} رسید!`);
    load();
  };

  const totalLvl = Object.values(mine).reduce((s, v) => s + v, 0);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes ttScan { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(168,85,247,.5); transform: none; } 92% { text-shadow: -3px 0 #22d3ee, 3px 0 #e879f9; transform: translateX(2px); } 94% { text-shadow: 3px 0 #22d3ee, -3px 0 #e879f9; transform: translateX(-2px); } 96% { text-shadow: 0 0 26px rgba(168,85,247,.5); transform: none; } }
      `}</style>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[360px] w-[520px] rounded-full bg-fuchsia-600/10 blur-[130px]" />
        <div className="absolute top-10 right-1/4 h-[300px] w-[440px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'64\' viewBox=\'0 0 56 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 0L56 16v32L28 64 0 48V16z\' fill=\'none\' stroke=\'%23a855f7\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '56px 64px' }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent" style={{ animation: 'ttScan 7s linear infinite' }} />
      </div>

      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-fuchsia-400/40 bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(168,85,247,0.3)]', CLIP_SM)}>{notice}</motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <p className="mb-2 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.4em] text-fuchsia-400">
            <FlaskConical size={12} /> IMPERIAL RESEARCH LAB // LIVE
          </p>
          <h1 className="font-display text-3xl font-black text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            درخت <span className="text-gradient">فناوری</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-slate-400">
            با سرمایه‌گذاری در سه شاخه، امپراتوری‌ت را برای همیشه قوی‌تر کن — هر سطح، هزینه بیشتر و اثر ماندگار.
          </p>
          <div className="mt-4 flex justify-center gap-2 text-[10px]">
            <span className={cn('border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 font-bold text-fuchsia-300', CLIP_SM)}>🧬 امتیاز فناوری: {toFa(totalLvl)}</span>
            <span className={cn('border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-bold text-emerald-300', CLIP_SM)}>💵 {fmtNum(wd)} WD</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {BRANCHES.map((b) => {
            const st = BRANCH_STYLE[b.id];
            const list = techs.filter((t) => t.branch === b.id);
            return (
              <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn('border bg-[#0a0c08]/85 p-4 backdrop-blur-xl', CLIP, st.border)}>
                <p className={cn('mb-4 flex items-center gap-2 border-b border-white/5 pb-3 font-display text-[10px] uppercase tracking-[0.3em]', st.text)}>
                  <b.icon size={13} /> {b.label}
                </p>
                {list.map((t, i) => {
                  const lvl = mine[t.id] || 0;
                  const maxed = lvl >= t.level_max;
                  const reqOk = !t.requires || (mine[t.requires] || 0) >= 1;
                  const costWd = t.cost_wd * (lvl + 1);
                  const can = reqOk && !maxed && wd >= costWd;
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }} className={cn('relative mb-4 border p-3', CLIP_SM, lvl > 0 ? cn(st.border, st.bg) : 'border-white/10 bg-white/5', !reqOk && 'opacity-50')}>
                      {i > 0 && <span className="absolute -top-4 left-1/2 h-4 w-px bg-white/20" />}
                      <div className="flex items-center gap-2">
                        <span className="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">{t.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-white">{t.name_fa}</p>
                          <p className="mt-0.5 text-[9px] leading-4 text-slate-500">{t.descr}</p>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: t.level_max }).map((_, x) => (
                            <span key={x} className={cn('h-1.5 w-3 rounded-sm', x < lvl ? 'bg-gradient-to-r ' + st.grad : 'bg-white/10')} />
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px]">
                        <span className="font-bold text-emerald-300">{fmtNum(costWd)} WD</span>
                        {Object.entries(t.cost_res || {}).map(([k, v]) => (
                          <span key={k} className="text-amber-300">{RESOURCES[k]?.icon} {fmtNum(Number(v) * (lvl + 1))}</span>
                        ))}
                        {!reqOk && <span className="flex items-center gap-1 text-red-400"><Lock size={9} /> پیش‌نیاز: {techs.find((x) => x.id === t.requires)?.name_fa}</span>}
                      </div>
                      <button onClick={() => research(t)} disabled={busy === t.id || !can} className={cn('mt-2 w-full py-2 font-display text-[9px] font-black uppercase tracking-widest text-slate-950 transition disabled:opacity-40', CLIP_SM, 'bg-gradient-to-r ' + st.grad)}>
                        {busy === t.id ? '⏳ ...' : maxed ? '✅ حداکثر سطح' : lvl > 0 ? `⬆ ارتقا به سطح ${toFa(lvl + 1)}` : '🧬 شروع تحقیق'}
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}