import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, Zap, Users, Shield, Activity, Server, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const Spinner = () => (
  <motion.span
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    className="inline-block h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent"
  />
);

/* ─────────── Login v7 — Holographic Gate ─────────── */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [showPass, setShowPass] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    const res = await login(form);
    if (res.ok) {
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } else {
      setError(res.error);
      setShakeKey((k) => k + 1);
      setLoading(false);
    }
  };

  const fillDemo = () => setForm({ email: 'demo@nexus.gg', password: 'demo123' });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
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

      {/* ─────────── صحنه: کف گرید سه‌بعدی + هاله‌ها ─────────── */}
      <div className="pointer-events-none absolute inset-0">
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
                'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cyan-400/20 to-transparent" />
        </div>
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      {/* ─────────── ریل آمار زنده (فقط دسکتاپ) ─────────── */}
      <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 flex-col gap-7 xl:flex">
        {[
          { icon: Activity, label: 'PING', value: '12ms', color: 'text-emerald-400' },
          { icon: Server, label: 'SERVERS', value: 'ONLINE', color: 'text-cyan-300' },
          { icon: Users, label: 'PLAYERS', value: '2.4M', color: 'text-fuchsia-300' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.12 }}
            className="flex items-center gap-3"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5">
              <s.icon size={14} className={s.color} />
            </div>
            <div>
              <p className="font-display text-[9px] uppercase tracking-[0.3em] text-slate-500">{s.label}</p>
              <p className={cn('font-display text-sm font-bold', s.color)}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─────────── دروازه ورود ─────────── */}
      <motion.div
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn('relative w-full max-w-md border border-cyan-400/25 bg-[#070b18]/85 p-8 backdrop-blur-2xl', CLIP)}
      >
        {/* خط اسکن */}
        <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" style={{ animation: 'scanY 4s linear infinite' }} />
        {/* براکت‌های گوشه */}
        <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
        <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/60" />

        {/* نوار وضعیت */}
        <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-3 font-display text-[9px] uppercase tracking-[0.3em] text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Secure Link
          </span>
          <span>NEXUS-ID // 07</span>
        </div>

        {/* لوگو + عنوان گلیچ */}
        <div className="mb-7 text-center">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <span className="absolute inset-0 rounded-xl bg-cyan-400/25 blur-[10px]" />
            <div className={cn('relative grid h-14 w-14 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500', CLIP_SM)}>
              <Gamepad2 className="h-7 w-7 text-slate-950" />
            </div>
          </div>
          <h1
            className="font-display text-3xl font-black tracking-[0.12em] text-white"
            style={{ animation: 'glitch 4s infinite' }}
          >
            SIGN<span className="text-gradient">IN</span>
          </h1>
          <p className="mt-2 text-xs text-slate-500">دروازه‌ی ورود به آرنا — آماده‌ای؟</p>
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
            <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">Email</label>
            <div className="group relative">
              <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-cyan-400/25 transition-all group-focus-within:h-9 group-focus-within:bg-cyan-300 group-focus-within:shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-cyan-300" />
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                autoComplete="email"
                placeholder="player@nexus.gg"
                className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-4 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-700 focus:border-cyan-400/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">Password</label>
            <div className="group relative">
              <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-cyan-400/25 transition-all group-focus-within:h-9 group-focus-within:bg-cyan-300 group-focus-within:shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-cyan-300" />
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-10 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-700 focus:border-cyan-400/50"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors hover:text-cyan-300"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <label className="flex items-center gap-2 text-slate-500">
              <input type="checkbox" className="accent-cyan-400" /> Remember me
            </label>
            <button type="button" className="text-cyan-400 transition hover:text-cyan-200">
              Forgot password?
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className={cn(
              'flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-3.5 font-display text-xs font-black uppercase tracking-[0.3em] text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-all hover:shadow-[0_0_45px_rgba(34,211,238,0.55)] disabled:opacity-50',
              CLIP_SM
            )}
          >
            {loading ? <Spinner /> : <LogIn size={15} />}
            {loading ? 'Authenticating…' : 'Enter The Arena'}
          </motion.button>
        </form>

        {/* دکمو */}
        <button
          type="button"
          onClick={fillDemo}
          className="mt-4 w-full rounded-md border border-dashed border-cyan-400/25 bg-cyan-400/5 px-4 py-2.5 text-left text-[11px] text-slate-400 transition hover:bg-cyan-400/10 hover:text-slate-200"
        >
          <span className="font-bold text-cyan-300">DEMO</span> — demo@nexus.gg / demo123 (click to fill)
        </button>

        <p className="mt-5 text-center text-xs text-slate-500">
          حساب نداری؟{' '}
          <Link to="/register" className="font-bold text-fuchsia-300 transition hover:text-fuchsia-200">
            به آرنا بپیوند
          </Link>
        </p>

        {/* اعتبار اجتماعی */}
        <div className="mt-6 flex items-center justify-center gap-3 border-t border-white/5 pt-5">
          <div className="flex -space-x-2">
            {['from-cyan-400 to-blue-500', 'from-fuchsia-500 to-purple-600', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500'].map((g, i) => (
              <span key={i} className={cn('grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br text-[9px] font-black text-slate-950 ring-2 ring-[#070b18]', g)}>
                {['K', 'R', 'A', 'M'][i]}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            <span className="font-bold text-slate-300">+۲.۴ میلیون</span> بازیکن در آرنا
          </p>
        </div>
      </motion.div>
    </div>
  );
}