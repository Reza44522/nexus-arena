import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const [check, setCheck] = useState({ ready: false, userId: null, isAdmin: false });

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      // ۱) چک کردن سشن
      const { data } = await supabase.auth.getSession();
      const su = data?.session?.user || null;
      if (!su) {
        if (mounted) setCheck({ ready: true, userId: null, isAdmin: false });
        return;
      }
      // ۲) چک کردن نقش ادمین مستقیم از دیتابیس (مستقل از AuthContext)
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', su.id)
        .maybeSingle();
      if (mounted) setCheck({ ready: true, userId: su.id, isAdmin: prof?.role === 'admin' });
    };
    run();
    return () => { mounted = false; };
  }, []);

  // ⏳ در حال بررسی
  if (!check.ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05050e]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  // ❌ لاگین نکرده → برو ورود
  if (!check.userId && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ❌ لاگین کرده ولی ادمین نیست → برو خانه
  if (!check.isAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // ⏳ ادمینه ولی AuthContext هنوز پروفایل رو نیاورده → صبر کن
  if (!user || !profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05050e]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  return children;
}