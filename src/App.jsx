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

export default function App() {
  const location = useLocation();

  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col">
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