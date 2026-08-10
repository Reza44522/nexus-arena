import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, Shield, User, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import { supabase } from '../../lib/supabase';
import DateTimeBadge from '../ui/DateTimeBadge';
import { cn } from '../../utils/cn';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/games', label: 'Games' },
  { to: '/store', label: 'Store' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/news', label: 'News' },
  { to: '/stream', label: 'Stream' },
  { to: '/friends', label: 'Friends' },
  { to: '/support', label: 'Support' },
  { to: '/dashboard', label: 'Dashboard' },
];

// 🪙 نشان سکه — زنده آپدیت می‌شه
function CoinBadge() {
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase.from('profiles').select('coins').eq('id', user.id).single();
      setCoins(data?.coins ?? 0);
    };
    load();
    const ch = supabase
      .channel('nav-coins-' + user.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (p) => {
        setCoins(p.new?.coins ?? 0);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user?.id]);

  return (
    <Link
      to="/store"
      title="فروشگاه"
      className="hidden items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm font-bold text-amber-300 transition hover:bg-amber-400/20 sm:flex"
    >
      🪙 {coins}
    </Link>
  );
}

export default function Navbar() {
  const auth = useAuth();
  const { user, profile } = auth;
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // بستن منوی کشویی وقتی بیرون کلیک می‌شه
  useEffect(() => {
    const onDown = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const isAdmin = profile?.role === 'admin';

  // ✅ خروج — هر دو نام ممکن (signOut یا logout) رو ساپورت می‌کنه
  const handleLogout = async () => {
    setDropOpen(false);
    setMobileOpen(false);
    try {
      if (auth.signOut) await auth.signOut();
      else if (auth.logout) await auth.logout();
    } finally {
      navigate('/');
    }
  };

  const linkClass = ({ isActive }) =>
    cn(
      'whitespace-nowrap rounded-lg px-3 py-2 font-display text-xs uppercase tracking-widest transition-all',
      isActive
        ? 'bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.35)]'
        : 'text-slate-400 hover:text-white'
    );

  return (
    <header className="glass-strong fixed inset-x-0 top-0 z-40 border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-[1700px] items-center gap-3 px-4">
        {/* لوگو */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-display text-lg font-bold text-slate-950 shadow-glow-cyan">
            N
          </div>
          <span className="hidden font-display text-lg font-bold tracking-wider text-white sm:block">
            NEXUS
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
              ARENA
            </span>
          </span>
        </Link>

        {/* لینک‌های دسکتاپ — اگه جا کم بیاد اسکرول می‌شن */}
        <nav className="hidden flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <span className="flex items-center gap-1 text-fuchsia-300">
                <Shield size={12} /> Admin
              </span>
            </NavLink>
          )}
        </nav>

        {/* ✅ کنترل‌های سمت راست — با shrink-0 هرگز از صفحه بیرون نمی‌زنن */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <DateTimeBadge compact />
          {user && <CoinBadge />}
          {user && <NotificationBell />}
          {user ? (
            <div className="relative" ref={dropRef}>
              {/* آواتار — کلیک = منوی کشویی */}
              <button
                onClick={() => setDropOpen((v) => !v)}
                title={profile?.username || user.email}
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-bold text-slate-950 ring-2 ring-cyan-400/40 transition hover:ring-cyan-300"
              >
                {(profile?.username || user.email || '?').slice(0, 1).toUpperCase()}
              </button>
              <AnimatePresence>
                {dropOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="glass-strong absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-white/10 p-2"
                  >
                    <div className="border-b border-white/10 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {profile?.username || 'User'}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setDropOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <User size={15} /> پروفایل من
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setDropOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-fuchsia-300 hover:bg-white/10"
                        >
                          <Shield size={15} /> Admin Panel
                        </Link>
                        <Link
                          to="/admin/lock"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-300 hover:bg-white/10"
                        >
                          <LockKeyhole size={15} /> قفل سایت
                        </Link>
                      </>
                    )}
                    {/* ✅ دکمه خروج — همیشه دیده می‌شه */}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut size={15} /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:text-white">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-glow-cyan"
              >
                Register
              </Link>
            </div>
          )}
          {/* همبرگری موبایل */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {/* منوی موبایل */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 lg:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2 font-display text-sm uppercase tracking-wider',
                      isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {isAdmin && (
                <>
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 font-display text-sm uppercase tracking-wider text-fuchsia-300 hover:bg-white/5"
                  >
                    Admin
                  </NavLink>
                  <NavLink
                    to="/admin/lock"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 font-display text-sm uppercase tracking-wider text-amber-300 hover:bg-white/5"
                  >
                    قفل سایت
                  </NavLink>
                </>
              )}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-slate-300">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 py-2 text-center text-sm font-bold text-white">
                    Register
                  </Link>
                </div>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <LogOut size={15} /> Log out
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}