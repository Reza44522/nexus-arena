import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck, ScrollText,
  HeartHandshake, UserX, Scale, Swords,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

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

/* ─────────── Register — NEXUS UI v6 ─────────── */
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
      <style>{`@keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }`}</style>

      {/* ─────────── پس‌زمینه‌ی زنده ─────────── */}
      <div className="pointer-events-none fixed inset-0">
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

      <div className="relative mx-auto grid w-full max-w-5xl items-start gap-8 lg:grid-cols-2">
        {/* ─────────── کارت فرم ثبت‌نام ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden rounded-3xl p-[1.5px]">
            <div className="absolute inset-[-200%] animate-[spin_7s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#22d3ee_80deg,transparent_160deg,#e879f9_240deg,transparent_320deg)]" />

            <div className="glass-strong relative overflow-hidden rounded-3xl p-8">
              {/* خط اسکن متحرک */}
              <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent animate-[scanY_3.5s_linear_infinite]" />

              {/* تگ HUD */}
              <div className="mb-4 flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-fuchsia-400/70">
                <span className="h-1 w-1 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" />
                New Recruit // Registration
                <span className="h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
              </div>

              {/* لوگو */}
              <div className="mb-6 text-center">
                <div className="relative mx-auto mb-4 h-16 w-16">
                  <span className="absolute inset-0 animate-ping rounded-2xl bg-fuchsia-400/20" />
                  <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 shadow-[0_0_40px_rgba(232,121,249,0.5)]">
                    <User className="h-8 w-8 text-slate-950" />
                  </div>
                </div>
                <h1 className="font-display text-2xl font-black tracking-wide text-white">
                  CREATE{' '}
                  <span className="text-gradient">ACCOUNT</span>
                </h1>
                <p className="mt-1 text-sm text-slate-400">به ۲.۴ میلیون بازیکن آرنا بپیوند!</p>
              </div>

              {/* خطا با shake */}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* نام کاربری */}
                <div className="group relative">
                  <User className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    value={form.name}
                    onChange={update('name')}
                    required
                    minLength={3}
                    autoComplete="username"
                    placeholder="ShadowHunter"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-4 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/60"
                  />
                </div>
                {/* ایمیل */}
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
                {/* رمز + قدرت‌سنج */}
                <div className="group relative">
                  <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={update('password')}
                    required
                    minLength={6}
                    autoComplete="new-password"
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

                {/* نوار قدرت رمز — نئونی */}
                {form.password && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                    <div className="flex gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors duration-300',
                            i < score ? cn(strengthColors[score], 'shadow-[0_0_10px_rgba(34,211,238,0.4)]') : 'bg-white/10'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      قدرت رمز: <span className={cn('font-bold', strengthText[score])}>{strengthLabels[score]}</span>
                    </p>
                  </motion.div>
                )}

                {/* تأیید رمز */}
                <div className="group relative">
                  <KeyRound className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={update('confirm')}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={cn(
                      'w-full rounded-xl border bg-slate-950/60 py-3 pl-4 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-600',
                      form.confirm && form.confirm !== form.password
                        ? 'border-rose-500/60 focus:shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                        : form.confirm && form.confirm === form.password
                        ? 'border-emerald-400/60 focus:shadow-[0_0_20px_rgba(52,211,153,0.25)]'
                        : 'border-white/10 focus:border-cyan-400/60'
                    )}
                  />
                  {form.confirm && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">
                      {form.confirm === form.password ? '✅' : '❌'}
                    </span>
                  )}
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-400">
                  <input type="checkbox" required className="mt-0.5 accent-cyan-400" />
                  قوانین آرنا و سیاست Fair-Play رو می‌پذیرم.
                </label>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-3 font-display text-sm font-black uppercase tracking-widest text-slate-950 shadow-[0_0_30px_rgba(232,121,249,0.4)] transition-all hover:shadow-[0_0_45px_rgba(232,121,249,0.6)] disabled:opacity-50"
                >
                  {loading ? <Spinner /> : <ShieldCheck size={16} />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </motion.button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─────────── پنل قوانین آرنا ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass-strong rounded-3xl p-7"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_25px_rgba(251,191,36,0.4)]">
              <ScrollText className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-white">قوانین آرنا</h2>
              <p className="text-xs text-slate-400">قبل از ورود به میدان، بخونشون!</p>
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
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-cyan-400/30 hover:bg-white/10"
              >
                {/* خط نور بالای کارت در هاور */}
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br shadow-lg', r.color)}>
                  <r.icon className="h-5 w-5 text-slate-950" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-white">
                    <span className="font-display text-[10px] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">۰{i + 1}</span>
                    {r.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-400">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-center text-[11px] text-amber-300/80 shadow-[inset_0_1px_0_rgba(251,191,36,0.15)]">
            ⚡ ثبت‌نام به‌معنی پذیرش همه‌ی قوانین بالاست
          </div>
        </motion.div>
      </div>
    </div>
  );
}