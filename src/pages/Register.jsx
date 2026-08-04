import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import NeonButton from '../components/ui/NeonButton';
import NeonInput from '../components/ui/NeonInput';
import { cn } from '../utils/cn';

const strengthLabels = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong', 'Elite'];
const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-400', 'bg-cyan-400'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (form.password !== form.confirm) {
      fail('Passwords do not match.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const res = register(form);
      if (res.ok) navigate('/dashboard');
      else fail(res.error);
    }, 650);
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join 2.4M+ players in the arena">
      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            ⚠ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <NeonInput id="name" label="Username" placeholder="ShadowHunter" icon="👤" value={form.name} onChange={update('name')} required minLength={3} autoComplete="username" />
          <NeonInput id="email" label="Email" type="email" placeholder="player@nexus.gg" icon="✉" value={form.email} onChange={update('email')} required autoComplete="email" />

          <div className="space-y-2">
            <NeonInput id="password" label="Password" type="password" placeholder="••••••••" icon="🔒" value={form.password} onChange={update('password')} required minLength={6} autoComplete="new-password" />
            {form.password && (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', i < score ? strengthColors[score] : 'bg-white/10')} />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Password strength: <span className="text-slate-300">{strengthLabels[score]}</span>
                </p>
              </div>
            )}
          </div>

          <NeonInput id="confirm" label="Confirm Password" type="password" placeholder="••••••••" icon="🔐" value={form.confirm} onChange={update('confirm')} required autoComplete="new-password" />

          <label className="flex items-start gap-2 text-xs text-slate-400">
            <input type="checkbox" required className="mt-0.5 accent-cyan-400" />
            I agree to the Terms of Service and the Fair-Play policy.
          </label>

          <NeonButton type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </NeonButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">Sign in</Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}