import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import DateTimeBadge from '../ui/DateTimeBadge';
import gsap from 'gsap';

const MARQUEE_REPEAT = 3;

const socials = [
  {
    label: 'X',
    hover: 'hover:border-white/40 hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.25)]',
    icon: <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
  {
    label: 'YouTube',
    hover: 'hover:border-red-400/50 hover:text-red-400 hover:shadow-[0_0_18px_rgba(248,113,113,0.35)]',
    icon: <path d="M10 9.5v5l4.5-2.5L10 9.5zM3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill="currentColor" />,
  },
  {
    label: 'Twitch',
    hover: 'hover:border-purple-400/50 hover:text-purple-400 hover:shadow-[0_0_18px_rgba(168,85,247,0.35)]',
    icon: <path d="M5 3h15v11l-4 4h-4l-3 3v-3H5V3zm11 10h2V6h-2v7zm-5 0h2V6h-2v7z" fill="currentColor" />,
  },
];

function MarqueeHalf({ hidden = false }) {
  return (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {Array.from({ length: MARQUEE_REPEAT }).map((_, i) => (
        <span key={i} className="flex items-center whitespace-nowrap font-display text-2xl font-bold tracking-wide md:text-4xl">
          <span className="footer-name bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(34,211,238,0.35)]">
            Created by Reza Pourrafezi Nobarian
          </span>
          <span className="mx-6 text-xl text-cyan-400/70">✦</span>
        </span>
      ))}
    </div>
  );
}

/* ─────────── Footer — NEXUS UI v6 ─────────── */
export default function Footer() {
  const scopeRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(trackRef.current, { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });
    }, scopeRef);
    return () => ctx.revert();
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer ref={scopeRef} className="relative mt-24 border-t border-white/10 bg-[#04040c]/85 backdrop-blur-xl">
      {/* خط نئونی بالا با هاله */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent shadow-[0_0_18px_rgba(34,211,238,0.5)]" />
      {/* اسکن‌لاین محو */}
      <div className="scanlines pointer-events-none absolute inset-0 opacity-[0.04]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">
        {/* برند */}
        <div>
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center">
              <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 opacity-70 blur-[7px]" />
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-display text-lg font-black text-slate-950">
                N
              </span>
            </div>
            <span className="font-display text-lg font-bold tracking-[0.2em] text-white">
              NEXUS<span className="text-gradient">ARENA</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
            The next-generation gaming platform. Ranked tournaments, live streams and an unstoppable community.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className={`glass grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-all duration-300 hover:-translate-y-1 ${s.hover}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">{s.icon}</svg>
              </a>
            ))}
            <span className="glass rounded-xl px-3 py-2 font-display text-[11px] font-bold uppercase tracking-widest text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.2)]">
              ◉ Aparat
            </span>
          </div>
        </div>

        {/* لینک‌های سریع */}
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
                  <span className="inline-block text-cyan-400/60 transition-transform group-hover:-translate-x-1 group-hover:text-cyan-300">→</span>
                  <span className="transition-transform group-hover:translate-x-[-2px]">{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* جامعه */}
        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-white">Community</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            {['Discord Server', 'Forums', 'Tournaments', 'Support Center'].map((c) => (
              <li key={c} className="group flex cursor-pointer items-center gap-2 transition-colors hover:text-fuchsia-300">
                <span className="h-1 w-1 rounded-full bg-fuchsia-400/60 shadow-[0_0_8px_rgba(232,121,249,0.8)] transition-transform group-hover:scale-150" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* مارکی متحرک با لبه‌های محو */}
      <div className="overflow-hidden border-t border-white/5 py-6 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div ref={trackRef} className="flex w-max">
          <MarqueeHalf />
          <MarqueeHalf hidden />
        </div>
      </div>

      {/* تاریخ و ساعت */}
      <div className="relative mx-auto my-6 flex max-w-3xl justify-center px-6">
        <div className="w-full">
          <DateTimeBadge />
        </div>
      </div>

      {/* کپی‌رایت */}
      <div className="relative border-t border-white/5 py-4 text-center font-display text-xs uppercase tracking-[0.3em] text-slate-500">
        © 2026 Nexus Arena — All rights reserved
      </div>

      {/* دکمه بازگشت به بالا */}
      <button
        onClick={scrollTop}
        title="بازگشت به بالا"
        className="glass absolute bottom-6 left-6 grid h-10 w-10 place-items-center rounded-xl text-cyan-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
      >
        <ArrowUp size={16} />
      </button>
    </footer>
  );
}