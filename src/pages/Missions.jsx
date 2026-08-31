import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const MISSIONS = [
  { key: 'tax_daily', icon: '💵', title: 'بودجه روزانه', desc: 'مالیات روزانه کشور را دریافت کن', reward: 50, daily: true },
  { key: 'collect_daily', icon: '📦', title: 'برداشت بزرگ', desc: 'یک استخراج ۲۴ساعته را جمع کن', reward: 40, daily: true },
  { key: 'war_win', icon: '⚔️', title: 'فاتح میدان', desc: 'امروز یک نبرد ببر', reward: 120, daily: true },
  { key: 'own_mil3', icon: '🎖', title: 'زرادخانه', desc: '۳ واحد تجهیز نظامی داشته باش', reward: 150, daily: false },
  { key: 'cabinet', icon: '👥', title: 'دولت‌مردان', desc: 'کابینه کشور را تشکیل بده', reward: 80, daily: false },
  { key: 'alliance', icon: '🤝', title: 'هم‌پیمان', desc: 'عضو یک اتحاد شو', reward: 80, daily: false },
  { key: 'treaty', icon: '📜', title: 'دیپلمات', desc: 'یک پیمان تجاری فعال ببند', reward: 200, daily: false },
];

/* ─────────── Missions — ماموریت‌های روزانه ─────────── */
export default function Missions() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('mission_claims').select('mission_key, day').eq('user_id', user.id);
    setClaims(data || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const isClaimed = (m) =>
    m.daily ? claims.some((c) => c.mission_key === m.key && c.day === new Date().toISOString().slice(0, 10)) : claims.some((c) => c.mission_key === m.key);

  const claim = async (m) => {
    setBusy(m.key);
    const { data, error } = await supabase.rpc('claim_mission', { p_key: m.key });
    setBusy(null);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`🎁 جایزه ماموریت: +${toFa(data.reward)} WD`);
    load();
  };

  const doneCount = MISSIONS.filter(isClaimed).length;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; } 92% { text-shadow: -2px 0 #e879f9, 2px 0 #22d3ee; transform: translateX(1px); } 94% { text-shadow: 2px 0 #e879f9, -2px 0 #22d3ee; transform: translateX(-1px); } 96% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; } }
      `}</style>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[42vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
      </div>

      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM)}>{notice}</motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Operations // Daily Missions
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            ماموریت‌های <span className="text-gradient">روزانه</span>
          </h1>
          <p className={cn('mx-auto mt-3 w-fit border border-cyan-400/40 bg-cyan-400/10 px-4 py-1.5 text-xs font-black text-cyan-300', CLIP_SM)}>
            <Target size={11} className="mr-1 inline" /> پیشرفت: {toFa(doneCount)}/{toFa(MISSIONS.length)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MISSIONS.map((m, i) => {
            const claimed = isClaimed(m);
            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className={cn('relative border p-5 backdrop-blur-xl transition-colors', CLIP, claimed ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-white/10 bg-[#0a0c08]/85 hover:border-cyan-400/40')}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-cyan-400/40" />
                <div className="flex items-center gap-3">
                  <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 text-2xl', CLIP_SM)}>{m.icon}</div>
                  <div>
                    <p className="font-display text-sm font-bold text-white">{m.title}</p>
                    <p className={cn('border px-1.5 py-0.5 text-[8px] font-black w-fit mt-1', CLIP_SM, m.daily ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300')}>
                      {m.daily ? 'روزانه' : 'دائمی'}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-slate-400">{m.desc}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className={cn('flex items-center gap-1 text-[10px] font-black text-emerald-300', CLIP_SM)}>
                    <Gift size={11} /> +{toFa(m.reward)} WD
                  </span>
                  {claimed ? (
                    <span className={cn('flex items-center gap-1 border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-[10px] font-black text-emerald-300', CLIP_SM)}>
                      <CheckCircle2 size={12} /> {m.daily ? 'امروز انجام شد' : 'انجام شد'}
                    </span>
                  ) : (
                    <button onClick={() => claim(m)} disabled={busy === m.key} className={cn('bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 font-display text-[10px] font-black uppercase tracking-widest text-slate-950 transition-all hover:shadow-[0_0_18px_rgba(34,211,238,0.4)] disabled:opacity-50', CLIP_SM)}>
                      {busy === m.key ? '⏳ ...' : 'دریافت جایزه'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}