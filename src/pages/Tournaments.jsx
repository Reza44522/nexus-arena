import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Coins, Swords, CalendarClock, Radio, UserPlus, X, CheckCircle2, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const GAMES = [
  { id: 'mafia', name: 'مافیا', icon: '🕵️' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'csgo', name: 'CS:GO', icon: '💣' },
  { id: 'lol', name: 'League of Legends', icon: '⚔️' },
  { id: 'dota2', name: 'Dota 2', icon: '🛡️' },
  { id: 'pubg', name: 'PUBG', icon: '🎯' },
  { id: 'other', name: 'سایر', icon: '🎮' },
];

const BRACKETS = { single: 'تک‌حذفی', double: 'دوحذفی', groups: 'گروهی' };

const STATUS_META = {
  upcoming: { label: 'پیش‌رو', cls: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' },
  live: { label: 'زنده', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
  completed: { label: 'پایان‌یافته', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
};

const FILTERS = [
  { id: 'all', label: 'همه' },
  { id: 'upcoming', label: 'پیش‌رو' },
  { id: 'live', label: 'زنده' },
  { id: 'completed', label: 'پایان‌یافته' },
];

const toFa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const pad = (n) => String(n).padStart(2, '0');

/* ─────────── Tournaments v7 — TOURNAMENT ARENA ─────────── */
export default function Tournaments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [myRegs, setMyRegs] = useState({});
  const [modal, setModal] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [now, setNow] = useState(Date.now());

  const flash = (t, m) => {
    setNotice({ t, m });
    setTimeout(() => setNotice(null), 3000);
  };

  const load = async () => {
    const { data } = await supabase.from('tournaments').select('*').order('starts_at', { ascending: false });
    setList(data || []);
    setLoading(false);
    if (user?.id) {
      const { data: r } = await supabase.from('tournament_registrations').select('*').eq('user_id', user.id);
      const map = {};
      (r || []).forEach((x) => (map[x.tournament_id] = x));
      setMyRegs(map);
    }
  };

  /* Realtime + تیک ثانیه‌ای */
  useEffect(() => {
    load();
    const ch = supabase
      .channel('tournaments-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_registrations' }, () => load())
      .subscribe();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(t);
    };
    // eslint-disable-next-line
  }, [user?.id]);

  const filtered = filter === 'all' ? list : list.filter((t) => t.status === filter);

  /* ثبت‌نام */
  const register = async () => {
    if (!modal) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('register_for_tournament', {
      p_tournament_id: modal.id,
      p_team_name: teamName.trim(),
    });
    setBusy(false);
    if (error) return flash('err', '❌ ' + error.message);
    if (data && data.ok === false) return flash('err', '❌ ' + data.error);
    setModal(null);
    setTeamName('');
    flash('ok', '✅ ثبت‌نام کامل شد! جای تو در برکت رزرو شد');
    load();
  };

  /* انصراف */
  const cancel = async (t) => {
    const reg = myRegs[t.id];
    if (!reg) return;
    if (!window.confirm(`از «${t.title}» انصراف می‌دهی؟`)) return;
    const { data, error } = await supabase.rpc('cancel_tournament_registration', { p_registration_id: reg.id });
    if (error) return flash('err', '❌ ' + error.message);
    if (data && data.ok === false) return flash('err', '❌ ' + data.error);
    flash('ok', '✅ انصراف ثبت شد');
    load();
  };

  /* شمارش معکوس */
  const countdown = (t) => {
    const target = new Date(t.starts_at || t.created_at).getTime();
    const diff = target - now;
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
          92% { text-shadow: -2px 0 #e879f9, 2px 0 #22d3ee; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #e879f9, -2px 0 #22d3ee; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
        }
      `}</style>

      {/* ─────────── صحنه ─────────── */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-x-0 bottom-0 h-[42vh]"
          style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: 'linear-gradient(rgba(251,191,36,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[130px]" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {notice && (
          <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM, notice.t === 'ok' ? 'border-emerald-400/40' : 'border-red-400/40')}
            >
              {notice.m}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-7xl">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-amber-400/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Tournaments // Arena
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            TOURNAMENT <span className="text-gradient-gold">ARENA</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500">ثبت‌نام کن، بجنگ و جام قهرمانی را ببر — ظرفیت‌ها زنده پر می‌شوند!</p>
        </div>

        {/* فیلترها */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'border px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all',
                CLIP_SM,
                filter === f.id
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ─────────── کارت‌ها ─────────── */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative h-64 overflow-hidden rounded-md bg-white/5">
                <span className="absolute inset-0" style={{ animation: 'shimmer 1.4s infinite', background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.12), transparent)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-14 text-center text-slate-400', CLIP)}>
            <Trophy className="mx-auto mb-3 h-12 w-12 opacity-30" />
            هنوز تورنومنتی در این دسته نیست — به‌زودی!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t, i) => {
              const g = GAMES.find((x) => x.id === t.game_name) || GAMES[6];
              const st = STATUS_META[t.status] || STATUS_META.upcoming;
              const cd = countdown(t);
              const cap = t.max_teams || 16;
              const reg = t.registered_teams || 0;
              const full = reg >= cap;
              const mine = myRegs[t.id];
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -6 }}
                  className={cn('group relative border border-white/10 bg-[#070b18]/85 p-5 backdrop-blur-xl transition-colors hover:border-amber-400/40 hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]', CLIP)}
                >
                  <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-amber-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" style={{ animation: 'scanY 5s linear infinite' }} />

                  {/* سر کارت */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn('grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-br from-amber-400/20 to-fuchsia-500/20 text-2xl', CLIP_SM)}>
                      {g.icon}
                    </div>
                    <span className={cn('border px-2.5 py-1 text-[10px] font-bold', CLIP_SM, st.cls)}>
                      {t.status === 'live' && <Radio size={10} className="mr-1 inline animate-pulse" />}
                      {st.label}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-lg font-bold text-white transition-colors group-hover:text-amber-300">{t.title}</h3>
                  <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs leading-5 text-slate-500">{t.description || 'برای جزئیات بیشتر منتظر بمان!'}</p>

                  {/* متا */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><CalendarClock size={11} className="text-cyan-400/70" /> {new Date(t.starts_at || t.created_at).toLocaleString('fa-IR')}</span>
                    <span className="flex items-center gap-1"><Swords size={11} className="text-fuchsia-400/70" /> {BRACKETS[t.bracket_type] || 'تک‌حذفی'}</span>
                  </div>

                  {/* جایزه */}
                  <div className={cn('mt-3 flex items-center justify-center gap-2 border border-amber-400/25 bg-amber-400/5 py-2', CLIP_SM)}>
                    <Coins size={14} className="text-amber-400" />
                    <span className="font-display text-sm font-black text-amber-300">{Number(t.prize_pool || 0).toLocaleString('fa-IR')} سکه جایزه</span>
                  </div>

                  {/* شمارش معکوس */}
                  {t.status === 'upcoming' && cd && (
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {[
                        { v: cd.d, l: 'روز' },
                        { v: cd.h, l: 'ساعت' },
                        { v: cd.m, l: 'دقیقه' },
                        { v: cd.s, l: 'ثانیه' },
                      ].map((x) => (
                        <div key={x.l} className="border border-cyan-400/20 bg-cyan-400/5 py-1.5 text-center">
                          <p className="font-display text-sm font-black tabular-nums text-cyan-300">{toFa(pad(x.v))}</p>
                          <p className="text-[8px] text-slate-500">{x.l}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* نوار ظرفیت */}
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-500"><Users size={10} /> ظرفیت</span>
                      <span className={cn('font-bold', full ? 'text-red-400' : 'text-cyan-300')}>{toFa(reg)}/{toFa(cap)} تیم</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', full ? 'bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.6)]')}
                        style={{ width: `${Math.min(100, (reg / cap) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* اکشن */}
                  <div className="mt-4">
                    {!user ? (
                      <button onClick={() => navigate('/login')} className={cn('flex w-full items-center justify-center gap-2 border border-cyan-400/40 bg-cyan-400/10 py-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20', CLIP_SM)}>
                        <LogIn size={13} /> برای ثبت‌نام وارد شو
                      </button>
                    ) : mine ? (
                      <div className="flex gap-2">
                        <span className={cn('flex flex-1 items-center justify-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 py-2.5 text-xs font-bold text-emerald-300', CLIP_SM)}>
                          <CheckCircle2 size={13} /> ثبت‌نام شد: {mine.team_name}
                        </span>
                        <button onClick={() => cancel(t)} className={cn('border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-400/20', CLIP_SM)}>
                          انصراف
                        </button>
                      </div>
                    ) : t.status !== 'upcoming' ? (
                      <span className={cn('block border border-white/10 bg-white/5 py-2.5 text-center text-xs font-bold text-slate-500', CLIP_SM)}>
                        {t.status === 'live' ? '🔴 مسابقه در حال برگزاری است' : '🏁 این تورنومنت تمام شده'}
                      </span>
                    ) : full ? (
                      <span className={cn('block border border-red-400/30 bg-red-400/10 py-2.5 text-center text-xs font-bold text-red-400', CLIP_SM)}>
                        ظرفیت تکمیل است
                      </span>
                    ) : (
                      <button
                        onClick={() => setModal(t)}
                        className={cn('flex w-full items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.35)] transition-all hover:shadow-[0_0_36px_rgba(251,191,36,0.55)]', CLIP_SM)}
                      >
                        <UserPlus size={13} /> ثبت‌نام در تورنومنت
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────── مودال ثبت‌نام سینمایی ─────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[15000] grid place-items-center bg-black/55 px-4 backdrop-blur-[3px]"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, rotateX: -80, scale: 0.85, y: 34 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, rotateX: -70, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
              style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
              onClick={(e) => e.stopPropagation()}
              className={cn('relative w-full max-w-md border border-amber-400/40 bg-[#070b18]/95 p-6 shadow-[0_0_70px_rgba(251,191,36,0.3)] backdrop-blur-2xl', CLIP)}
            >
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-amber-400/60" />
              <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.3em] text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" style={{ animation: 'blinkDot 1.2s infinite' }} />
                  Enlist // Tournament
                </p>
                <button onClick={() => setModal(null)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className={cn('grid h-14 w-14 place-items-center bg-gradient-to-br from-amber-400/20 to-fuchsia-500/20 text-3xl', CLIP_SM)}>
                  {(GAMES.find((x) => x.id === modal.game_name) || GAMES[6]).icon}
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-white">{modal.title}</h3>
                  <p className="text-xs text-slate-500">
                    {new Date(modal.starts_at || modal.created_at).toLocaleString('fa-IR')} • {BRACKETS[modal.bracket_type] || 'تک‌حذفی'}
                  </p>
                </div>
              </div>

              <label className="mb-1.5 mt-5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">نام تیم تو</label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="مثلاً: Phoenix Rising"
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-amber-400/50"
              />

              <button
                onClick={register}
                disabled={busy}
                className={cn('mt-4 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_26px_rgba(251,191,36,0.4)] transition-all hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] disabled:opacity-50', CLIP_SM)}
              >
                {busy ? '⏳ در حال ثبت...' : (<><Trophy size={14} /> رزرو جایگاه</>)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}