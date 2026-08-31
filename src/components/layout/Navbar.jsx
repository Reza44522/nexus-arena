import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, LogOut, LayoutDashboard, Shield, User, LockKeyhole, Banknote, ChevronDown, MoreHorizontal,
  Store as StoreIcon, Warehouse, Handshake, Users, MessageSquare, Target, ScrollText, Radio, Newspaper, LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import { supabase } from '../../lib/supabase';
import DateTimeBadge from '../ui/DateTimeBadge';
import { cn } from '../../utils/cn';

const MAIN_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/games', label: 'Games' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/dashboard', label: 'My Country' },
  { to: '/war', label: 'War' },
  { to: '/market', label: 'Market' },
  { to: '/rankings', label: 'Rankings' },
  { to: '/friends', label: 'Friends' },
];

const MORE_LINKS = [
  { to: '/store', label: 'Store', icon: StoreIcon },
  { to: '/military', label: 'Arsenal', icon: Warehouse },
  { to: '/diplomacy', label: 'Diplomacy', icon: Handshake },
  { to: '/alliances', label: 'Alliances', icon: Users },
  { to: '/alliance-chat', label: 'Alliance Chat', icon: MessageSquare },
  { to: '/missions', label: 'Missions', icon: Target },
  { to: '/statements', label: 'Statements', icon: ScrollText },
  { to: '/stream', label: 'Stream', icon: Radio },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/support', label: 'Support', icon: LifeBuoy },
];

/* 💵 نشان دلار جنگ — زنده */
function WDBadge() {
  const { user } = useAuth();
  const [wd, setWd] = useState(0);
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase.from('profiles').select('war_dollars').eq('id', user.id).single();
      setWd(data?.war_dollars ?? 0);
    };
    load();
    const ch = supabase
      .channel('nav-wd-' + user.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (p) => {
        setWd(p.new?.war_dollars ?? 0);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user?.id]);
  return (
    <Link
      to="/market"
      title="بودجه جنگی — برو بازار"
      className="group hidden items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-400/15 to-cyan-500/10 px-3 py-1.5 text-sm font-bold text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.15)] transition hover:border-emerald-300/50 hover:shadow-[0_0_22px_rgba(52,211,153,0.35)] sm:flex"
    >
      <Banknote size={14} className="transition-transform group-hover:rotate-12" />
      {Number(wd).toLocaleString('fa-IR')}
      <span className="text-[9px] font-black tracking-wider text-emerald-300">WD</span>
    </Link>
  );
}

function DropItem({ to, onClick, icon: Icon, color = 'text-slate-300', children }) {
  return (
    <Link to={to} onClick={onClick} className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-all hover:translate-x-[-2px] hover:bg-white/10 hover:text-white">
      <Icon size={15} className={cn('transition-transform group-hover:scale-110', color)} />
      {children}
    </Link>
  );
}

