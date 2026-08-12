import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Trophy, Flame, Target, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const sortOptions = [
  { id: 'xp', label: '⭐ XP', icon: Star },
  { id: 'wins', label: '🏆 بردها', icon: Trophy },
  { id: 'winrate', label: '🎯 درصد برد', icon: Target },
];

const podiumStyle = {
  1: {
    border: 'border-amber-400/60',
    glow: 'shadow-[0_0_60px_rgba(251,191,36,0.3)]',
    grad: 'from-amber-300 to-yellow-600',
    text: 'text-amber-300',
    label: 'قهرمان',
    halo: 'rgba(251,191,36,0.35)',
  },
  2: {
    border: 'border-slate-300/40',
    glow: 'shadow-[0_0_40px_rgba(203,213,225,0.2)]',
    grad: 'from-slate-200 to-slate-500',
    text: 'text-slate-200',
    label: 'نایب‌قهرمان',
    halo: 'rgba(203,213,225,0.3)',
  },
  3: {
    border: 'border-orange-400/40',
    glow: 'shadow-[0_0_40px_rgba(251,146,60,0.2)]',
    grad: 'from-orange-300 to-amber-700',
    text: 'text-orange-300',
    label: 'رتبه سوم',
    halo: 'rgba(251,146,60,0.3)',
  },
};

function Avatar({ p, size = 'h-12 w-12 text-sm' }) {
  return (
    <div className="relative shrink-0">
      <div className={cn('grid place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-bold text-slate-950', size, CLIP_SM)}>
        {p?.username?.slice(0, 2).toUpperCase() || '??'}
      </div>
      <span
        className={cn(
          'absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#070b18]',
          p?.status === 'active' ? 'bg-green-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
        )}
      />
    </div>
  );
}

