/* ─────────── BackgroundFX v2 — پس‌زمینه سینمایی سایبرپانک ───────────
   - شفق قطبی متحرک (Aurora Blobs)
   - گرید نئونی سه‌بعدی متحرک کف صفحه
   - شهاب‌های نوری عبوری
   - بافت نویز سینمایی + وینیت
   - موبایل: فقط نورهای ثابت (بهینه)
────────────────────────────────────────────────────────────────── */

const isMobile = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 768px)').matches;

export default function BackgroundFX() {
  const mobile = isMobile();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes nxAurora {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
          33% { transform: translate3d(4%,-3%,0) rotate(8deg) scale(1.08); }
          66% { transform: translate3d(-3%,4%,0) rotate(-6deg) scale(0.95); }
        }
        @keyframes nxGridMove { to { background-position: 0 48px; } }
        @keyframes nxShoot {
          0% { transform: translate3d(-15vw, 12vh, 0) rotate(-32deg); opacity: 0; }
          4% { opacity: 1; }
          18% { transform: translate3d(70vw, -28vh, 0) rotate(-32deg); opacity: 0; }
          100% { transform: translate3d(70vw, -28vh, 0) rotate(-32deg); opacity: 0; }
        }
        @keyframes nxPulse { 0%,100% { opacity: .45; } 50% { opacity: .9; } }
      `}</style>

      {/* بوم عمیق پایه */}
      <div className="absolute inset-0 bg-[#050510]" />

      {/* 🌌 شفق قطبی — سه لکه نور متحرک */}
      <div
        className="absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full opacity-25 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #22d3ee 0%, transparent 60%)',
          animation: mobile ? undefined : 'nxAurora 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-52 -right-40 h-[46rem] w-[46rem] rounded-full opacity-20 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, #d946ef 0%, transparent 60%)',
          animation: mobile ? undefined : 'nxAurora 22s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-[30rem] w-[30rem] rounded-full opacity-10 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, transparent 60%)',
          animation: mobile ? undefined : 'nxAurora 26s ease-in-out infinite',
        }}
      />

      {/* 🕹 گرید نئونی سه‌بعدی کف صفحه (فقط دسکتاپ) */}
      {!mobile && (
        <div
          className="absolute inset-x-0 bottom-0 h-[45vh]"
          style={{
            maskImage: 'linear-gradient(to top, black 15%, transparent 92%)',
            WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'nxGridMove 2.2s linear infinite',
            }}
          />
          {/* افق درخشان */}
          <div
            className="absolute inset-x-0 bottom-0 h-24"
            style={{
              background: 'linear-gradient(to top, rgba(34,211,238,.22), transparent)',
              animation: 'nxPulse 5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* ☄️ شهاب‌های نوری (فقط دسکتاپ) */}
      {!mobile && (
        <>
          <span
            className="absolute left-0 top-[16%] h-px w-44 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
            style={{ animation: 'nxShoot 9s ease-in infinite', animationDelay: '1.5s' }}
          />
          <span
            className="absolute left-0 top-[52%] h-px w-32 bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent"
            style={{ animation: 'nxShoot 13s ease-in infinite', animationDelay: '6s' }}
          />
        </>
      )}

      {/* 🎞 بافت نویز سینمایی */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/></svg>")`,
        }}
      />

      {/* وینیت ملایم بالا برای خوانایی Navbar */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(5,5,16,.55)_0%,transparent_55%)]" />
    </div>
  );
}