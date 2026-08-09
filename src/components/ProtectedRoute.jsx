import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  // undefined = هنوز در حال بررسی سشن
  const [sessionUser, setSessionUser] = useState(undefined);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSessionUser(data?.session?.user || null);
    });
    return () => { mounted = false; };
  }, []);

  // ⏳ هنوز داریم سشن رو چک می‌کنیم → صفحه لودینگ (نه ریدایرکت!)
  if (sessionUser === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05050e]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  // ❌ واقعاً سشن وجود نداره → برو ورود
  if (!sessionUser && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ⏳ سشن هست ولی AuthContext هنوز داره user رو ست می‌کنه → صبر کن
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05050e]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return children;
}