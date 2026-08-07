import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import BackgroundFX from './components/fx/BackgroundFX';
import Particles from './components/fx/Particles';
import MusicPlayer from './components/music/MusicPlayer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './components/ui/Toast';
import { useAuth, getActiveRestriction } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Stream from './pages/Stream';
import Games from './pages/Games';
import Leaderboard from './pages/Leaderboard';
import Store from './pages/Store';
import Tournaments from './pages/Tournaments';
import News from './pages/News';
import Support from './pages/Support';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

// ✅ کامپوننت بن‌چکر: بررسی اینکه کاربر بن/حذف شده است
function BanChecker() {
  const { profile, logout } = useAuth();
  const restriction = getActiveRestriction(profile);

  // اگر کاربر حذف شده، logout خودکار
  useEffect(() => {
    if (profile?.deleted_at) {
      logout();
    }
  }, [profile?.deleted_at, logout]);

  if (restriction !== 'banned') return null;

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/95 backdrop-blur-xl">
      <div className="max-w-md p-6 text-center">
        <span className="text-6xl">🚫</span>
        <h2 className="mt-4 font-display text-2xl font-bold text-rose-400">حساب شما مسدود شده است</h2>
        <p className="mt-2 text-slate-400">
          {profile?.restrict_reason || 'برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.'}
        </p>
        {profile?.restrict_until && (
          <p className="mt-2 text-xs text-slate-500">
            تا: {new Date(profile.restrict_until).toLocaleString('fa-IR')}
          </p>
        )}
        <button
          onClick={logout}
          className="mt-6 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 px-6 py-3 font-display text-sm font-bold text-slate-950"
        >
          خروج
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col">
        <BanChecker />
        <BackgroundFX />
        <Particles count={40} />
        <ScrollToTop />
        <Navbar />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/games" element={<Games />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/store" element={<Store />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/news" element={<News />} />
              <Route path="/support" element={<Support />} />
              <Route path="/stream" element={<Stream />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </div>

        <Footer />
        <MusicPlayer />
      </div>
    </ToastProvider>
  );
}