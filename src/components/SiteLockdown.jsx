import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LockKeyhole, ShieldCheck, LogIn, X, Loader2, Wrench, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import DateTimeBadge from './ui/DateTimeBadge';

/* تبدیل اعداد به فارسی */
const toFa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const pad = (n) => String(n).padStart(2, '0');

/* ─────────── نگهبان سراسری قفل سایت ───────────
   - حالت زمان‌دار: شمارش معکوس تا تاریخ شمسی انتخابی ادمین
   - حالت آپگرید: بدون تاریخ (تا بازکردن توسط ادمین)
   - ورود مخصوص ادمین در هر دو حالت
   - نمایش تاریخ/ساعت در هر دو حالت
─────────────────────────────────────────────── */
export default function SiteLockdown() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [settings, setSettings] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [adminOpen, setAdminOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const isAdmin = profile?.role === 'admin';

  /* 📡 بارگذاری تنظیمات + Realtime */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (data) setSettings(data);
    };
    load();

    const channel = supabase
      .channel('site-lockdown')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
        if (payload.new) setSettings(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* ⏱ تیک هر ثانیه */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* 🔐 ورود مخصوص ادمین */
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setErr('ایمیل یا رمز اشتباه است');
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('role, deleted_at')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!prof || prof.deleted_at || prof.role !== 'admin') {
        await supabase.auth.signOut();
        setErr('⛔ فقط ادمین می‌تواند در زمان قفل سایت وارد شود');
        return;
      }
      // ادمین معتبر: AuthContext خودکار آپدیت می‌شود و قفل برایش باز می‌شود
    } catch {
      setErr('خطایی رخ داد، دوباره تلاش کن');
    } finally {
      setBusy(false);
    }
  };

  /* ── منطق نمایش ── */
  const locked = settings?.is_locked === true;
  const timed = locked && !!settings?.lock_until;
  const expired = timed && now >= new Date(settings.lock_until).getTime();
  const active = locked && !expired;

  if (!active) return null;

  // تا وقتی سشن در حال لود است، صفحه خالی نشان نده
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-[20000] grid place-items-center bg-[#050510]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // ادمین = عبور آزاد
  if (isAdmin) return null;

  /* شمارش معکوس */
  let cd = null;
  if (timed) {
    const diff = Math.max(0, new Date(settings.lock_until).getTime() - now);
    cd = {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  }

  const untilFa = timed
    ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Tehran',
      }).format(new Date(settings.lock_until))
    : null;

  return (
    <div className="fixed inset-0 z-[20000] overflow-y-auto bg-[#050510]">
      <style>{`@keyframes stripe-move { to { background-position: 24px 0; } }`}</style>

      {/* نوار هشدار بالای صفحه */}
      <div className="fixed inset-x-0 top-0 z-10 h-1.5 animate-[stripe-move_1s_linear_infinite] bg-[repeating-linear-gradient(45deg,#f59e0b_0,#f59e0b_12px,#78350f_12px,#78350f_24px)]" />

      {/* نورهای پس‌زمینه */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.12),transparent_50%),radial-gradient(circle_at_80%_90%,rgba(239,68,68,0.1),transparent_50%)]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center gap-5 px-4 py-10">
        {/* آیکون قفل */}
        <div className="relative h-24 w-24">
          <motion.span
            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-amber-500/30"
          />
          <div className="relative grid h-24 w-24 place-items-center rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-red-500/20 shadow-[0_0_60px_rgba(245,158,11,0.35)]">
            {timed ? (
              <LockKeyhole className="h-10 w-10 text-amber-300" />
            ) : (
              <Wrench className="h-10 w-10 text-amber-300" />
            )}
          </div>
        </div>

        <h1 className="text-center font-display text-2xl font-black text-white sm:text-3xl">
          NEXUS ARENA <span className="text-amber-400">موقتاً قفل است</span>
        </h1>

        <p className="text-center text-sm text-slate-400">
          {timed
            ? 'سایت تا پایان شمارش معکوس در دسترس نخواهد بود.'
            : 'سایت به‌دلیل آپگرید و تغییرات فنی موقتاً بسته است.'}
        </p>

        {/* ⏳ شمارش معکوس (حالت زمان‌دار) */}
        {timed && cd && (
          <>
            <div className="grid w-full grid-cols-4 gap-2">
              {[
                { v: cd.d, l: 'روز' },
                { v: cd.h, l: 'ساعت' },
                { v: cd.m, l: 'دقیقه' },
                { v: cd.s, l: 'ثانیه' },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl border border-amber-500/30 bg-amber-500/10 py-3 text-center">
                  <p className="font-display text-2xl font-black tabular-nums text-amber-300">
                    {toFa(pad(x.v))}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">{x.l}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-amber-200/80">🔓 بازگشایی: {untilFa}</p>
          </>
        )}

        {/* 🔧 حالت آپگرید بدون تاریخ */}
        {!timed && (
          <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
            <p className="text-sm font-bold text-amber-200">در حال انجام تغییرات هستیم</p>
            <p className="mt-1 text-xs text-slate-400">زمان دقیق بازگشایی به‌زودی اعلام می‌شود.</p>
          </div>
        )}

        {/* 📢 توضیحات اضافی ادمین */}
        {settings?.lock_message && (
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-1 text-[11px] font-bold text-cyan-300">📢 پیام مدیریت:</p>
            <p className="text-sm leading-6 text-slate-300">{settings.lock_message}</p>
          </div>
        )}

        {/* 🕐 تاریخ و ساعت (در هر دو حالت) */}
        <div className="w-full">
          <DateTimeBadge />
        </div>

        {/* 🔐 ورود مخصوص ادمین */}
        <div className="w-full">
          <button
            onClick={() => setAdminOpen((v) => !v)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {adminOpen ? <X size={14} /> : <ShieldCheck size={14} className="text-amber-300" />}
            {adminOpen ? 'بستن' : 'ورود مخصوص ادمین'}
          </button>

          <AnimatePresence>
            {adminOpen && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAdminLogin}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2 rounded-2xl border border-amber-500/30 bg-[#0b0714]/90 p-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ایمیل ادمین"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                  />
                  {err && <p className="text-xs font-bold text-red-400">{err}</p>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 py-2.5 text-sm font-black text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                    ورود ادمین
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* خروج کاربر عادی لاگین‌کرده */}
        {user && (
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 transition hover:text-red-400"
          >
            <LogOut size={12} />
            خروج از حساب فعلی
          </button>
        )}
      </div>
    </div>
  );
}