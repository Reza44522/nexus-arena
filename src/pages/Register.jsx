import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck, ScrollText,
  HeartHandshake, UserX, Scale, Swords,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const strengthLabels = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong', 'Elite'];
const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-400', 'bg-cyan-400'];
const strengthText = ['text-rose-400', 'text-orange-400', 'text-amber-300', 'text-lime-300', 'text-emerald-300', 'text-cyan-300'];

/* 📜 قوانین آرنا */
const RULES = [
  { icon: HeartHandshake, color: 'from-cyan-400 to-blue-500', title: 'احترام به همه', desc: 'توهین، قلدری و تبعیض = مسدودیت فوری.' },
  { icon: UserX, color: 'from-rose-500 to-red-600', title: 'بدون تقلب', desc: 'چیت، هک و سوءاستفاده از باگ = بن دائم.' },
  { icon: ShieldCheck, color: 'from-emerald-400 to-teal-500', title: 'امنیت اکانت', desc: 'اطلاعات حسابت رو محرمانه نگه دار.' },
  { icon: Scale, color: 'from-amber-400 to-orange-500', title: 'بازی جوانمردانه', desc: 'تبانی و هماهنگی غیرمجاز = حذف امتیاز.' },
  { icon: Swords, color: 'from-fuchsia-500 to-purple-600', title: 'رأی ادمین نهایی', desc: 'در اختلاف‌ها، تصمیم تیم ادمین قطعی است.' },
];

const Spinner = () => (
  <motion.span
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    className="inline-block h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent"
  />
);

