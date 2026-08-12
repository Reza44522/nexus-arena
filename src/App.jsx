import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldX } from 'lucide-react';
import * as AuthModule from './context/AuthContext';
import { supabase } from './lib/supabase';
import WarningAlert from './components/WarningAlert';
import NotificationPopup from './components/NotificationPopup';
import SiteLockdown from './components/SiteLockdown';
import SiteLockControl from './components/admin/SiteLockControl';
import Profile from './pages/Profile';

// layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import BackgroundFX from './components/fx/BackgroundFX';
import Particles from './components/fx/Particles';
import MusicPlayer from './components/music/MusicPlayer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// pages
import Home from './pages/Home';
import Games from './pages/Games';
import Store from './pages/Store';
import Tournaments from './pages/Tournaments';
import Leaderboard from './pages/Leaderboard';
import News from './pages/News';
import Stream from './pages/Stream';
import Friends from './pages/Friends';
import Dashboard from './pages/Dashboard';
import Support from './pages/Support';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const useAuth = AuthModule.useAuth;

/* ─────────── نگهبان حساب حذف‌شده ─────────── */
function DeletedAccountGuard() {
  const auth = useAuth();
  const { user } = auth;
  const navigate = useNavigate();
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!user) setShowMessage(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const doLogout = async () => {
      setShowMessage(true);
      setTimeout(async () => {
        try {
          if (auth.signOut) await auth.signOut();
          else if (auth.logout) await auth.logout();
          else await supabase.auth.signOut();
        } catch (e) {}
        navigate('/login', { replace: true });
      }, 2500);
    };

    const checkAccount = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('deleted_at, status')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.deleted_at || data?.status === 'deleted') doLogout();
    };

    checkAccount();
    const interval = setInterval(checkAccount, 30000);

    const channel = supabase
      .channel('deleted-guard-' + user.id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new?.deleted_at || payload.new?.status === 'deleted') doLogout();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <AnimatePresence>
      {showMessage && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] grid place-items-center bg-black/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="glass-strong max-w-md rounded-2xl border-2 border-red-500/40 p-8 text-center shadow-[0_0_60px_rgba(239,68,68,0.4)]"
          >
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">حساب شما حذف شده است</h2>
            <p className="mt-2 text-sm text-slate-400">این حساب توسط ادمین حذف شده و دیگر قابل دسترسی نیست.</p>
            <p className="mt-4 text-xs text-slate-500">در حال انتقال به صفحه ورود...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────── بررسی بن / مسدود کامل — Real-time + آژیر ─────────── */
