import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import NeonButton from '../ui/NeonButton';

const links = [
  { to: '/', label: 'Home' },
  { to: '/games', label: 'Games' },
  { to: '/store', label: 'Store' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/news', label: 'News' },
  { to: '/stream', label: 'Stream' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // بررسی اینکه کاربر فعلی ادمین است یا خیر
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-white/10 bg-[#05050e]/80 shadow-[0_8px_40px_rgba(2,6,23,0.6)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-display text-lg font-black text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.5)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            N
          </span>
          <span className="font-display text-lg font-bold tracking-[0.2em] text-white">
            NEXUS<span className="text-gradient">ARENA</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-4 py-2 font-display text-xs uppercase tracking-[0.25em] transition-colors duration-300',
                  isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          {/* لینک Admin فقط برای ادمین‌ها */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-4 py-2 font-display text-xs uppercase tracking-[0.25em] transition-colors duration-300',
                  isActive ? 'text-fuchsia-300' : 'text-fuchsia-400/70 hover:text-fuchsia-300'
                )
              }
            >
              👑 Admin
            </NavLink>
          )}
        </div>

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 transition-colors hover:border-cyan-400/40"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-xs font-bold text-slate-950">
                  {user.name?.[0]?.toUpperCase() || 'G'}
                </span>
                <span className="text-sm text-slate-200">{user.name}</span>
              </Link>
              <NeonButton variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </NeonButton>
            </>
          ) : (
            <>
              <NeonButton variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Login
              </NeonButton>
              <NeonButton size="sm" onClick={() => navigate('/register')}>
                Join Now
              </NeonButton>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="glass grid h-10 w-10 place-items-center rounded-xl md:hidden"
        >
          <div className="space-y-1.5">
            <motion.span animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className="block h-0.5 w-5 bg-cyan-300" />
            <motion.span animate={open ? { opacity: 0 } : { opacity: 1 }} className="block h-0.5 w-5 bg-cyan-300" />
            <motion.span animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className="block h-0.5 w-5 bg-cyan-300" />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-white/10 bg-[#05050e]/95 backdrop-blur-2xl md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-xl px-4 py-3 font-display text-sm uppercase tracking-[0.25em]',
                        isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-300 hover:bg-white/5'
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              {/* لینک Admin در موبایل فقط برای ادمین‌ها */}
              {isAdmin && (
                <motion.div
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: links.length * 0.06 }}
                >
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      cn(
                        'block rounded-xl px-4 py-3 font-display text-sm uppercase tracking-[0.25em]',
                        isActive ? 'bg-fuchsia-400/10 text-fuchsia-300' : 'text-fuchsia-300 hover:bg-white/5'
                      )
                    }
                  >
                    👑 Admin Panel
                  </NavLink>
                </motion.div>
              )}
              <div className="flex gap-3 px-4 pt-3">
                {user ? (
                  <NeonButton variant="ghost" size="sm" className="flex-1" onClick={handleLogout}>
                    Logout
                  </NeonButton>
                ) : (
                  <>
                    <NeonButton variant="ghost" size="sm" className="flex-1" onClick={() => navigate('/login')}>
                      Login
                    </NeonButton>
                    <NeonButton size="sm" className="flex-1" onClick={() => navigate('/register')}>
                      Join
                    </NeonButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}