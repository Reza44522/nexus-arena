import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Gamepad2, Eye, EyeOff, Zap, Users, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Spinner = () => (
  <motion.span
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    className="inline-block h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent"
  />
);

/* ─────────── Login — NEXUS UI v6 ─────────── */
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-16">
      <style>{`@keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }`}</style>

      {/* ─────────── پس‌زمینه‌ی زنده ─────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <motion.div
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[110px]"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[110px]"
          animate={{ x: [0, -50, 0], y: [0, -40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="scanlines absolute inset-0 opacity-[0.05]" />
      </div>

      {/* ─────────── کارت اصلی با حاشیه‌ی نئونی چرخان ─────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-3xl p-[1.5px]">
          <div className="absolute inset-[-200%] animate-[spin_7s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#22d3ee_80deg,transparent_160deg,#e879f9_240deg,transparent_320deg)]" />

          <div className="glass-strong relative overflow-hidden rounded-3xl p-8">
            {/* خط اسکن متحرک */}
            <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-[scanY_3.5s_linear_infinite]" />

            {/* تگ HUD */}
            <div className="mb-4 flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
              <span className="h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
              Encrypted Channel // Nexus-ID
              <span className="h-1 w-1 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" />
            </div>

            {/* لوگو */}
            <div className="mb-6 text-center">
              <div className="relative mx-auto mb-4 h-16 w-16">
                <span className="absolute inset-0 animate-ping rounded-2xl bg-cyan-400/20" />
                <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 shadow-[0_0_40px_rgba(34,211,238,0.5)]">
                  <Gamepad2 className="h-8 w-8 text-slate-950" />
                </div>
              </div>
              <h1 className="font-display text-2xl font-black tracking-wide text-white">
                WELCOME{' '}
                <span className="text-gradient">BACK</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">برای ورود به آرنا، آماده‌ای؟</p>
            </div>

            {/* خطا با انیمیشن shake */}
            <motion.div
              key={shakeKey}
              animate={error ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                  ⚠ {error}
                </div>
              )}
            </motion.div>

            {/* فرم */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="group relative">
                <Mail className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  required
                  autoComplete="email"
                  placeholder="player@nexus.gg"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-4 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/60"
                />
              </div>
              <div className="group relative">
                <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-cyan-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400">
                  <input type="checkbox" className="accent-cyan-400" /> Remember me
                </label>
                <button type="button" className="text-cyan-300 transition hover:text-cyan-200">
                  Forgot password?
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-3 font-display text-sm font-black uppercase tracking-widest text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_45px_rgba(34,211,238,0.6)] disabled:opacity-50"
              >
                {loading ? <Spinner /> : <LogIn size={16} />}
                {loading ? 'Signing in…' : 'Sign In'}
              </motion.button>
            </form>

            {/* دکمو */}
            <button
              type="button"
              onClick={fillDemo}
              className="mt-4 w-full rounded-xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-left text-xs text-slate-300 transition-all hover:bg-cyan-400/10 hover:shadow-[0_0_18px_rgba(34,211,238,0.15)]"
            >
              <span className="font-bold text-cyan-300">Demo account</span> — demo@nexus.gg / demo123 (click to fill)
            </button>

            <p className="mt-5 text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
                Create one
              </Link>
            </p>

            {/* آمار کوچک */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/5 pt-5">
              {[
                { icon: Users, label: '2.4M+ Players' },
                { icon: Zap, label: '1,200+ Tours' },
                { icon: Shield, label: 'Anti-Cheat' },
              ].map((s) => (
                <div key={s.label} className="group flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-slate-300">
                  <s.icon size={14} className="text-cyan-400/70 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-transform group-hover:scale-110" />
                  <span className="text-[9px] uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}