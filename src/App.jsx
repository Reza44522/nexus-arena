import AdminRoute from './components/AdminRoute';
import Admin from './pages/Admin';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import BackgroundFX from './components/fx/BackgroundFX';
import MusicPlayer from './components/music/MusicPlayer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Stream from './pages/Stream';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundFX />
      <ScrollToTop />
      <Navbar />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
  <Route path="/stream" element={<Stream />} />
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
      {/* Floating player lives OUTSIDE Routes so it never resets between pages */}
      <MusicPlayer />
    </div>
  );
}