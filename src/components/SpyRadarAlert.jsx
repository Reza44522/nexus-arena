import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, X, ShieldAlert, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/* ─────────── SpyRadarAlert v4 — بدون فیلتر زمانی + لاگ کامل ─────────── */
export default function SpyRadarAlert() {
  const { user } = useAuth();
  const [alert, setAlert] = useState(null);
  const [countryId, setCountryId] = useState(null);
  const seenRef = useRef(new Set());
  const hideRef = useRef(null);

  /* ۱) کشور من + علامت‌گذاری ردیف‌های قدیمی */
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from('player_countries').select('id').eq('user_id', user.id).maybeSingle();
      console.log('🛰 [SpyRadarAlert] countryId =', data?.id || 'NULL', error ? 'ERR: ' + error.message : '');
      if (alive && data?.id) {
        const { data: old } = await supabase.from('spy_ops').select('id').eq('target_country', data.id).limit(30);
        (old || []).forEach((r) => seenRef.current.add(r.id));
        console.log('🛰 [SpyRadarAlert] پایش شروع شد — ردیف‌های قدیمی نادیده گرفته شدند:', (old || []).length);
        setCountryId(data.id);
      }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  /* ۲) صدای هشدار */
  const playPing = () => {
    try {
      const a = new Audio('/audio/warning-siren.mp3');
      a.volume = 0.5;
      a.play().catch(() => {});
      setTimeout(() => { try { a.pause(); } catch (e) {} }, 4000);
    } catch (e) { /* بی‌صدا */ }
  };

  /* ۳) نمایش هشدار */
  const show = async (row) => {
    if (!row?.id || seenRef.current.has(row.id)) return;
    seenRef.current.add(row.id);
    console.log('🕵️ [SpyRadarAlert] جاسوسی جدید شناسایی شد! id =', row.id);
    const { data } = await supabase.from('player_countries').select('name_fa, flag').eq('id', row.spy_country).maybeSingle();
    setAlert({
      spyName: (data?.flag || '🕵️') + ' ' + (data?.name_fa || 'دشمن ناشناس'),
      time: new Date(row.created_at || Date.now()).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    });
    playPing();
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setAlert(null), 10000);
  };

  /* ۴) Real-time (اگر وصل شد) + پولینگ بدون فیلتر زمانی */
  useEffect(() => {
    if (!countryId) return;
    const ch = supabase
      .channel('global-spy-' + countryId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'spy_ops', filter: `target_country=eq.${countryId}` }, (p) => { console.log('📡 realtime event رسید'); show(p.new); })
      .subscribe();

    const iv = setInterval(async () => {
      const { data, error } = await supabase
        .from('spy_ops')
        .select('*')
        .eq('target_country', countryId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) { console.error('🛰 poll error:', error.message); return; }
      const fresh = (data || []).filter((r) => !seenRef.current.has(r.id));
      if (fresh.length) { console.log('🛰 poll: ردیف جدید پیدا شد =', fresh.length); fresh.forEach((row) => show(row)); }
    }, 4000);

    return () => { supabase.removeChannel(ch); clearInterval(iv); if (hideRef.current) clearTimeout(hideRef.current); };
    // eslint-disable-next-line
  }, [countryId]);

  return (
    <AnimatePresence>
      {alert && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-md" onClick={() => setAlert(null)} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9991] flex items-center justify-center p-4">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <motion.div initial={{ top: '-10%' }} animate={{ top: '110%' }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/70 to-transparent" />
            </div>
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotateY: -60 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 16, stiffness: 220 }}
              className="relative w-full max-w-xl overflow-hidden border-2 border-purple-500/60 bg-gradient-to-br from-[#0a0c08] via-[#1a0a2e] to-[#0a0c08] shadow-[0_0_90px_rgba(168,85,247,0.55)]"
              style={{ clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 28px 100%, 0 calc(100% - 28px))' }}
            >
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} className="h-80 w-80 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(168,85,247,0.35), transparent 90deg)' }} />
                <div className="absolute inset-8 rounded-full border border-purple-500/20" />
                <div className="absolute inset-16 rounded-full border border-purple-500/10" />
              </div>
              <button onClick={() => setAlert(null)} className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-300 transition hover:bg-purple-500/40">
                <X size={16} />
              </button>
              <div className="relative z-10 px-8 py-10 text-center">
                <div className="relative mx-auto mb-5 h-24 w-24">
                  <motion.span animate={{ scale: [1, 1.9], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="absolute inset-0 rounded-full border-2 border-purple-400" />
                  <motion.span animate={{ scale: [1, 1.9], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: 0.5 }} className="absolute inset-0 rounded-full border-2 border-purple-400" />
                  <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 shadow-[0_0_45px_rgba(168,85,247,0.6)]">
                    <ShieldAlert className="h-11 w-11 text-purple-300" />
                  </motion.div>
                </div>
                <p className="mb-1 font-mono text-[10px] tracking-[0.45em] text-purple-400/80">⚠ THREAT DETECTED // شناسایی جاسوسی</p>
                <h2 className="font-display text-3xl font-black tracking-wider text-white md:text-4xl">🚨 هشدار راداری 🚨</h2>
                <p className="mt-4 text-sm text-slate-300 md:text-base">یک عامل دشمن اطلاعات کشور تو را اسکن کرد!</p>
                <div className="mt-3 inline-flex items-center gap-3 rounded-lg border border-purple-400/30 bg-purple-500/10 px-6 py-3">
                  <Eye className="h-5 w-5 text-purple-400" />
                  <span className="font-display text-lg font-bold text-purple-200">{alert.spyName}</span>
                </div>
                <div className="mt-5 flex items-center justify-center gap-5 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5"><Radar className="h-3.5 w-3.5 text-purple-400" /> شناسایی: {alert.time}</span>
                  <span className="h-3 w-px bg-purple-400/30" />
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> وضعیت: شناسایی فعال</span>
                </div>
                <div className="mx-auto mt-6 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
                  <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 10, ease: 'linear' }} className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
                </div>
              </div>
              <div className="relative h-1 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}