function BanChecker() {
  const auth = useAuth();
  const { user, profile } = auth;
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [live, setLive] = useState(null); // ردیف زنده از Realtime
  const sirenPlayedRef = useRef(false); // آژیر فقط یکبار per مسدودیت

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 📡 Realtime: تغییر وضعیت همان لحظه اعمال شود (کاربر آنلاین)
  useEffect(() => {
    if (!user?.id) return;
    setLive(null);

    const channel = supabase
      .channel('restriction-' + user.id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) setLive(payload.new);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  // ردیف زنده اولویت دارد؛ اگر نبود، پروفایل AuthContext (برای بازدید بعدی)
  const p = live || profile;

  const isBanned = p?.status === 'banned';
  const isBlockedPerm = p?.status === 'blocked' && !p?.restrict_until;

  // ✅ قفل دائمی کامل = «بن دائم» یا «مسدود کامل دائمی» → فقط این‌ها آژیر دارند
  const isPermLock = (isBanned && !p?.restrict_until) || isBlockedPerm;

  const until = p?.restrict_until ? new Date(p.restrict_until).getTime() : null;
  const isTemp = isBanned && until && until > now;
  const isExpired = isBanned && until && until <= now;

  // 🔊 آژیر ۱۵ ثانیه: فایل ۷ ثانیه‌ای دو بار پخش می‌شود
  // هم Real-time (کاربر آنلاین) هم بازدید بعدی (کاربر آفلاین)
  // هوشمند: اگر مرورگر اجازه نداد، با اولین کلیک کاربر پخش می‌شود
  useEffect(() => {
    if (!isPermLock) {
      sirenPlayedRef.current = false; // اگر رفع شد، برای دفعه بعد آماده شو
      return;
    }
    if (sirenPlayedRef.current) return;
    sirenPlayedRef.current = true;

    console.log('🚨 [BanChecker] قفل دائمی کامل تشخیص داده شد — پخش آژیر...');

    // توقف موزیک سراسری
    window.dispatchEvent(new CustomEvent('nexus-music-pause'));

    const audio = new Audio('/audio/block-siren.mp3');
    audio.volume = 1;
    let played = 0;

    const play = () => {
      audio
        .play()
        .then(() => {
          played += 1;
          console.log(`🔊 [BanChecker] آژیر پخش شد — بار ${played}`);
        })
        .catch((err) => {
          console.warn('🔇 [BanChecker] مرورگر اجازه پخش نداد؛ با اولین کلیک کاربر پخش می‌شود...', err?.name);
          // سیاست Autoplay: منتظر اولین تعامل کاربر بمان
          const unlock = () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            play();
          };
          window.addEventListener('pointerdown', unlock);
          window.addEventListener('keydown', unlock);
        });
    };

    audio.onended = () => {
      if (played < 2) play(); // بار دوم
    };
    audio.addEventListener('error', () => {
      console.error('❌ [BanChecker] فایل /audio/block-siren.mp3 پیدا نشد! مسیر: public/audio/block-siren.mp3');
    });

    play();
  }, [isPermLock]);

  if (!user || !p) return null;
  if (!isBanned && !isBlockedPerm) return null;
  if (isExpired) return null;

  const remain = isTemp ? until - now : 0;
  const h = Math.floor(remain / 3600000);
  const m = Math.floor((remain % 3600000) / 60000);
  const s = Math.floor((remain % 60000) / 1000);

  const doLogout = async () => {
    try {
      if (auth.signOut) await auth.signOut();
      else if (auth.logout) await auth.logout();
      else await supabase.auth.signOut();
    } catch (e) {}
    navigate('/login', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[9998] grid place-items-center bg-black/95 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-strong max-w-md rounded-2xl border-2 border-red-500/40 p-8 text-center shadow-[0_0_60px_rgba(239,68,68,0.4)]"
      >
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-500/20">
          <ShieldX className="h-8 w-8 text-red-400" />
        </div>

        {isBlockedPerm ? (
          <>
            <h2 className="font-display text-xl font-bold text-white">حساب شما به‌صورت کامل مسدود شده است</h2>
            <p className="mt-2 text-sm text-slate-400">دلیل: {p.restrict_reason || 'تخلف از قوانین آرنا'}</p>
            <p className="mt-4 text-sm font-bold text-red-400">مسدودیت دائمی — دسترسی به هیچ بخش سایت ممکن نیست</p>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-white">حساب شما مسدود شده است</h2>
            <p className="mt-2 text-sm text-slate-400">دلیل: {p.restrict_reason || 'تخلف از قوانین'}</p>
            {isTemp ? (
              <div className="mt-4">
                <p className="text-xs text-slate-500">زمان باقی‌مانده:</p>
                <p className="font-display text-2xl font-bold text-red-400">
                  {h > 0 && `${h}:`}
                  {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-red-400">مسدودیت دائمی</p>
            )}
          </>
        )}

        <button
          onClick={doLogout}
          className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
        >
          خروج از حساب
        </button>
      </motion.div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games" element={<Games />} />
      <Route path="/store" element={<Store />} />
      <Route path="/tournaments" element={<Tournaments />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/news" element={<News />} />
      <Route path="/stream" element={<Stream />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
      <Route path="/admin/lock" element={<AdminRoute><div className="mx-auto w-full max-w-3xl px-4 py-10"><SiteLockControl /></div></AdminRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ✅ بدون AuthProvider تودرتو — فقط یکبار در main.jsx ساخته شده
export default function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* سیستم‌های کمکی */}
      <SiteLockdown />
      <BanChecker />
      <DeletedAccountGuard />
      <WarningAlert />
      <NotificationPopup />

      {/* 🎨 انیمیشن‌های پس‌زمینه */}
      <BackgroundFX />
      <Particles count={50} />

      <ScrollToTop />
      <Navbar />

      <main className="flex-1">
        <AppRoutes />
      </main>

      {!isAuthPage && <Footer />}

      {/* 🎵 موزیک پلیر شناور — در همه صفحات فعال */}
      <MusicPlayer />
    </div>
  );
}