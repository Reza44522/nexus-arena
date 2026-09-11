import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

/* ── آژیر سینت‌سایزی (بدون فایل صوتی — هرگز خراب نمی‌شود) ── */
function useSiren() {
  const ctxRef = useRef(null);
  const ensure = () => {
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctxRef.current = new AC();
      }
      if (ctxRef.current && ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    } catch (e) {}
    return ctxRef.current;
  };
  const blast = (secs) => {
    const ctx = ensure();
    if (!ctx || ctx.state !== 'running') return false;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, t0);
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.85, t0);
      lfoGain.gain.setValueAtTime(240, t0);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.45, t0 + 0.12);
      gain.gain.setValueAtTime(0.45, t0 + secs - 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + secs);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      lfo.start(t0);
      osc.stop(t0 + secs);
      lfo.stop(t0 + secs);
      return true;
    } catch (e) {
      return false;
    }
  };
  const play = (secs = 8) => {
    if (blast(secs)) return;
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      blast(secs);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  };
  return { ensure, play };
}

/* ─────────── 🚨 اعلان سینمایی اعلام جنگ — تمام‌صفحه ─────────── */
export default function GlobalWarAlert() {
  const [alert, setAlert] = useState(null);
  const timerRef = useRef(null);
  const { ensure, play } = useSiren();

  useEffect(() => {
    const arm = () => ensure();
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel('global-war-cinema-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'war_matches' }, async (p) => {
                const m = p.new;
        if (!m) return;
        if (m.mode === 'blitz') return; // ⚡ جنگ سریع آژیر سراسری ندارد
        let att = null;
        let def = null;
        try {
          const ids = [m.attacker_country, m.defender_country].filter(Boolean);
          if (ids.length) {
            const { data } = await supabase.from('player_countries').select('id, name_fa, flag').in('id', ids);
            att = (data || []).find((x) => x.id === m.attacker_country) || null;
            def = (data || []).find((x) => x.id === m.defender_country) || null;
          }
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('nexus-music-pause'));
        setAlert({ id: m.id, att, def });
        play(8);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setAlert(null), 9000);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-[15000] overflow-hidden bg-black">
          <style>{`
            @keyframes gaSpin { to { transform: rotate(360deg); } }
            @keyframes gaRing { 0% { transform: scale(.4); opacity: .9; } 100% { transform: scale(2.6); opacity: 0; } }
            @keyframes gaScan { 0% { top: -10%; } 100% { top: 110%; } }
            @keyframes gaStripe { to { background-position: 56px 0; } }
            @keyframes gaFlick { 0%,100% { opacity: .10; } 50% { opacity: .18; } }
            @keyframes gaGlitch { 0%,86%,100% { text-shadow: 0 0 30px rgba(239,68,68,.8); transform: none; } 88% { text-shadow: -4px 0 #fbbf24, 4px 0 #ef4444; transform: translateX(3px) skewX(2deg); } 92% { text-shadow: 4px 0 #fbbf24, -4px 0 #ef4444; transform: translateX(-3px) skewX(-2deg); } 96% { text-shadow: 0 0 30px rgba(239,68,68,.8); transform: none; } }
            @keyframes gaMarquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
            @keyframes gaBar { from { width: 100%; } to { width: 0%; } }
            @keyframes gaClash { 0%,100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.25) rotate(-8deg); } }
            @keyframes gaFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          `}</style>

          {/* لایه‌های پس‌زمینه سینمایی */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(153,27,27,0.5), rgba(0,0,0,0.96) 72%)' }} />
          <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(239,68,68,.8) 0 28px, rgba(0,0,0,.9) 28px 56px)', animation: 'gaStripe 1.2s linear infinite' }} />
          <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px)', animation: 'gaFlick 3s infinite' }} />
          <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-red-400/80 to-transparent shadow-[0_0_24px_rgba(239,68,68,1)]" style={{ animation: 'gaScan 2.6s linear infinite' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.9) 100%)' }} />

          {/* نوارهای خطر بالا و پایین */}
          <div className="absolute inset-x-0 top-0 overflow-hidden border-b-2 border-red-500/60 bg-black/80 py-2" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(239,68,68,.25) 0 14px, transparent 14px 28px)' }}>
            <p className="whitespace-nowrap font-display text-[11px] font-black tracking-[0.5em] text-red-400" style={{ animation: 'gaMarquee 8s linear infinite' }}>⚠ هشدار سطح یک — اعلام جنگ سراسری — همه فرماندهان به پست‌های خود — آژیر فعال ⚠</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t-2 border-red-500/60 bg-black/80 py-2" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(239,68,68,.25) 0 14px, transparent 14px 28px)' }}>
            <p className="whitespace-nowrap font-display text-[11px] font-black tracking-[0.5em] text-red-400" style={{ animation: 'gaMarquee 8s linear infinite reverse' }}>GLOBAL WAR ALERT // DEFCON 1 // ALL COMMANDERS REPORT IMMEDIATELY //</p>
          </div>

          {/* گوشه‌های نظامی */}
          {['left-4 top-10 border-l-4 border-t-4', 'right-4 top-10 border-r-4 border-t-4', 'left-4 bottom-10 border-l-4 border-b-4', 'right-4 bottom-10 border-r-4 border-b-4'].map((c, i) => (
            <span key={i} className={'absolute h-14 w-14 border-red-500/70 ' + c} style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,.8))' }} />
          ))}

          {/* محتوای مرکزی */}
          <div className="relative grid h-full place-items-center px-4">
            <div className="text-center">
              <div className="relative mx-auto mb-6 h-32 w-32">
                <span className="absolute inset-0 rounded-full border-2 border-red-500/60" style={{ animation: 'gaRing 1.6s ease-out infinite' }} />
                <span className="absolute inset-0 rounded-full border-2 border-amber-400/50" style={{ animation: 'gaRing 1.6s ease-out .5s infinite' }} />
                <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(239,68,68,.9), transparent 70deg)', animation: 'gaSpin 1.4s linear infinite', filter: 'drop-shadow(0 0 24px rgba(239,68,68,.9))' }} />
                <div className="absolute inset-3 grid place-items-center rounded-full border-2 border-red-500/70 bg-black/85 text-5xl" style={{ animation: 'gaFloat 2s ease-in-out infinite' }}>🚨</div>
              </div>

              <p className="font-display text-[10px] font-black uppercase tracking-[0.6em] text-amber-300">DEFCON 1 // WAR DECLARED</p>
              <h1 className="mt-2 font-display text-4xl font-black text-red-500 md:text-7xl" style={{ animation: 'gaGlitch 2.4s infinite' }}>⚠ اعلام جنگ سراسری ⚠</h1>

              <div className="mt-8 flex items-center justify-center gap-4 md:gap-10">
                <motion.div initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }} className="min-w-[130px] border-2 border-red-500/50 bg-black/70 px-6 py-4 shadow-[0_0_40px_rgba(239,68,68,0.35)] md:min-w-[190px]" style={{ clipPath: 'polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))' }}>
                  <p className="text-4xl md:text-5xl">{alert.att?.flag || '⚔️'}</p>
                  <p className="mt-1 font-display text-sm font-black text-white md:text-lg">{alert.att?.name_fa || 'مهاجم'}</p>
                </motion.div>
                <span className="font-display text-3xl text-amber-300 md:text-5xl" style={{ animation: 'gaClash 1s ease-in-out infinite', filter: 'drop-shadow(0 0 18px rgba(251,191,36,.9))' }}>⚔️</span>
                <motion.div initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }} className="min-w-[130px] border-2 border-cyan-400/50 bg-black/70 px-6 py-4 shadow-[0_0_40px_rgba(34,211,238,0.3)] md:min-w-[190px]" style={{ clipPath: 'polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)' }}>
                  <p className="text-4xl md:text-5xl">{alert.def?.flag || '🛡'}</p>
                  <p className="mt-1 font-display text-sm font-black text-white md:text-lg">{alert.def?.name_fa || 'مدافع'}</p>
                </motion.div>
              </div>

              <p className="mt-6 text-xs font-bold text-red-200 md:text-sm">آژیر سراسری فعال است — نبرد به‌زودی آغاز می‌شود</p>
              <div className="mx-auto mt-3 h-1.5 w-64 overflow-hidden rounded-full bg-white/10 md:w-96">
                <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-red-500" style={{ animation: 'gaBar 9s linear forwards' }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}