import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // ⏳ تا وقتی در حال لود هستیم، چیزی نشان نده (جلوگیری از ریدایرکت اشتباه)
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="mt-4 font-display text-sm text-slate-400">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  // ❌ اگر لاگین نیست، به صفحه ورود برو
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ❌ اگر ادمین نیست، به صفحه اصلی برگرد
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ✅ ادمین است، اجازه بده
  return children;
}