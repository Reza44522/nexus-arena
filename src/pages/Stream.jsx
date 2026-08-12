import { motion } from 'framer-motion';
import { Radio, CalendarClock, Users } from 'lucide-react';
import AparatStream from '../components/stream/AparatStream';
import LiveChat from '../components/stream/LiveChat';
import { formatNumber } from '../utils/format';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

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

/* هدر بخش داخلی */
function SectionHead({ tag, title, subtitle }) {
  return (
    <div className="mb-8">
      <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
        {tag}
      </p>
      <h2 className="mt-2 font-display text-2xl font-black tracking-[0.08em] text-white md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

/* ─────────── Stream v7 — BROADCAST DECK ─────────── */
export default function Stream() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(239,68,68,.45); transform: none; }
          92% { text-shadow: -2px 0 #22d3ee, 2px 0 #ef4444; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #22d3ee, -2px 0 #ef4444; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(239,68,68,.45); transform: none; }
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
              backgroundImage: 'linear-gradient(rgba(239,68,68,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-red-500/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="mb-10 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-red-400/80">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" style={{ animation: 'blinkDot 1.2s infinite' }} />
            Aparat Live // On Air
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            BROADCAST <span className="text-gradient">DECK</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            استریم‌های زنده‌ی آرنا را ببین و در چت همراهی کن — یا منتظر بمان و گپ بزن.
          </p>
        </div>

        {/* ─────────── استریم + چت ─────────── */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <AparatStream />
          <LiveChat />
        </div>

        {/* ─────────── زمان‌بندی ─────────── */}
        <section className="mt-16">
          <SectionHead tag="Schedule" title="Upcoming Streams" subtitle="برنامه‌ی پخش هفته‌ی پیش رو" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {schedule.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className={cn('group relative border border-white/10 bg-[#070b18]/80 p-5 backdrop-blur-xl transition-colors hover:border-fuchsia-400/40', CLIP)}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-fuchsia-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-cyan-400/40 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-center justify-between">
                  <span className={cn('border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-widest text-fuchsia-300', CLIP_SM)}>
                    {s.day}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <CalendarClock size={12} className="text-cyan-400/70" /> {s.time}
                  </span>
                </div>
                <p className="mt-3 font-display text-base font-bold text-white transition-colors group-hover:text-fuchsia-300">{s.title}</p>
                <p className="mt-1 text-xs text-slate-400">{s.game}</p>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className={cn('h-full w-0 bg-gradient-to-r shadow-[0_0_12px_rgba(232,121,249,0.5)] transition-all duration-700 group-hover:w-full', s.accent)} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─────────── کانال‌های پیشنهادی ─────────── */}
        <section className="mt-16">
          <SectionHead tag="Community" title="Channels You May Like" subtitle="کانال‌های برتر جامعه‌ی آرنا" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ x: -4 }}
                className={cn('relative flex items-center gap-4 border border-white/10 bg-[#070b18]/80 p-4 backdrop-blur-xl transition-colors hover:border-cyan-400/40', CLIP_SM)}
              >
                <span className={cn('absolute right-0 top-0 h-full w-0.5', c.online ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]' : 'bg-slate-700')} />
                <div className={cn('grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-br font-display font-black text-slate-950', c.avatar, CLIP_SM)}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-white">{c.name}</p>
                  <p className="truncate text-xs text-slate-400">{c.game}</p>
                </div>
                {c.online ? (
                  <span className={cn('flex items-center gap-1.5 border border-red-400/40 bg-red-400/10 px-2.5 py-1 text-[11px] font-bold text-red-300', CLIP_SM)}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                    </span>
                    {formatNumber(c.viewers)}
                  </span>
                ) : (
                  <span className={cn('border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-500', CLIP_SM)}>
                    Offline
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* نوار پایین: آمار زنده */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn('mt-16 flex flex-wrap items-center justify-center gap-8 border border-cyan-400/25 bg-[#070b18]/85 p-5 backdrop-blur-xl', CLIP)}
        >
          {[
            { icon: Radio, label: 'کانال‌های آنلاین', value: '4', color: 'text-red-400' },
            { icon: Users, label: 'بینندگان زنده', value: formatNumber(4734), color: 'text-cyan-300' },
            { icon: CalendarClock, label: 'استریم این هفته', value: '4', color: 'text-fuchsia-300' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <s.icon size={16} className={cn('drop-shadow-[0_0_8px_currentColor]', s.color)} />
              <div>
                <p className="font-display text-lg font-black text-white">{s.value}</p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}