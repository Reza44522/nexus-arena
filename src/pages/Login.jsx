import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import NeonButton from '../components/ui/NeonButton';
import NeonInput from '../components/ui/NeonInput';

const Spinner = () => (
  <motion.span
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    className="inline-block h-4 w-4 rounded-full border-2 border-slate-900 border-t-transparent"
  />
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

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
    <AuthLayout title="Welcome Back" subtitle="Sign in to enter the arena">
      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5"
      >
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            ⚠ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <NeonInput id="email" label="Email" type="email" placeholder="player@nexus.gg" icon="✉" value={form.email} onChange={update('email')} required autoComplete="email" />
          <NeonInput id="password" label="Password" type="password" placeholder="••••••••" icon="🔒" value={form.password} onChange={update('password')} required autoComplete="current-password" />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-400">
              <input type="checkbox" className="accent-cyan-400" /> Remember me
            </label>
            <button type="button" className="text-cyan-300 hover:text-cyan-200">Forgot password?</button>
          </div>

          <NeonButton type="submit" className="w-full" disabled={loading}>
            {loading ? (<><Spinner /> Signing in…</>) : 'Sign In'}
          </NeonButton>
        </form>

        <button type="button" onClick={fillDemo} className="w-full rounded-xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-left text-xs text-slate-300 transition-colors hover:bg-cyan-400/10">
          <span className="font-bold text-cyan-300">Demo account</span> — demo@nexus.gg / demo123 (click to fill)
        </button>

        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">Create one</Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}