/* ─────────── Leaderboard v7 — HALL OF FAME ─────────── */
export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('xp');

  const load = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, status, level, xp, wins, losses, draws, matches_played, role, is_owner')
      .is('deleted_at', null)
      .limit(500);
    if (error) console.error('❌ leaderboard:', error.message);
    setPlayers(data || []);
    setLoading(false);
  };

  /* Realtime: لیدربورد زنده */
  useEffect(() => {
    load();
    const ch = supabase
      .channel('lb-profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const winRate = (p) => (p.matches_played > 0 ? Math.round((p.wins / p.matches_played) * 100) : 0);

  const sorted = useMemo(() => {
    const arr = [...players];
    if (sortBy === 'wins') arr.sort((a, b) => b.wins - a.wins || b.xp - a.xp);
    else if (sortBy === 'winrate') arr.sort((a, b) => winRate(b) - winRate(a) || b.xp - a.xp);
    else arr.sort((a, b) => b.level - a.level || b.xp - a.xp);
    return arr;
  }, [players, sortBy]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const myIndex = sorted.findIndex((p) => p.id === user?.id);
  const me = myIndex >= 0 ? sorted[myIndex] : null;

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
              backgroundImage: 'linear-gradient(rgba(251,191,36,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-amber-400/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Ranking // Live
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            HALL OF <span className="text-gradient-gold">FAME</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500">برترین‌های NexusArena — با هر مسابقه، رتبه‌ها زنده جابه‌جا می‌شن!</p>
        </div>

        {/* مرتب‌سازی زاویه‌دار */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={cn(
                'flex items-center gap-2 border px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all',
                CLIP_SM,
                sortBy === opt.id
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
              )}
            >
              <opt.icon size={13} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* رتبه‌ی تو */}
        {me && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('relative mb-8 flex flex-wrap items-center gap-4 border border-fuchsia-400/30 bg-[#070b18]/85 p-4 backdrop-blur-xl', CLIP)}
          >
            <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
            <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />
            <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-fuchsia-500 to-purple-600 font-display text-lg font-black text-white', CLIP_SM)}>
              #{myIndex + 1}
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold text-white">رتبه‌ی تو: {myIndex + 1} از {sorted.length}</p>
              <p className="text-xs text-slate-400">
                سطح {me.level} • {me.xp} XP • {me.wins} برد • درصد برد {winRate(me)}٪
              </p>
            </div>
            <Flame className="h-6 w-6 text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.7)]" />
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative h-20 overflow-hidden rounded-md bg-white/5">
                <span className="absolute inset-0" style={{ animation: 'shimmer 1.4s infinite', background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.12), transparent)' }} />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#070b18]/85 p-12 text-center text-slate-400 backdrop-blur-xl', CLIP)}>
            هنوز بازیکنی ثبت نشده!
          </div>
        ) : (
          <>
            {/* ─────────── سکوی Top 3 ─────────── */}
            <div className="mb-10 grid gap-4 md:grid-cols-3 md:items-end">
              {[top3[1], top3[0], top3[2]].map((p, i) => {
                if (!p) return <div key={i} className="hidden md:block" />;
                const rank = sorted.indexOf(p) + 1;
                const s = podiumStyle[rank];
                const isFirst = rank === 1;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    onClick={() => navigate(`/profile/${p.id}`)}
                    whileHover={{ y: -6 }}
                    className={cn(
                      'relative cursor-pointer border bg-[#070b18]/85 p-6 text-center backdrop-blur-xl transition-colors',
                      CLIP,
                      s.border,
                      s.glow,
                      isFirst && 'md:-translate-y-4 md:p-8'
                    )}
                  >
                    <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-white/30" />
                    <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-white/30" />

                    {isFirst && (
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2"
                      >
                        <Crown className="h-10 w-10 text-amber-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.9)]" />
                      </motion.div>
                    )}

                    <div className="relative mx-auto w-fit">
                      <span className="absolute inset-0 rounded-full blur-[14px]" style={{ background: s.halo }} />
                      <Avatar p={p} size={isFirst ? 'h-20 w-20 text-2xl' : 'h-14 w-14 text-lg'} />
                    </div>

                    <p className="mt-3 truncate font-display text-lg font-bold text-white">
                      {p.username}
                      {p.is_owner && <span className="mr-1 text-amber-400">👑</span>}
                    </p>
                    <p className={cn('text-xs font-bold uppercase tracking-widest', s.text)}>{s.label}</p>

                    <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1"><Star size={12} className={s.text} /> {p.xp} XP</span>
                      <span className="flex items-center gap-1"><Trophy size={12} className={s.text} /> {p.wins}</span>
                    </div>

                    <div className={cn('mx-auto mt-4 grid h-9 w-9 place-items-center bg-gradient-to-br font-display text-sm font-black text-slate-950', s.grad, CLIP_SM)}>
                      {rank}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ─────────── جدول بقیه ─────────── */}
            <div className={cn('relative overflow-hidden border border-cyan-400/25 bg-[#070b18]/85 backdrop-blur-xl', CLIP)}>
              <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-cyan-400/60" />
              <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" style={{ animation: 'scanY 5s linear infinite' }} />

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-right font-display text-[10px] uppercase tracking-[0.25em] text-slate-500">
                      <th className="p-4">#</th>
                      <th className="p-4">بازیکن</th>
                      <th className="p-4">سطح</th>
                      <th className="p-4">XP</th>
                      <th className="p-4">برد</th>
                      <th className="p-4">درصد برد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rest.map((p) => {
                      const rank = sorted.indexOf(p) + 1;
                      const isMe = p.id === user?.id;
                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => navigate(`/profile/${p.id}`)}
                          className={cn(
                            'relative cursor-pointer transition-colors hover:bg-cyan-400/5',
                            isMe && 'bg-fuchsia-500/10'
                          )}
                        >
                          {isMe && <span className="absolute right-0 top-0 h-full w-0.5 bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]" />}
                          <td className="p-4 font-display font-bold text-slate-500">#{rank}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar p={p} size="h-9 w-9 text-xs" />
                              <div>
                                <p className="font-semibold text-white">
                                  {p.username}
                                  {p.is_owner && <span className="mr-1 text-amber-400">👑</span>}
                                  {p.role === 'admin' && !p.is_owner && <span className="mr-1 text-fuchsia-400">🛡</span>}
                                  {isMe && <span className="mr-2 text-[10px] text-fuchsia-300">(تو)</span>}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={cn('inline-block border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300', CLIP_SM)}>
                              Lv {p.level}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-cyan-300">{p.xp}</td>
                          <td className="p-4 text-slate-300">{p.wins}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                                  style={{ width: `${winRate(p)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{winRate(p)}٪</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}