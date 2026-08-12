import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, Zap, Plus, Gamepad2, Clock, Swords, Flame, User, TrendingUp, Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const xpForLevel = (level) => level * 100;

const GAME_OPTIONS = [
  { id: 'mafia', name: 'مافیا', icon: '🕵️' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'csgo', name: 'CS:GO', icon: '💣' },
  { id: 'lol', name: 'League of Legends', icon: '⚔️' },
  { id: 'dota2', name: 'Dota 2', icon: '🛡️' },
  { id: 'pubg', name: 'PUBG', icon: '🎯' },
  { id: 'other', name: 'سایر', icon: '🎮' },
];

const RESULT_COLORS = {
  win: 'text-cyan-300 border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_16px_rgba(34,211,238,0.3)]',
  loss: 'text-red-400 border-red-400/50 bg-red-500/10 shadow-[0_0_16px_rgba(239,68,68,0.3)]',
  draw: 'text-yellow-300 border-yellow-400/50 bg-yellow-500/10 shadow-[0_0_16px_rgba(234,179,8,0.3)]',
};
const RESULT_BAR = { win: 'bg-cyan-400', loss: 'bg-red-500', draw: 'bg-yellow-400' };
const RESULT_LABELS = { win: 'پیروزی', loss: 'شکست', draw: 'مساوی' };
const XP_MAP = { win: 50, draw: 20, loss: 10 };

