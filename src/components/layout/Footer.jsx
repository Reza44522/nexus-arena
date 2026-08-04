import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const MARQUEE_REPEAT = 3;

const socials = [
  { label: 'X', icon: <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> },
  { label: 'YouTube', icon: <path d="M10 9.5v5l4.5-2.5L10 9.5zM3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill="currentColor" /> },
  { label: 'Twitch', icon: <path d="M5 3h15v11l-4 4h-4l-3 3v-3H5V3zm11 10h2V6h-2v7zm-5 0h2V6h-2v7z" fill="currentColor" /> },
];

function MarqueeHalf({ hidden = false }) {
  return (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {Array.from({ length: MARQUEE_REPEAT }).map((_, i) => (
        <span key={i} className="flex items-center whitespace-nowrap font-display text-2xl font-bold tracking-wide md:text-4xl">
          <span className="footer-name bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
            Created by Reza Pourrafezi Nobarian
          </span>
          <span className="mx-6 text-xl text-cyan-400/70">✦</span>
        </span>
      ))}
    </div>
  );
}

export default function Footer() {
  const scopeRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(trackRef.current, { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });
    }, scopeRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={scopeRef} className="relative mt-24 border-t border-white/10 bg-[#04040c]/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-display text-lg font-black text-slate-950 shadow-glow-cyan">
              N
            </span>
            <span className="font-display text-lg font-bold tracking-[0.2em] text-white">
              NEXUS<span className="text-gradient">ARENA</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-slate-400">
            The next-generation gaming platform. Ranked tournaments, live streams and an unstoppable community.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="glass grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-all hover:border-cyan-400/40 hover:text-cyan-300 hover:shadow-glow-cyan"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">{s.icon}</svg>
              </a>
            ))}
            <span className="glass rounded-xl px-3 py-2 font-display text-[11px] font-bold uppercase tracking-widest text-cyan-300">
              ◉ Aparat
            </span>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-white">Quick Links</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { to: '/', label: 'Home' },
              { to: '/stream', label: 'Live Stream' },
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/login', label: 'Login' },
              { to: '/register', label: 'Register' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="group inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-cyan-300">
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span> {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Community */}
        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-white">Community</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li className="transition-colors hover:text-cyan-300">Discord Server</li>
            <li className="transition-colors hover:text-cyan-300">Forums</li>
            <li className="transition-colors hover:text-cyan-300">Tournaments</li>
            <li className="transition-colors hover:text-cyan-300">Support Center</li>
          </ul>
        </div>
      </div>

      {/* Animated marquee */}
      <div className="overflow-hidden border-t border-white/5 py-6">
        <div ref={trackRef} className="flex w-max">
          <MarqueeHalf />
          <MarqueeHalf hidden />
        </div>
      </div>

      <div className="border-t border-white/5 py-4 text-center font-display text-xs uppercase tracking-[0.3em] text-slate-500">
        © 2026 Nexus Arena — All rights reserved
      </div>
    </footer>
  );
}