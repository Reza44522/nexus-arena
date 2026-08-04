import { motion } from 'framer-motion';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import Badge from '../components/ui/Badge';
import AparatStream from '../components/stream/AparatStream';
import LiveChat from '../components/stream/LiveChat';
import { formatNumber } from '../utils/format';
import { cn } from '../utils/cn';

const schedule = [
  { id: 1, day: 'Sat', time: '20:00', title: 'Ranked Grind to Diamond', game: 'Cyber Vanguard', accent: 'from-cyan-400 to-blue-500' },
  { id: 2, day: 'Sun', time: '18:00', title: 'Community Game Night', game: 'Quantum Clash', accent: 'from-fuchsia-500 to-purple-500' },
  { id: 3, day: 'Tue', time: '21:00', title: 'Speedrun Attempts', game: 'Shadow Protocol', accent: 'from-emerald-400 to-teal-500' },
  { id: 4, day: 'Thu', time: '20:30', title: 'Tournament Watch Party', game: 'Starfall Odyssey', accent: 'from-amber-400 to-orange-500' },
];

const channels = [
  { id: 1, name: 'NovaStrike', game: 'Cyber Vanguard', viewers: 842, online: true, avatar: 'from-cyan-400 to-blue-500' },
  { id: 2, name: 'LunaByte', game: 'Arcane Realms', viewers: 1291, online: true, avatar: 'from-fuchsia-500 to-purple-600' },
  { id: 3, name: 'IronVeil', game: 'Shadow Protocol', viewers: 0, online: false, avatar: 'from-slate-500 to-slate-700' },
  { id: 4, name: 'ZeroDay', game: 'Quantum Clash', viewers: 567, online: true, avatar: 'from-emerald-400 to-teal-600' },
  { id: 5, name: 'PhantomX', game: 'Neon Drift Racers', viewers: 0, online: false, avatar: 'from-amber-400 to-orange-500' },
  { id: 6, name: 'VortexQueen', game: 'Starfall Odyssey', viewers: 2034, online: true, avatar: 'from-rose-500 to-fuchsia-600' },
];

export default function Stream() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          tag="Aparat Live"
          title="Watch. Chat. Dominate."
          subtitle="Catch the NexusArena crew live on Aparat — or hang out in chat while you wait."
        />

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <AparatStream />
          <LiveChat />
        </div>

        {/* schedule */}
        <section className="mt-16">
          <SectionTitle tag="Schedule" title="Upcoming Streams" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {schedule.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass group rounded-2xl p-5 transition-colors hover:border-fuchsia-400/40"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold uppercase tracking-widest text-fuchsia-300">{s.day}</span>
                  <span className="text-xs text-slate-400">{s.time}</span>
                </div>
                <p className="mt-3 font-display text-base font-bold text-white">{s.title}</p>
                <p className="mt-1 text-xs text-slate-400">{s.game}</p>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className={cn('h-full w-0 bg-gradient-to-r transition-all duration-700 group-hover:w-full', s.accent)} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* other channels */}
        <section className="mt-16">
          <SectionTitle tag="Community" title="Channels You May Like" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass flex items-center gap-4 rounded-2xl p-4 transition-colors hover:border-cyan-400/30"
              >
                <div className={cn('grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br font-display font-black text-slate-950', c.avatar)}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-white">{c.name}</p>
                  <p className="truncate text-xs text-slate-400">{c.game}</p>
                </div>
                {c.online ? <Badge color="red" pulse>{formatNumber(c.viewers)}</Badge> : <Badge color="slate">Offline</Badge>}
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}