/* ─────────── Dashboard v7 — PLAYER DECK ─────────── */
export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ xp: 0, level: 1, wins: 0, losses: 0, draws: 0, matches_played: 0 });
  const [recentMatches, setRecentMatches] = useState([]);
  const [equipped, setEquipped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ game_name: 'mafia', result: 'win', duration_minutes: 30, notes: '' });

  const xpForNext = xpForLevel(stats.level);
  const progressPercent = Math.min(100, (stats.xp / xpForNext) * 100);

  /* ✅ آیتم‌های فعال کاربر (قاب/تایتل/بج) */
  const loadEquipped = async () => {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('*, item:store_items(*)')
      .eq('user_id', user.id)
      .eq('is_equipped', true);
    if (!error) {
      setEquipped(data || []);
      return;
    }
    const plain = await supabase.from('user_inventory').select('*').eq('user_id', user.id).eq('is_equipped', true);
    const rows = plain.data || [];
    const ids = rows.map((r) => r.item_id).filter(Boolean);
    if (ids.length) {
      const { data: items } = await supabase.from('store_items').select('*').in('id', ids);
      const map = {};
      (items || []).forEach((it) => (map[it.id] = it));
      rows.forEach((r) => (r.item = map[r.item_id]));
    }
    setEquipped(rows);
  };

  useEffect(() => {
    if (!user?.id) return;
    if (profile) {
      setStats({
        xp: profile.xp ?? 0,
        level: profile.level ?? 1,
        wins: profile.wins ?? 0,
        losses: profile.losses ?? 0,
        draws: profile.draws ?? 0,
        matches_played: profile.matches_played ?? 0,
      });
    }
    loadRecentMatches();
    loadEquipped();
    // eslint-disable-next-line
  }, [profile, user?.id]);

  const loadRecentMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setRecentMatches(data || []);
    } catch (err) {
      console.error('❌ خطا در دریافت matchها:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    try {
      const xp = XP_MAP[form.result] || 0;
      const { error } = await supabase.from('matches').insert({
        user_id: user.id,
        game_name: form.game_name,
        result: form.result,
        xp_gained: xp,
        duration_minutes: Number(form.duration_minutes) || 0,
        notes: form.notes.trim(),
      });
      if (error) throw error;
      setSuccessMsg(`✅ ثبت شد! +${xp} XP دریافتی`);
      const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (updatedProfile) {
        setStats({
          xp: updatedProfile.xp, level: updatedProfile.level,
          wins: updatedProfile.wins, losses: updatedProfile.losses,
          draws: updatedProfile.draws, matches_played: updatedProfile.matches_played,
        });
      }
      await loadRecentMatches();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('❌ خطا: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const equippedFrame = equipped.find((v) => v.item?.type === 'frame');
  const equippedTitle = equipped.find((v) => v.item?.type === 'title');
  const equippedBadge = equipped.find((v) => v.item?.type === 'badge');

  /* رینگ SVG */
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
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
              backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
              Player Deck // {profile?.username || user.email}
            </p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-[0.06em] text-white md:text-4xl" style={{ textShadow: '0 0 30px rgba(34,211,238,.4)' }}>
              داشبورد <span className="text-gradient">بازیکن</span> 👋
            </h1>
          </div>
          <Link
            to={`/profile/${user.id}`}
            className={cn('flex items-center gap-2 border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20 hover:shadow-[0_0_18px_rgba(34,211,238,0.3)]', CLIP_SM)}
          >
            <User size={14} /> پروفایل من
          </Link>
        </div>

        {/* ─────────── پروفایل + رینگ سطح ─────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* کارت پروفایل */}
          <div className={cn('relative border border-fuchsia-400/25 bg-[#070b18]/85 p-5 backdrop-blur-xl lg:col-span-2', CLIP)}>
            <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
            <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />
            <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" style={{ animation: 'scanY 4.5s linear infinite' }} />

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <span className="absolute inset-0 rounded-xl bg-cyan-400/25 blur-[10px]" />
                <div
                  className={cn(
                    'relative grid h-16 w-16 place-items-center bg-gradient-to-br text-xl font-black text-slate-950',
                    CLIP_SM,
                    equippedFrame ? equippedFrame.item.accent : 'from-cyan-400 to-fuchsia-500'
                  )}
                >
                  {(profile?.username || user.email || '?').slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-white">
                  {profile?.username || user.email}
                  {equippedBadge && (
                    <span className="mr-2 align-middle" title={equippedBadge.item.name}>{equippedBadge.item.icon}</span>
                  )}
                </p>
                {equippedTitle ? (
                  <span className={cn('inline-block rounded-md bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold text-slate-950', equippedTitle.item.accent)}>
                    {equippedTitle.item.icon} {equippedTitle.item.name.replace('تایتل: ', '')}
                  </span>
                ) : (
                  <p className="text-xs text-slate-500">هنوز تایتلی نداری — از فروشگاه بخر! 🛒</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { v: stats.wins, l: 'برد', c: 'text-emerald-400' },
                  { v: stats.losses, l: 'باخت', c: 'text-red-400' },
                  { v: stats.draws, l: 'مساوی', c: 'text-yellow-300' },
                ].map((x) => (
                  <div key={x.l} className="border border-white/10 bg-white/5 px-3 py-2" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                    <p className={cn('font-display text-lg font-black', x.c)}>{x.v}</p>
                    <p className="text-[9px] text-slate-500">{x.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* کارت رینگ سطح */}
          <div className={cn('relative flex items-center gap-5 border border-cyan-400/25 bg-[#070b18]/85 p-5 backdrop-blur-xl', CLIP)}>
            <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-cyan-400/60" />
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90 drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]">
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r={R} fill="none"
                  stroke="url(#nxGrad)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={C}
                  initial={{ strokeDashoffset: C }}
                  animate={{ strokeDashoffset: C - (C * progressPercent) / 100 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="nxGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#e879f9" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="font-display text-3xl font-black text-white">{stats.level}</p>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-slate-500">Level</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Award size={15} className="text-cyan-300" />
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-slate-400">پیشرفت سطح</p>
              </div>
              <p className="mt-2 font-display text-xl font-black text-fuchsia-300">
                {stats.xp} <span className="text-xs text-slate-500">/ {xpForNext} XP</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-500">{Math.max(0, Math.floor(xpForNext - stats.xp))} XP تا سطح بعدی</p>
            </div>
          </div>
        </div>

        {/* ─────────── چیپ‌های آمار ─────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'کل مسابقات', value: stats.matches_played, icon: Gamepad2, c: 'text-cyan-300', g: 'rgba(34,211,238,.35)' },
            { label: 'پیروزی‌ها', value: stats.wins, icon: Trophy, c: 'text-emerald-400', g: 'rgba(52,211,153,.35)' },
            { label: 'شکست‌ها', value: stats.losses, icon: Swords, c: 'text-red-400', g: 'rgba(248,113,113,.35)' },
            { label: 'مساوی', value: stats.draws, icon: Target, c: 'text-yellow-300', g: 'rgba(250,204,21,.35)' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className={cn('group relative border border-white/10 bg-[#070b18]/80 p-4 backdrop-blur-xl transition-colors hover:border-white/25', CLIP_SM)}
            >
              <div className="flex items-center justify-between">
                <item.icon className={cn('h-5 w-5 drop-shadow-[0_0_8px_var(--tw-shadow-color)]', item.c)} style={{ ['--tw-shadow-color']: item.g }} />
                <span className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</span>
              </div>
              <p className="mt-2 font-display text-2xl font-black text-white">{item.value}</p>
            </motion.div>
          ))}
        </div>

        {/* ─────────── فرم + لاگ نبرد ─────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* فرم ثبت مسابقه — MISSION LOG */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('relative border border-fuchsia-400/25 bg-[#070b18]/85 p-6 backdrop-blur-xl', CLIP)}
          >
            <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
            <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
              <Flame className="h-5 w-5 text-fuchsia-400" />
              <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-white">Mission Log — ثبت مسابقه</h2>
            </div>

            <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">🎮 بازی</label>
            <select
              value={form.game_name}
              onChange={(e) => setForm({ ...form, game_name: e.target.value })}
              className="mb-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/50"
            >
              {GAME_OPTIONS.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900">{g.icon} {g.name}</option>
              ))}
            </select>

            <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">🏆 نتیجه</label>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {['win', 'draw', 'loss'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, result: r })}
                  className={cn(
                    'border py-2.5 text-xs font-bold transition-all',
                    CLIP_SM,
                    form.result === r ? RESULT_COLORS[r] : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                  )}
                >
                  {RESULT_LABELS[r]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">⏱ مدت (دقیقه)</label>
                <input
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/50"
                />
              </div>
              <div className={cn('flex items-center justify-center gap-2 border border-fuchsia-400/30 bg-fuchsia-500/10', CLIP_SM)}>
                <Zap className="h-4 w-4 text-fuchsia-300" />
                <span className="text-xs font-bold text-fuchsia-300">+{XP_MAP[form.result]} XP</span>
              </div>
            </div>

            <label className="mb-1.5 mt-4 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">📝 یادداشت (اختیاری)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="مثلاً: یه بازی سخته بود..."
              className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-fuchsia-400/50"
            />

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting}
              className={cn(
                'mt-4 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-3 font-display text-xs font-black uppercase tracking-[0.3em] text-slate-950 shadow-[0_0_26px_rgba(232,121,249,0.35)] transition-all hover:shadow-[0_0_40px_rgba(232,121,249,0.55)] disabled:opacity-50',
                CLIP_SM
              )}
            >
              {submitting ? '⏳ در حال ثبت...' : (<><Plus className="h-4 w-4" /> ثبت مسابقه</>)}
            </motion.button>

            <AnimatePresence>
              {successMsg && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-center text-xs font-bold text-cyan-300"
                >
                  {successMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>

          {/* لیست مسابقات — BATTLE LOG */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn('relative border border-cyan-400/25 bg-[#070b18]/85 p-6 backdrop-blur-xl', CLIP)}
          >
            <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-cyan-400/60" />
            <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
              <TrendingUp className="h-5 w-5 text-cyan-300" />
              <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-white">Battle Log — ۱۰ مسابقه اخیر</h2>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative h-16 overflow-hidden rounded-md bg-white/5">
                    <span
                      className="absolute inset-0"
                      style={{ animation: 'shimmer 1.4s infinite', background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.12), transparent)' }}
                    />
                  </div>
                ))}
              </div>
            ) : recentMatches.length === 0 ? (
              <div className="py-14 text-center text-sm text-slate-500">
                <Clock className="mx-auto mb-2 h-10 w-10 opacity-30" />
                هنوز مسابقه‌ای ثبت نکردی!
              </div>
            ) : (
              <div className="chat-scroll max-h-[430px] space-y-2 overflow-y-auto pl-2">
                {recentMatches.map((m, i) => {
                  const game = GAME_OPTIONS.find((g) => g.id === m.game_name);
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ x: -4 }}
                      className={cn('relative flex items-center justify-between border border-white/10 bg-white/5 p-3 pr-4', CLIP_SM)}
                    >
                      <span className={cn('absolute right-0 top-0 h-full w-0.5', RESULT_BAR[m.result])} />
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{game?.icon || '🎮'}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{game?.name || m.game_name}</p>
                          <p className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="h-3 w-3" /> {m.duration_minutes} دقیقه
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={cn('text-xs font-black', m.result === 'win' ? 'text-cyan-300' : m.result === 'loss' ? 'text-red-400' : 'text-yellow-300')}>
                          {RESULT_LABELS[m.result]}
                        </p>
                        <p className="text-[10px] text-fuchsia-300">+{m.xp_gained} XP</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}