/* ─────────── Register v7 — Holographic Gate + Mission Briefing ─────────── */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [showPass, setShowPass] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const score = useMemo(() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 6) s += 1;
    if (p.length >= 10) s += 1;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s += 1;
    if (/\d/.test(p)) s += 1;
    if (/[^A-Za-z0-9]/.test(p)) s += 1;
    return s;
  }, [form.password]);

  const fail = (msg) => {
    setError(msg);
    setShakeKey((k) => k + 1);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (form.password !== form.confirm) {
      fail('رمزها مطابقت ندارند');
      return;
    }
    setLoading(true);
    const res = await register(form);
    if (res.ok) navigate('/dashboard');
    else fail(res.error);
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-16">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(232,121,249,.45); transform: none; }
          92% { text-shadow: -2px 0 #22d3ee, 2px 0 #e879f9; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #22d3ee, -2px 0 #e879f9; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(232,121,249,.45); transform: none; }
        }
      `}</style>

      {/* ─────────── صحنه: کف گرید سه‌بعدی + هاله‌ها ─────────── */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-x-0 bottom-0 h-[46vh]"
          style={{
            maskImage: 'linear-gradient(to top, black 15%, transparent 92%)',
            WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(232,121,249,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-fuchsia-400/15 to-transparent" />
        </div>
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-[130px]" />
        <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl items-start gap-8 lg:grid-cols-2">
        {/* ─────────── دروازه ثبت‌نام ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn('relative border border-fuchsia-400/25 bg-[#070b18]/85 p-8 backdrop-blur-2xl', CLIP)}
        >
          {/* خط اسکن */}
          <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent" style={{ animation: 'scanY 4s linear infinite' }} />
          {/* براکت‌های گوشه */}
          <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
          <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />

          {/* نوار وضعیت */}
          <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-3 font-display text-[9px] uppercase tracking-[0.3em] text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
              Recruit Channel
            </span>
            <span>NEXUS-ID // NEW</span>
          </div>

          {/* عنوان گلیچ */}
          <div className="mb-7 text-center">
            <h1 className="font-display text-3xl font-black tracking-[0.12em] text-white" style={{ animation: 'glitch 4s infinite' }}>
              JOIN<span className="text-gradient">ARENA</span>
            </h1>
            <p className="mt-2 text-xs text-slate-500">به ۲.۴ میلیون بازیکن آرنا بپیوند!</p>
          </div>

          {/* خطا با shake */}
          <motion.div
            key={shakeKey}
            animate={error ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {error && (
              <div className={cn('mb-4 border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300', CLIP_SM)}>
                ⚠ {error}
              </div>
            )}
          </motion.div>

          {/* فرم */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">Callsign</label>
              <div className="group relative">
                <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-fuchsia-400/25 transition-all group-focus-within:h-9 group-focus-within:bg-fuchsia-300 group-focus-within:shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-fuchsia-300" />
                <input
                  value={form.name}
                  onChange={update('name')}
                  required
                  minLength={3}
                  autoComplete="username"
                  placeholder="ShadowHunter"
                  className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-4 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-700 focus:border-fuchsia-400/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">Email</label>
              <div className="group relative">
                <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-fuchsia-400/25 transition-all group-focus-within:h-9 group-focus-within:bg-fuchsia-300 group-focus-within:shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-fuchsia-300" />
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  required
                  autoComplete="email"
                  placeholder="player@nexus.gg"
                  className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-4 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-700 focus:border-fuchsia-400/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">Password</label>
              <div className="group relative">
                <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-fuchsia-400/25 transition-all group-focus-within:h-9 group-focus-within:bg-fuchsia-300 group-focus-within:shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-fuchsia-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-10 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-700 focus:border-fuchsia-400/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors hover:text-fuchsia-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* نوار قدرت رمز — نئونی */}
            {form.password && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors duration-300',
                        i < score ? cn(strengthColors[score], 'shadow-[0_0_10px_rgba(232,121,249,0.4)]') : 'bg-white/10'
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  قدرت رمز: <span className={cn('font-bold', strengthText[score])}>{strengthLabels[score]}</span>
                </p>
              </motion.div>
            )}

            <div>
              <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">Confirm</label>
              <div className="group relative">
                <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-fuchsia-400/25 transition-all group-focus-within:h-9 group-focus-within:bg-fuchsia-300 group-focus-within:shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
                <KeyRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-fuchsia-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={update('confirm')}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-md border bg-black/40 py-3 pl-4 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-700',
                    form.confirm && form.confirm !== form.password
                      ? 'border-rose-500/60'
                      : form.confirm && form.confirm === form.password
                      ? 'border-emerald-400/60'
                      : 'border-white/10 focus:border-fuchsia-400/50'
                  )}
                />
                {form.confirm && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">
                    {form.confirm === form.password ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2 text-[11px] text-slate-500">
              <input type="checkbox" required className="mt-0.5 accent-fuchsia-400" />
              قوانین آرنا و سیاست Fair-Play رو می‌پذیرم.
            </label>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-3.5 font-display text-xs font-black uppercase tracking-[0.3em] text-slate-950 shadow-[0_0_30px_rgba(232,121,249,0.35)] transition-all hover:shadow-[0_0_45px_rgba(232,121,249,0.55)] disabled:opacity-50',
                CLIP_SM
              )}
            >
              {loading ? <Spinner /> : <ShieldCheck size={15} />}
              {loading ? 'Creating account…' : 'Enlist Now'}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            قبلاً ثبت‌نام کردی؟{' '}
            <Link to="/login" className="font-bold text-cyan-300 transition hover:text-cyan-200">
              وارد شو
            </Link>
          </p>
        </motion.div>

        {/* ─────────── پنل بریفینگ قوانین ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={cn('relative border border-cyan-400/25 bg-[#070b18]/85 p-7 backdrop-blur-2xl', CLIP)}
        >
          <span className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-cyan-400/60" />
          <span className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-fuchsia-400/60" />

          <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
            <div className={cn('grid h-11 w-11 place-items-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_25px_rgba(251,191,36,0.4)]', CLIP_SM)}>
              <ScrollText className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h2 className="font-display text-base font-black tracking-[0.15em] text-white">MISSION BRIEFING</h2>
              <p className="text-[10px] text-slate-500">قبل از ورود به میدان، قوانین رو بخون!</p>
            </div>
          </div>

          <div className="space-y-3">
            {RULES.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: -4 }}
                className="group relative flex items-center gap-4 overflow-hidden border border-white/5 bg-white/5 p-4 transition-colors hover:border-cyan-400/30 hover:bg-white/10"
                style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="font-display text-[10px] font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                  ۰{i + 1}
                </span>
                <div className={cn('grid h-10 w-10 shrink-0 place-items-center bg-gradient-to-br shadow-lg', r.color, CLIP_SM)}>
                  <r.icon className="h-4 w-4 text-slate-950" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{r.title}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-slate-400">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className={cn('mt-6 border border-amber-400/25 bg-amber-400/5 p-3 text-center text-[10px] text-amber-300/80', CLIP_SM)}>
            ⚡ ثبت‌نام به‌معنی پذیرش همه‌ی قوانین بالاست
          </div>
        </motion.div>
      </div>
    </div>
  );
}