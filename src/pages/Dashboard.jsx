import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/ui/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import NeonButton from '../components/ui/NeonButton';
import { achievements, friends, recentMatches, weeklyActivity } from '../data/dashboard';
import { cn } from '../utils/cn';

const listV = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const itemV = { hidden: { opacity: 0, x: -18 }, show: { opacity: 1, x: 0, transition: { duration: 0.4 } } };

const dotColor = { online: 'bg-emerald-400', ingame: 'bg-cyan-400', offline: 'bg-slate-600' };
const rarityColor = {
  Common: 'bg-slate-400/15 text-slate-300',
  Rare: 'bg-cyan-400/15 text-cyan-300',
  Epic: 'bg-fuchsia-400/15 text-fuchsia-300',
  Legendary: 'bg-amber-400/15 text-amber-300',
  Mythic: 'bg-rose-400/15 text-rose-300',
};

function CardHeader({ title, action }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">{title}</h2>
      {action && <span className="text-xs text-cyan-300/80">{action}</span>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.name || 'Player';
  const maxHours = Math.max(...weeklyActivity.map((d) => d.hours));
  const onlineCount = friends.filter((f) => f.status !== 'offline').length;

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        {/* ---------- header ---------- */}
        <GlassCard className="relative overflow-hidden p-6 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-display text-3xl font-black text-slate-950 shadow-glow-cyan">
                  {name[0]?.toUpperCase()}
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/40 bg-[#0a0a1a] px-2 py-0.5 font-display text-[10px] font-bold text-cyan-300">
                  LVL 42
                </span>
              </div>
              <div>
                <p className="font-display text-xs uppercase tracking-[0.3em] text-cyan-300">Welcome back</p>
                <h1 className="mt-1 font-display text-2xl font-black text-white md:text-3xl">{name.toUpperCase()}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge color="cyan">💎 Diamond II</Badge>
                  <Badge color="magenta">Season 12</Badge>
                </div>
              </div>
            </div>
            <div className="w-full md:w-80">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-400">XP Progress</span>
                <span className="font-semibold text-cyan-300">12,450 / 18,000</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '69%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 shadow-[0_0_16px_rgba(34,211,238,0.6)]"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">5,550 XP to Level 43</p>
            </div>
          </div>
        </GlassCard>

        {/* ---------- stats ---------- */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="🏆" label="Total Wins" value={347} accent="from-amber-400 to-orange-500" />
          <StatCard icon="🎯" label="K/D Ratio" value={2.8} decimals={1} accent="from-cyan-400 to-blue-500" delay={0.08} />
          <StatCard icon="⏱️" label="Hours Played" value={512} suffix="h" accent="from-fuchsia-500 to-purple-500" delay={0.16} />
          <StatCard icon="🎖️" label="Trophies" value={89} accent="from-emerald-400 to-teal-500" delay={0.24} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ---------- recent matches ---------- */}
          <GlassCard className="p-6 lg:col-span-2">
            <CardHeader title="Recent Matches" action="View all →" />
            <motion.ul variants={listV} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="space-y-3">
              {recentMatches.map((m) => (
                <motion.li
                  key={m.id}
                  variants={itemV}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:border-cyan-400/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <Badge color={m.result === 'WIN' ? 'green' : 'red'}>{m.result}</Badge>
                    <div>
                      <p className="text-sm font-semibold text-white">{m.game}</p>
                      <p className="text-[11px] text-slate-500">{m.mode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-400">
                    <span>K/D <b className="text-white">{m.kd}</b></span>
                    <span className="text-cyan-300">+{m.xp} XP</span>
                    <span className="hidden text-slate-500 sm:inline">{m.when}</span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </GlassCard>

          {/* ---------- friends ---------- */}
          <GlassCard className="p-6">
            <CardHeader title="Friends" action={`${onlineCount} online`} />
            <ul className="space-y-3">
              {friends.map((f, i) => (
                <motion.li
                  key={f.id}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="relative">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white">
                      {f.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0b0b1c]', dotColor[f.status])} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{f.name}</p>
                    <p className="truncate text-[11px] text-slate-500">{f.activity}</p>
                  </div>
                  <NeonButton size="sm" variant="ghost" disabled={f.status === 'offline'}>Invite</NeonButton>
                </motion.li>
              ))}
            </ul>
          </GlassCard>

          {/* ---------- achievements ---------- */}
          <GlassCard className="p-6 lg:col-span-2">
            <CardHeader title="Achievements" action="4 / 6 unlocked" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'rounded-xl border p-4 transition-colors',
                    a.unlocked ? 'border-white/10 bg-white/[0.04] hover:border-cyan-400/30' : 'border-white/5 bg-white/[0.02] opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{a.icon}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', rarityColor[a.rarity])}>
                      {a.rarity}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-sm font-bold text-white">{a.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{a.desc}</p>
                  {!a.unlocked && <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-600">🔒 Locked</p>}
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* ---------- weekly activity ---------- */}
          <GlassCard className="p-6">
            <CardHeader title="Weekly Activity" action="22.2h total" />
            <div className="flex h-40 items-stretch gap-2">
              {weeklyActivity.map((d, i) => (
                <div key={d.day} className="flex flex-1 flex-col justify-end gap-2">
                  <div className="flex flex-1 items-end">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                      style={{ height: `${(d.hours / maxHours) * 100}%`, transformOrigin: 'bottom' }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500/60 to-fuchsia-500/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    />
                  </div>
                  <span className="text-center text-[10px] uppercase text-slate-500">{d.day}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}