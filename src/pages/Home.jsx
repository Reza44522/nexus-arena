import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import PageWrapper from '../components/ui/PageWrapper';
import NeonButton from '../components/ui/NeonButton';
import SectionTitle from '../components/ui/SectionTitle';
import Badge from '../components/ui/Badge';
import CountUp from '../components/ui/CountUp';
import GameCard from '../components/games/GameCard';
import { games } from '../data/games';

const stats = [
  { label: 'Active Players', value: 2.4, suffix: 'M+', decimals: 1 },
  { label: 'Tournaments', value: 1200, suffix: '+' },
  { label: 'Prize Pool', value: 8, suffix: 'M$' },
];

const features = [
  { icon: '⚡', title: 'Ultra-Low Latency', desc: 'Sub-10ms servers across the region keep every frame razor sharp.', accent: 'from-cyan-400 to-blue-500' },
  { icon: '🛡️', title: 'Anti-Cheat Shield', desc: 'AI-powered defense keeps every match fair and clean.', accent: 'from-emerald-400 to-teal-500' },
  { icon: '🏆', title: 'Ranked Tournaments', desc: 'Weekly cups with real prize pools and global leaderboards.', accent: 'from-fuchsia-500 to-purple-500' },
  { icon: '☁️', title: 'Cloud Saves', desc: 'Your progress, settings and loadouts — synced everywhere.', accent: 'from-amber-400 to-orange-500' },
];

const marqueeItems = games.map((g) => g.title.toUpperCase());

function Chars({ text, className }) {
  return (
    <span className={className}>
      {text.split('').map((ch, i) => (
        <span key={i} className="hero-char inline-block will-change-transform">
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const navigate = useNavigate();

  /* GSAP hero intro timeline */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-tag', { y: 20, opacity: 0, duration: 0.5 })
        .from('.hero-char', { y: 70, opacity: 0, rotateX: 45, stagger: 0.03, duration: 0.7 }, '-=0.2')
        .from('.hero-sub', { y: 20, opacity: 0, duration: 0.6 }, '-=0.35')
        .from('.hero-cta', { y: 16, opacity: 0, stagger: 0.12, duration: 0.5 }, '-=0.3')
        .from('.hero-stat', { y: 16, opacity: 0, stagger: 0.1, duration: 0.45 }, '-=0.25')
        .from('.hero-visual', { scale: 0.85, opacity: 0, duration: 1.1, ease: 'expo.out' }, 0.3);
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <PageWrapper>
      {/* ---------- HERO ---------- */}
      <section ref={heroRef} className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <span className="hero-tag inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-cyan-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Season 12 is live
          </span>

          <h1 className="mt-6 font-display font-black leading-[1.05] text-white">
            <Chars text="ENTER THE" className="block text-4xl sm:text-6xl" />
            <Chars text="NEXUS ARENA" className="text-gradient block text-4xl sm:text-6xl xl:text-7xl" />
          </h1>

          <p className="hero-sub mt-6 max-w-lg text-lg text-slate-400">
            A next-generation gaming platform — ranked tournaments, live streams and an unstoppable community. Plug in. Level up.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <NeonButton className="hero-cta" size="lg" onClick={() => navigate('/register')}>
              ▶ Start Playing
            </NeonButton>
            <NeonButton className="hero-cta" size="lg" variant="ghost" onClick={() => navigate('/stream')}>
              Watch Live
            </NeonButton>
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                  <CountUp value={s.value} decimals={s.decimals || 0} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="hero-visual relative mx-auto w-full max-w-md">
          <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="relative">
            <div className="animate-spin-slow absolute -inset-8 rounded-full border border-dashed border-cyan-400/20" />
            <div className="glass-strong relative rounded-3xl p-6 shadow-[0_0_80px_rgba(34,211,238,0.18)]">
              <div className="grid h-56 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/25 via-transparent to-fuchsia-500/25 sm:h-72">
                <span className="text-7xl drop-shadow-[0_0_35px_rgba(34,211,238,0.7)] sm:text-8xl">🕹️</span>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl glass px-4 py-3">
                <div>
                  <p className="font-display text-xs font-bold text-white">CYBER VANGUARD</p>
                  <p className="text-[11px] text-slate-400">Ranked • Grand Finals</p>
                </div>
                <Badge color="red" pulse>LIVE</Badge>
              </div>
            </div>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="glass absolute -left-6 top-10 rounded-xl px-3 py-2 text-xs text-white shadow-lg">
              ⚡ +250 XP
            </motion.div>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="glass absolute -right-4 bottom-16 rounded-xl px-3 py-2 text-xs text-white shadow-lg">
              🏆 Rank Up!
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Marquee strip ---------- */}
      <div className="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-4">
        <div className="animate-marquee flex w-max gap-8">
          {[...marqueeItems, ...marqueeItems].map((t, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap font-display text-sm uppercase tracking-[0.35em] text-slate-400">
              {t} <span className="text-cyan-400">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---------- Featured games ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle center tag="Featured" title="Trending in the Arena" subtitle="Hand-picked AAA titles the community can't stop playing." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <GameCard key={g.id} game={g} index={i} />
          ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle center tag="Why Nexus" title="Built for Champions" subtitle="Every system engineered for competitive perfection." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="glass group rounded-2xl p-6 transition-colors hover:border-cyan-400/30"
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-xl shadow-lg ${f.accent}`}>
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-violet-500/10 p-10 text-center md:p-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[100px]" />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl font-black text-white md:text-5xl"
          >
            READY TO <span className="text-gradient">DOMINATE</span>?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-xl text-slate-300"
          >
            Join millions of players competing in ranked ladders, live tournaments and community events — every single day.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <NeonButton size="lg" onClick={() => navigate('/register')}>Create Free Account</NeonButton>
            <NeonButton size="lg" variant="ghost" onClick={() => navigate('/stream')}>Explore Streams</NeonButton>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  );
}