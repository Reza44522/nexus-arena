import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, Flame, Target, Star } from 'lucide-react';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

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
  },
  2: {
    border: 'border-slate-300/40',
    glow: 'shadow-[0_0_40px_rgba(203,213,225,0.2)]',
    grad: 'from-slate-200 to-slate-500',
    text: 'text-slate-200',
    label: 'نایب‌قهرمان',
  },
  3: {
    border: 'border-orange-400/40',
    glow: 'shadow-[0_0_40px_rgba(251,146,60,0.2)]',
    grad: 'from-orange-300 to-amber-700',
    text: 'text-orange-300',
    label: 'رتبه سوم',
  },
};

function Avatar({ p, size = 'h-12 w-12 text-sm' }) {
  return (
    <div className="relative shrink-0">
      <div className={cn('grid place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-bold text-slate-950', size)}>
        {p?.username?.slice(0, 2).toUpperCase() || '??'}
      </div>
      <span
        className={cn(
          'absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0b0b1c]',
          p?.status === 'active' ? 'bg-green-400' : 'bg-slate-600'
        )}
      />
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
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

  // Realtime: با هر تغییر پروفایل (XP/برد) لیدربورد زنده آپدیت می‌شه
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
    <PageWrapper>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          tag="Ranking"
          title="Leaderboard"
          subtitle="برترین‌های NexusArena — با هر مسابقه، رتبه‌ها زنده جابه‌جا می‌شن!"
        />

        {/* مرتب‌سازی */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={cn(
                'rounded-xl px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all',
                sortBy === opt.id
                  ? 'border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                  : 'glass text-slate-400 hover:text-white'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* رتبه‌ی تو */}
        {me && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-fuchsia-500/30 p-4 shadow-[0_0_30px_rgba(217,70,239,0.15)]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 font-display text-lg font-black text-white">
              #{myIndex + 1}
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold text-white">رتبه‌ی تو: {myIndex + 1} از {sorted.length}</p>
              <p className="text-xs text-slate-400">
                سطح {me.level} • {me.xp} XP • {me.wins} برد • درصد برد {winRate(me)}٪
              </p>
            </div>
            <Flame className="h-6 w-6 text-fuchsia-400" />
          </motion.div>
        )}

        {loading ? (
          <div className="grid place-items-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-slate-400">هنوز بازیکنی ثبت نشده!</div>
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
                    className={cn(
                      'glass-strong relative rounded-2xl border p-6 text-center',
                      s.border,
                      s.glow,
                      isFirst && 'md:-translate-y-4 md:p-8'
                    )}
                  >
                    {isFirst && (
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-6 left-1/2 -translate-x-1/2"
                      >
                        <Crown className="h-10 w-10 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                      </motion.div>
                    )}
                    <div className="mx-auto w-fit">
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
                    <div className={cn('mx-auto mt-4 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br font-display text-sm font-black text-slate-950', s.grad)}>
                      {rank}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ─────────── جدول بقیه ─────────── */}
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-right text-xs uppercase tracking-wider text-slate-400">
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
                          className={cn('transition-colors hover:bg-white/5', isMe && 'bg-fuchsia-500/10')}
                        >
                          <td className="p-4 font-display font-bold text-slate-400">#{rank}</td>
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
                            <Badge color="cyan">Lv {p.level}</Badge>
                          </td>
                          <td className="p-4 font-bold text-cyan-300">{p.xp}</td>
                          <td className="p-4 text-slate-300">{p.wins}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
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
            </GlassCard>
          </>
        )}
      </div>
    </PageWrapper>
  );
}