export default function Navbar() {
  const auth = useAuth();
  const { user, profile } = auth;
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePos, setMorePos] = useState({ top: 64, left: 8 });
  const dropRef = useRef(null);
  const moreBtnRef = useRef(null);
  const panelRef = useRef(null);

  /* باز کردن More با مختصات دقیق (Portal — بدون بریدگی) */
  const toggleMore = () => {
    if (moreOpen) return setMoreOpen(false);
    const r = moreBtnRef.current?.getBoundingClientRect();
    const W = 430;
    const left = r ? Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8)) : 8;
    const top = r ? r.bottom + 8 : 64;
    setMorePos({ top, left });
    setMoreOpen(true);
  };

  useEffect(() => {
    const onDown = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      const inBtn = moreBtnRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inBtn && !inPanel) setMoreOpen(false);
    };
    const onScroll = () => setMoreOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  const isAdmin = profile?.role === 'admin';

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
      isActive ? 'bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.35)]' : 'text-slate-400 hover:text-white'
    );

  return (
    <header className="glass-strong fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-16 max-w-[1700px] items-center gap-3 px-4">
        {/* لوگو */}
        <Link to="/" className="group flex shrink-0 items-center gap-2">
          <div className="relative grid h-9 w-9 place-items-center">
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 opacity-70 blur-[7px] transition group-hover:opacity-100" />
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-display text-lg font-bold text-slate-950 transition-transform group-hover:scale-105">
              N
            </div>
          </div>
          <span className="hidden font-display text-lg font-bold tracking-wider text-white sm:block">
            NEXUS<span className="text-gradient bg-clip-text text-transparent">ARENA</span>
          </span>
        </Link>

        {/* لینک‌های دسکتاپ */}
        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {MAIN_LINKS.filter((l) => !(isAdmin && l.to === '/dashboard')).map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
              {l.label}
            </NavLink>
          ))}

          <button
            ref={moreBtnRef}
            onClick={toggleMore}
            className={cn(
              'flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 font-display text-xs uppercase tracking-widest transition-all',
              moreOpen ? 'bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_14px_rgba(232,121,249,0.35)]' : 'text-slate-400 hover:text-white'
            )}
          >
            <MoreHorizontal size={13} /> More
            <ChevronDown size={11} className={cn('transition-transform', moreOpen && 'rotate-180')} />
          </button>

          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <span className="flex items-center gap-1 text-fuchsia-300">
                <Shield size={12} /> Admin
              </span>
            </NavLink>
          )}
        </nav>

        {/* کنترل‌های راست */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <DateTimeBadge compact />
          {user && <WDBadge />}
          {user && <NotificationBell />}
          {user ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen((v) => !v)}
                title={profile?.username || user.email}
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-bold text-slate-950 ring-2 ring-cyan-400/40 transition hover:scale-105 hover:ring-cyan-300"
              >
                {(profile?.username || user.email || '?').slice(0, 1).toUpperCase()}
              </button>
              <AnimatePresence>
                {dropOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="glass-strong absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl p-2"
                  >
                    <div className="border-b border-white/10 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-white">{profile?.username || 'User'}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="pt-1">
                      <DropItem to={`/profile/${user.id}`} onClick={() => setDropOpen(false)} icon={User} color="text-cyan-300">پروفایل من</DropItem>
                                            {!isAdmin && (
                        <DropItem to="/dashboard" onClick={() => setDropOpen(false)} icon={LayoutDashboard} color="text-emerald-300">My Country</DropItem>
                      )}
                      {isAdmin && (
                        <>
                          <DropItem to="/admin" onClick={() => setDropOpen(false)} icon={Shield} color="text-fuchsia-300">Admin Panel</DropItem>
                          <DropItem to="/admin/lock" onClick={() => setDropOpen(false)} icon={LockKeyhole} color="text-amber-300">قفل سایت</DropItem>
                        </>
                      )}
                      <button onClick={handleLogout} className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10">
                        <LogOut size={15} className="transition-transform group-hover:scale-110" /> Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:text-white">Login</Link>
              <Link to="/register" className="rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.35)] transition hover:brightness-110">Register</Link>
            </div>
          )}
          <button onClick={() => setMobileOpen((v) => !v)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* منوی More — Portal روی body (هرگز بریده نمی‌شود) */}
      {createPortal(
        <AnimatePresence>
          {moreOpen && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'fixed', top: morePos.top, left: morePos.left, width: 'min(430px, calc(100vw - 16px))', zIndex: 70 }}
              className="glass-strong overflow-hidden rounded-2xl border border-white/10 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            >
              <div className="grid grid-cols-2 gap-1">
                {MORE_LINKS.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setMoreOpen(false)} className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-all hover:bg-white/10 hover:text-white">
                    <l.icon size={15} className="text-cyan-300 transition-transform group-hover:scale-110" />
                    {l.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* منوی موبایل */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 lg:hidden">
            <div className="space-y-1 px-4 py-3">
              <p className="px-3 pt-1 font-display text-[9px] uppercase tracking-[0.3em] text-slate-600">اصلی</p>
              {MAIN_LINKS.filter((l) => !(isAdmin && l.to === '/dashboard')).map((l) => (
                <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('block rounded-lg px-3 py-2 font-display text-sm uppercase tracking-wider', isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
                  {l.label}
                </NavLink>
              ))}
              <p className="px-3 pt-2 font-display text-[9px] uppercase tracking-[0.3em] text-slate-600">بیشتر</p>
              {MORE_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('flex items-center gap-2 rounded-lg px-3 py-2 font-display text-sm uppercase tracking-wider', isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
                  <l.icon size={14} className="text-cyan-300" /> {l.label}
                </NavLink>
              ))}
              {isAdmin && (
                <>
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 font-display text-sm uppercase tracking-wider text-fuchsia-300 hover:bg-white/5">Admin</NavLink>
                  <NavLink to="/admin/lock" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 font-display text-sm uppercase tracking-wider text-amber-300 hover:bg-white/5">قفل سایت</NavLink>
                </>
              )}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-slate-300">Login</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 py-2 text-center text-sm font-bold text-white">Register</Link>
                </div>
              )}
              {user && (
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
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