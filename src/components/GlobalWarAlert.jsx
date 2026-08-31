import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords } from 'lucide-react';
import { supabase } from '../lib/supabase';

const HAZARD = { background: 'repeating-linear-gradient(45deg, rgba(239,68,68,.25) 0 12px, transparent 12px 24px)' };

/* 🔊 فایل آژیر جنگ — فقط همین یک خط را عوض کن */
const SIREN_FILE = '/audio/my-war-alarm.mp3';

/* ─────────── GlobalWarAlert — آژیر سراسری اعلام جنگ (فایل واقعی) ─────────── */
export default function GlobalWarAlert() {
  const [alert, setAlert] = useState(null);
  const [left, setLeft] = useState(15);

  /* 🔊 پخش warning-siren.mp3 به مدت ۱۵ ثانیه */
  const startSiren = () => {
    // توقف موزیک سراسری
    window.dispatchEvent(new CustomEvent('nexus-music-pause'));
        const audio = new Audio(SIREN_FILE);
    audio.volume = 1;
    const startedAt = Date.now();
    let unlocked = false;

    const play = () => {
      audio
        .play()
        .then(() => console.log(' [WarAlert] آژیر جنگ پخش شد'))
        .catch((err) => {
          console.warn('🔇 [WarAlert] مرورگر اجازه نداد؛ با اولین کلیک پخش می‌شود...', err?.name);
          if (unlocked) return;
          const unlock = () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            unlocked = true;
            play();
          };
          window.addEventListener('pointerdown', unlock);
          window.addEventListener('keydown', unlock);
          setTimeout(() => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
          }, 16000);
        });
    };

    // لوپ تا پایان ۱۵ ثانیه (اگر فایل کوتاه‌تر بود)
    audio.onended = () => {
      if (Date.now() - startedAt < 15000) play();
    };
        audio.addEventListener('error', () => {
      console.error('❌ [WarAlert] فایل ' + SIREN_FILE + ' پیدا نشد! مسیر: public' + SIREN_FILE);
    });

    play();
    // قطع دقیق بعد از ۱۵ ثانیه (اگر فایل بلندتر بود)
    setTimeout(() => {
      try { audio.pause(); } catch (e) {}
    }, 15000);
  };

  useEffect(() => {
    const ch = supabase
      .channel('global-war-alert-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'war_matches' }, (p) => {
        const m = p.new;
        if (m.mode !== 'duel') return;
        (async () => {
          const [a, d] = await Promise.all([
            supabase.from('player_countries').select('name_fa, flag').eq('id', m.attacker_country).maybeSingle(),
            supabase.from('player_countries').select('name_fa, flag').eq('id', m.defender_country).maybeSingle(),
          ]);
          setAlert({
            att: (a.data?.flag || '🌐') + ' ' + (a.data?.name_fa || '—'),
            def: (d.data?.flag || '🌐') + ' ' + (d.data?.name_fa || '—'),
            until: Date.now() + 15000,
          });
          setLeft(15);
          startSiren();
          setTimeout(() => setAlert(null), 15000);
        })();
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!alert) return;
    const iv = setInterval(() => setLeft(Math.max(0, Math.round((alert.until - Date.now()) / 1000))), 250);
    return () => clearInterval(iv);
  }, [alert]);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[9990] grid place-items-center bg-red-950/50 backdrop-blur-[3px]"
        >
          <motion.div
            initial={{ scale: 0.75, y: 40, rotateX: -30 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            style={{ transformPerspective: 1000 }}
            className="relative w-[min(560px,92vw)] border-4 border-double border-red-500 bg-black/95 px-8 py-8 text-center shadow-[0_0_90px_rgba(239,68,68,0.65)]"
          >
            <div className="absolute inset-x-0 top-0 h-3" style={HAZARD} />
            <div className="absolute inset-x-0 bottom-0 h-3" style={HAZARD} />
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-red-500 bg-red-500/15"
            >
              <Swords size={38} className="text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]" />
            </motion.div>
            <p className="mt-4 font-display text-2xl font-black uppercase tracking-[0.3em] text-red-400 md:text-3xl">🚨 اعلام جنگ!</p>
            <p className="mt-4 text-lg font-black text-white">
              {alert.att} <span className="mx-2 text-red-400">⚔</span> {alert.def}
            </p>
            <p className="mt-2 text-xs text-slate-400">همه فرماندهان آماده‌باش — نبرد به‌زودی آغاز می‌شود</p>
            <p className="mt-4 font-display text-4xl font-black tabular-nums text-amber-300">{left}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}