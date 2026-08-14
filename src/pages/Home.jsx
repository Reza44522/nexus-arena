import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Star, Users, Download, Zap, Shield, Trophy, Cloud, Radio } from 'lucide-react';
import DateTimeBadge from '../components/ui/DateTimeBadge';
import CountUp from '../components/ui/CountUp';
import EarthGlobe from '../components/home/EarthGlobe';
import { games } from '../data/games';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const stats = [
  { label: 'Active Players', value: 2.4, suffix: 'M+', decimals: 1 },
  { label: 'Tournaments', value: 1200, suffix: '+' },
  { label: 'Prize Pool', value: 8, suffix: 'M$' },
];

const features = [
  { icon: Zap, title: 'Ultra-Low Latency', desc: 'Sub-10ms servers across the region keep every frame razor sharp.', accent: 'from-cyan-400 to-blue-500' },
  { icon: Shield, title: 'Anti-Cheat Shield', desc: 'AI-powered defense keeps every match fair and clean.', accent: 'from-emerald-400 to-teal-500' },
  { icon: Trophy, title: 'Ranked Tournaments', desc: 'Weekly cups with real prize pools and global leaderboards.', accent: 'from-fuchsia-500 to-purple-500' },
  { icon: Cloud, title: 'Cloud Saves', desc: 'Your progress, settings and loadouts — synced everywhere.', accent: 'from-amber-400 to-orange-500' },
];

const STATUS_CLS = {
  'زنده': 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  'بتا': 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
  'به‌زودی': 'border-amber-400/40 bg-amber-400/10 text-amber-300',
};

const marqueeItems = games.map((g) => g.title.toUpperCase());

