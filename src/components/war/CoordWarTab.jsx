import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, X, Map as MapIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toFa } from '../../data/countries';
import { cn } from '../../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const CELLS = [];
for (let r = 1; r <= 10; r++) COLS.forEach((c) => CELLS.push(c + r));

/* ─────────── CoordWarTab — جنگ مختصاتی (Battleship استراتژیک) ─────────── */
export default function CoordWarTab({ flash, pushLog }) {
  const { user } = useAuth();
  const [country, setCountry] = useState(null);
  const [targets, setTargets] = useState([]);
  const [battles, setBattles] = useState([]);
  const [target, setTarget] = useState(null);
  const [open, setOpen] = useState(null);
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    const c = await supabase.from('player_countries').select('*').eq('user_id', user.id).maybeSingle();
    setCountry(c.data || null);
    if (!c.data) return;
    const [tg, bt] = await Promise.all([
      supabase.from('player_countries').select('id, name_fa, flag').neq('user_id', user.id),
      supabase.from('coord_battles').select('*').or(`attacker_country.eq.${c.data.id},defender_country.eq.${c.data.id}`).order('created_at', { ascending: false }).limit(10),
    ]);
    setTargets(tg.data || []);
    setBattles(bt.data || []);
    if (open) {
      const fresh = (bt.data || []).find((b) => b.id === open.id);
      if (fresh) setOpen(fresh);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('cb-' + user?.id).on('postgres_changes', { event: '*', schema: 'public', table: 'coord_battles' }, () => load()).subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  const mySide = (b) => (b.attacker_country === country?.id ? 'att' : 'def');
  const myBases = (b) => (mySide(b) === 'att' ? b.att_bases : b.def_bases) || null;
  const myShots = (b) => (mySide(b) === 'att' ? b.att_shots : b.def_shots) || null;
  const enemyBases = (b) => (mySide(b) === 'att' ? b.def_bases : b.att_bases) || null;
  const enemyShots = (b) => (mySide(b) === 'att' ? b.def_shots : b.att_shots) || null;
  const nameOf = (id) => (id === country?.id ? country?.name_fa : targets.find((t) => t.id === id)?.name_fa || '—');

  const start = async () => {
    if (!target) return flash('❌ اول هدف را انتخاب کن');
    setBusy(true);
    const { data, error } = await supabase.rpc('coord_start', { p_defender: target.id });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    pushLog('🗺 نبرد مختصاتی جدید آغاز شد');
    flash('🗺 نبرد مختصاتی شروع شد — ۳ پایگاهت را مخفیانه بچین!');
    load();
  };

  const toggle = (c) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const submit = async (b) => {
    const placing = b.status === 'placing' && !myBases(b);
    const need = placing ? 3 : 5;
    if (sel.length !== need) return flash('❌ دقیقاً ' + toFa(need) + ' خانه انتخاب کن');
    setBusy(true);
    const params = placing
      ? { p_battle: b.id, p_side: mySide(b), p_bases: sel }
      : { p_battle: b.id, p_side: mySide(b), p_shots: sel };
    const { data, error } = await supabase.rpc(placing ? 'coord_place' : 'coord_shoot', params);
    setBusy(false);
    setSel([]);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    pushLog(placing ? '🗺 پایگاه‌ها مخفیانه چیده شد' : '💥 شلیک مختصاتی انجام شد');
    flash(placing ? '✅ پایگاه‌ها چیده شد — منتظر حریف' : '💥 شلیک ثبت شد!');
    load();
  };

  const cellCls = (b, mode, c) => {
    const base = 'grid h-7 w-7 place-items-center border text-[8px] font-bold transition md:h-8 md:w-8';
    if (mode === 'place') return cn(base, sel.includes(c) ? 'border-cyan-300 bg-cyan-400/40 text-white shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'border-white/10 bg-white/5 text-slate-600 hover:bg-cyan-400/10');
    if (mode === 'shoot') return cn(base, sel.includes(c) ? 'border-red-400 bg-red-500/50 text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]' : 'border-white/10 bg-white/5 text-slate-600 hover:bg-red-400/10');
    return base;
  };

  const ResultCell = ({ hit, mine }) => (
    <span className={cn('grid h-7 w-7 place-items-center border text-[9px] font-black md:h-8 md:w-8', CLIP_SM, hit ? 'border-red-400 bg-red-500/60 text-white shadow-[0_0_12px_rgba(239,68,68,0.8)]' : mine ? 'border-amber-400/50 bg-amber-400/20 text-amber-300' : 'border-white/10 bg-white/5 text-slate-700')}>
      {hit ? '✸' : mine ? '▣' : '·'}
    </span>
  );

  const active = battles.filter((b) => b.status !== 'finished');
  const done = battles.filter((b) => b.status === 'finished');

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* شروع نبرد */}
      <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
        <p className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300">🗺 جنگ مختصاتی</p>
        <p className="mb-3 text-[9px] leading-4 text-slate-500">۱) سه پایگاه مخفی بچین ۲) پنج مختص شلیک کن ۳) برخورد بیشتر = برنده (+۱۲۰ WD + غارت)</p>
        <div className="chat-scroll max-h-64 space-y-1.5 overflow-y-auto">
          {targets.map((t) => (
            <button key={t.id} onClick={() => setTarget(t)} className={cn('flex w-full items-center gap-2 border p-2.5 text-right', CLIP_SM, target?.id === t.id ? 'border-cyan-400/60 bg-cyan-400/15' : 'border-white/5 bg-white/5 hover:bg-white/10')}>
              <span className="text-xl">{t.flag}</span>
              <span className="flex-1 text-xs font-bold text-white">{t.name_fa || t.name_en}</span>
            </button>
          ))}
        </div>
        <button onClick={start} disabled={busy || !target} className={cn('mt-4 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-40', CLIP_SM)}>
          <MapIcon size={14} /> شروع نبرد مختصاتی
        </button>
        <div className="mt-4 space-y-1.5">
          {active.map((b) => (
            <button key={b.id} onClick={() => { setOpen(b); setSel([]); }} className={cn('flex w-full items-center gap-2 border border-cyan-400/30 bg-cyan-400/5 p-2.5 text-right transition hover:bg-cyan-400/15', CLIP_SM)}>
              <Crosshair size={12} className="text-cyan-300" />
              <span className="flex-1 text-[10px] font-bold text-white">⚔ {nameOf(b.attacker_country)} vs {nameOf(b.defender_country)}</span>
              <span className="text-[8px] text-cyan-300">{b.status === 'placing' ? 'فاز چیدمان' : 'فاز شلیک'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* تاریخچه + راهنما */}
      <div className="space-y-4 lg:col-span-2">
        <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
          <p className="mb-3 font-display text-[10px] uppercase tracking-[0.3em] text-slate-400">📜 نبردهای مختصاتی من</p>
          {done.length === 0 ? <p className="py-6 text-center text-xs text-slate-600">هنوز نبرد مختصاتی تمام‌شده‌ای نداری</p> : done.map((b) => (
            <button key={b.id} onClick={() => setOpen(b)} className={cn('mb-2 flex w-full flex-wrap items-center gap-3 border p-3 text-right transition hover:border-cyan-400/40', CLIP_SM, 'border-white/10 bg-white/5')}>
              <span className={cn('border px-2 py-0.5 text-[9px] font-black', CLIP_SM, b.winner_country === country?.id ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : b.winner_country ? 'border-red-400/40 bg-red-400/10 text-red-400' : 'border-slate-400/40 bg-slate-400/10 text-slate-300')}>
                {b.winner_country === country?.id ? 'پیروزی' : b.winner_country ? 'شکست' : 'مساوی'}
              </span>
              <span className="flex-1 text-[10px] text-slate-300">برخوردها: تو {toFa(b.att_hits ?? 0)} / حریف {toFa(b.def_hits ?? 0)}</span>
            </button>
          ))}
        </div>
        <div className={cn('border border-cyan-400/20 bg-[#0a0c08]/85 p-5', CLIP)}>
          <p className="mb-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300">🧠 تاکتیک‌های مختصاتی</p>
          <p className="text-[10px] leading-5 text-slate-400">• پایگاه‌ها را پراکنده بچین (خوشه‌ای = نابودی خوشه‌ای)<br />• شلیک‌ها را الگوی شطرنجی بزن تا سطح بیشتری را بپوشانی<br />• اگر جنگ اتحادی قالب «مختصاتی» فعال باشد، برد تو = ۳ امتیاز برای اتحادت!</p>
        </div>
      </div>

      {/* ─────────── مودال نبرد مختصاتی ─────────── */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[16000] grid place-items-center bg-black/85 px-4 backdrop-blur-[4px]" onClick={() => setOpen(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} onClick={(e) => e.stopPropagation()} className={cn('max-h-[90vh] w-full max-w-xl overflow-y-auto border border-cyan-400/40 bg-[#0a0c08]/95 p-6', CLIP)}>
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="font-display text-sm font-black text-white">🗺 نبرد مختصاتی: {nameOf(open.attacker_country)} ⚔ {nameOf(open.defender_country)}</p>
                <button onClick={() => setOpen(null)} className="grid h-7 w-7 place-items-center text-slate-500 hover:text-white"><X size={14} /></button>
              </div>

              {/* فاز چیدمان */}
              {open.status === 'placing' && !myBases(open) && (
                <div>
                  <p className="mb-2 text-[10px] font-bold text-cyan-300">۳ پایگاه مخفی خودت را انتخاب کن ({toFa(sel.length)}/۳)</p>
                  <div className="grid grid-cols-10 gap-1">
                    {CELLS.map((c) => (
                      <button key={c} onClick={() => toggle(c)} className={cellCls(open, 'place', c)}>{sel.includes(c) ? '▣' : ''}</button>
                    ))}
                  </div>
                  <button onClick={() => submit(open)} disabled={busy} className={cn('mt-4 w-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>✅ ثبت چیدمان مخفی</button>
                </div>
              )}
              {open.status === 'placing' && myBases(open) && (
                <p className="py-8 text-center text-xs text-slate-500">⏳ پایگاه‌های تو چیده شد — منتظر چیدمان حریف...</p>
              )}

              {/* فاز شلیک */}
              {(open.status === 'attacking' || open.status === 'shooting') && !myShots(open) && (
                <div>
                  <p className="mb-2 text-[10px] font-bold text-red-300">۵ مختص برای شلیک انتخاب کن ({toFa(sel.length)}/۵)</p>
                  <div className="grid grid-cols-10 gap-1">
                    {CELLS.map((c) => (
                      <button key={c} onClick={() => toggle(c)} className={cellCls(open, 'shoot', c)}>{sel.includes(c) ? '✸' : ''}</button>
                    ))}
                  </div>
                  <button onClick={() => submit(open)} disabled={busy} className={cn('mt-4 w-full bg-gradient-to-r from-red-500 to-amber-500 py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>💥 شلیک!</button>
                </div>
              )}
              {(open.status === 'attacking' || open.status === 'shooting') && myShots(open) && (
                <p className="py-8 text-center text-xs text-slate-500">⏳ شلیک‌های تو ثبت شد — منتظر شلیک حریف...</p>
              )}

              {/* نتیجه */}
              {open.status === 'finished' && (
                <div className="space-y-5">
                  <p className={cn('border p-3 text-center text-sm font-black', CLIP_SM, open.winner_country === country?.id ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : open.winner_country ? 'border-red-400/40 bg-red-400/10 text-red-300' : 'border-slate-400/40 bg-slate-400/10 text-slate-300')}>
                    {open.winner_country === country?.id ? '🏆 پیروزی مختصاتی!' : open.winner_country ? '💀 شکست مختصاتی' : '🤝 مساوی'}
                  </p>
                  <div>
                    <p className="mb-2 text-[10px] font-bold text-red-300">شلیک‌های تو روی پایگاه‌های حریف (✸ برخورد)</p>
                    <div className="grid grid-cols-10 gap-1">
                      {CELLS.map((c) => (
                        <ResultCell key={c} hit={(myShots(open) || []).includes(c) && (enemyBases(open) || []).includes(c)} mine={(myShots(open) || []).includes(c) && !(enemyBases(open) || []).includes(c)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-bold text-amber-300">شلیک‌های حریف روی پایگاه‌های تو (▣ پایگاه تو)</p>
                    <div className="grid grid-cols-10 gap-1">
                      {CELLS.map((c) => (
                        <ResultCell key={c} hit={(enemyShots(open) || []).includes(c) && (myBases(open) || []).includes(c)} mine={(myBases(open) || []).includes(c) && !(enemyShots(open) || []).includes(c)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}