function Chars({ text, className }) {
  return (
    <span className={className}>
      {text.split('').map((ch, i) => (
        <span key={i} className="hero-char inline-block">
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

/* هدر بخش داخلی */
function SectionHead({ tag, title, subtitle, color = 'text-cyan-400/70', dot = 'bg-cyan-400' }) {
  return (
    <div className="mb-10 text-center">
      <p className={cn('flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em]', color)}>
        <span className={cn('h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]', dot)} style={{ animation: 'blinkDot 1.6s infinite' }} />
        {tag}
      </p>
      <h2 className="mt-2 font-display text-2xl font-black tracking-[0.08em] text-white md:text-4xl" style={{ textShadow: '0 0 30px rgba(34,211,238,.35)' }}>
        {title}
      </h2>
      {subtitle && <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400/70" />
        <span className="h-1.5 w-1.5 rotate-45 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-fuchsia-400/70" />
      </div>
    </div>
  );
}

/* ─────────── Home v7 — FLAGSHIP ─────────── */
export default function Home() {
  const heroRef = useRef(null);
  const navigate = useNavigate();

  /* GSAP hero intro timeline */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-tag', { y: 20, opacity: 0, duration: 0.5 })
        .from('.hero-char', { y: 70, opacity: 0, rotateX: 45, stagger: 0.03, duration: 0.7, clearProps: 'all' }, '-=0.2')
        .from('.hero-sub', { y: 20, opacity: 0, duration: 0.6 }, '-=0.35')
        .from('.hero-cta', { y: 16, opacity: 0, stagger: 0.12, duration: 0.5 }, '-=0.3')
        .from('.hero-stat', { y: 16, opacity: 0, stagger: 0.1, duration: 0.45 }, '-=0.25')
        .from('.hero-visual', { scale: 0.85, opacity: 0, duration: 1.1, ease: 'expo.out' }, 0.3);
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
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
          className="absolute inset-x-0 bottom-0 h-[46vh]"
          style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cyan-400/15 to-transparent" />
        </div>
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      {/* ─────────── HERO ─────────── */}
      <section ref={heroRef} className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <DateTimeBadge />
          <span className="hero-tag mt-4 inline-flex items-center gap-2 border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Season 12 is live
          </span>

          <h1 className="mt-6 font-display font-black leading-[1.05] text-white">
            <Chars text="ENTER THE" className="block text-4xl sm:text-6xl" />
            <Chars text="NEXUS ARENA" className="text-gradient block text-4xl drop-shadow-[0_0_35px_rgba(34,211,238,0.45)] sm:text-6xl xl:text-7xl" />
          </h1>

          <p className="hero-sub mt-6 max-w-lg text-lg text-slate-400">
            A next-generation gaming platform — ranked tournaments, live streams and an unstoppable community. Plug in. Level up.
          </p>
          <p className="hero-sub mt-2 max-w-lg text-sm leading-7 text-slate-500">
            وارد آرنا شو — جایی که قهرمان‌ها ساخته می‌شوند. 🎮
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/register')}
              className={cn('hero-cta bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_45px_rgba(34,211,238,0.6)]', CLIP_SM)}
            >
              ▶ Start Playing
            </button>
            <button
              onClick={() => navigate('/stream')}
              className={cn('hero-cta border border-white/15 bg-white/5 px-7 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-200 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200', CLIP_SM)}
            >
              Watch Live
            </button>
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className={cn('hero-stat border border-white/10 bg-[#070b18]/70 p-3 text-center backdrop-blur-xl', CLIP_SM)}>
                <p className="font-display text-xl font-bold text-white drop-shadow-[0_0_18px_rgba(34,211,238,0.35)] sm:text-2xl">
                  <CountUp value={s.value} decimals={s.decimals || 0} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual — هولولوگرافیک */}
        <div className="hero-visual relative mx-auto w-full max-w-md">
          <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="relative">
            {/* حلقه کانیک چرخان */}
            <div
              className="absolute -inset-10 rounded-full opacity-60"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,.5) 60deg, transparent 120deg, transparent 180deg, rgba(232,121,249,.5) 240deg, transparent 300deg)',
                maskImage: 'radial-gradient(circle, transparent 55%, black 57%, black 70%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 55%, black 57%, black 70%, transparent 72%)',
                animation: 'spin 9s linear infinite',
              }}
            />
            <div className="absolute -inset-8 animate-[spin_30s_linear_infinite] rounded-full border border-dashed border-cyan-400/20" />

            <div className={cn('relative border border-cyan-400/30 bg-[#070b18]/90 p-5 shadow-[0_0_80px_rgba(34,211,238,0.2)] backdrop-blur-2xl', CLIP)}>
              {/* نوار HUD */}
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 font-display text-[8px] uppercase tracking-[0.3em] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" style={{ animation: 'blinkDot 1.2s infinite' }} />
                  Live Match // CV-07
                </span>
                <span>4K • 144FPS</span>
              </div>

              {/* خط اسکن */}
              <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" style={{ animation: 'scanY 4s linear infinite' }} />

              <div className="relative grid h-56 place-items-center overflow-hidden border border-white/10 bg-gradient-to-br from-cyan-500/25 via-transparent to-fuchsia-500/25 sm:h-72">
                <div className="scanlines pointer-events-none absolute inset-0 opacity-[0.06]" />
                <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
                <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/60" />
                <span className="animate-pulse text-7xl drop-shadow-[0_0_35px_rgba(34,211,238,0.7)] sm:text-8xl">🕹️</span>
              </div>

              <div className={cn('mt-4 flex items-center justify-between border border-white/10 bg-white/5 px-4 py-3', CLIP_SM)}>
                <div>
                  <p className="font-display text-xs font-bold text-white">CYBER VANGUARD</p>
                  <p className="text-[11px] text-slate-400">Ranked • Grand Finals</p>
                </div>
                <span className={cn('flex items-center gap-1.5 border border-red-400/40 bg-red-400/10 px-2.5 py-1 text-[10px] font-bold text-red-300', CLIP_SM)}>
                  <Radio size={10} className="animate-pulse" /> LIVE
                </span>
              </div>
            </div>

            {/* چیپ‌های شناور */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className={cn('absolute -left-6 top-10 border border-cyan-400/30 bg-[#070b18]/90 px-3 py-2 text-xs text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.3)] backdrop-blur', CLIP_SM)}>
              ⚡ +250 XP
            </motion.div>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className={cn('absolute -right-4 bottom-16 border border-amber-400/30 bg-[#070b18]/90 px-3 py-2 text-xs text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.3)] backdrop-blur', CLIP_SM)}>
              🏆 Rank Up!
            </motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className={cn('absolute -bottom-6 left-8 border border-emerald-400/30 bg-[#070b18]/90 px-3 py-2 text-xs text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.3)] backdrop-blur', CLIP_SM)}>
              🛡️ Anti-Cheat Active
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─────────── Marquee با لبه‌های محو ─────────── */}
      <div className="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-4 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex w-max gap-8">
          {[...marqueeItems, ...marqueeItems].map((t, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap font-display text-sm uppercase tracking-[0.35em] text-slate-400">
              {t} <span className="text-cyan-400">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─────────── بازی‌های ویژه — کارت‌های اختصاصی ─────────── */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHead tag="Featured" title="TRENDING IN THE ARENA" subtitle="Hand-picked AAA titles the community can't stop playing." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.slice(0, 6).map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className={cn('group relative border border-white/10 bg-[#070b18]/85 backdrop-blur-xl transition-colors hover:border-cyan-400/40 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]', CLIP)}
            >
              <span className="pointer-events-none absolute left-2 top-2 z-10 h-4 w-4 border-l-2 border-t-2 border-cyan-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="pointer-events-none absolute bottom-2 right-2 z-10 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/40 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className={cn('relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br', g.gradient)}>
                <span className="text-6xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125">{g.icon}</span>
                <span className={cn('absolute right-3 top-3 border px-2 py-0.5 text-[10px] font-bold', CLIP_SM, STATUS_CLS[g.status] || STATUS_CLS['بتا'])}>
                  {g.status}
                </span>
                <div className="scanlines absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_45%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-cyan-300">{g.title}</h3>
                    <p className="text-xs text-slate-400">{g.genre}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                    <Star size={13} /> {g.rating}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users size={13} className="text-cyan-400/70" /> {(g.players / 1000).toFixed(0)}K بازیکن
                  </span>
                  <button className={cn('flex items-center gap-1.5 border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]', CLIP_SM)}>
                    <Download size={13} /> نصب بازی
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─────────── کره زمین ─────────── */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHead tag="Global" title="کره‌ی زمین NexusArena" subtitle="جامعه‌ی ما مرز نمی‌شناسه — کره رو بچرخون، زوم کن و شهرهای جهان رو ببین!" color="text-fuchsia-400/70" dot="bg-fuchsia-400" />
        <EarthGlobe />
      </section>

      {/* ─────────── ویژگی‌ها ─────────── */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHead tag="Why Nexus" title="BUILT FOR CHAMPIONS" subtitle="Every system engineered for competitive perfection." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className={cn('group relative border border-white/10 bg-[#070b18]/85 p-6 backdrop-blur-xl transition-colors hover:border-cyan-400/40', CLIP)}
            >
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="pointer-events-none absolute left-3 top-3 font-display text-[10px] font-black text-slate-600">۰{i + 1}</span>
              <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br shadow-lg', f.accent, CLIP_SM)}>
                <f.icon className="h-5 w-5 text-slate-950" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─────────── CTA با حاشیه کانیک چرخان ─────────── */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden p-[1.5px]"
        >
          <div className="absolute inset-[-200%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#22d3ee_80deg,transparent_160deg,#e879f9_240deg,transparent_320deg)]" />
          <div className={cn('relative bg-[#070b18]/95 p-10 text-center backdrop-blur-2xl md:p-16', CLIP)}>
            <div className="scanlines pointer-events-none absolute inset-0 opacity-[0.05]" />
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[100px]" />

            <h2 className="font-display text-3xl font-black text-white md:text-5xl" style={{ animation: 'glitch 5s infinite' }}>
              READY TO <span className="text-gradient">DOMINATE</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Join millions of players competing in ranked ladders, live tournaments and community events — every single day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className={cn('bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_45px_rgba(34,211,238,0.6)]', CLIP_SM)}
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate('/stream')}
                className={cn('border border-white/15 bg-white/5 px-7 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-200 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200', CLIP_SM)}
              >
                Explore Streams
              </button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}