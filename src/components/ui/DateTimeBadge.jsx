import { useEffect, useState } from 'react';
import { Clock3, CalendarDays, Globe2, Sun } from 'lucide-react';

/* ─────────── سلول کوچک نمایش ─────────── */
function Cell({ icon, label, value, accent = 'text-white', ltr = false }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-center">
      <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
        {icon}
        {label}
      </span>
      <span
        className={`font-display text-sm font-bold tabular-nums ${accent}`}
        dir={ltr ? 'ltr' : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/* ─────────── نشان تاریخ/ساعت — نسخه compact برای Navbar و کامل برای Footer ─────────── */
export default function DateTimeBadge({ compact = false }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 🕐 ساعت ایران
  const faTime = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tehran',
  }).format(now);

  // 📅 روز هفته
  const faWeekday = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    timeZone: 'Asia/Tehran',
  }).format(now);

  // ✅ تاریخ شمسی (جایگزین قمری شد)
  const faPersian = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Tehran',
  }).format(now);

  // 🌍 تاریخ میلادی
  const enGreg = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Tehran',
  }).format(now);

  /* ── نسخه compact (Navbar) ── */
  if (compact) {
    return (
      <div
        className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 lg:flex"
        title={`${faWeekday} • ${faPersian} • ${enGreg}`}
      >
        <Clock3 size={13} className="text-cyan-300" />
        <span className="font-display text-[11px] font-bold tabular-nums text-cyan-200">
          {faTime}
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="text-[10px] text-slate-400">
          {faWeekday} • {faPersian}
        </span>
      </div>
    );
  }

  /* ── نسخه کامل (Footer) ── */
  return (
    <div className="glass-strong rounded-2xl border border-white/10 p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cell icon={<Clock3 size={11} className="text-cyan-300" />} label="ساعت ایران" value={faTime} accent="text-cyan-200" />
        <Cell icon={<Sun size={11} className="text-amber-300" />} label="روز هفته" value={faWeekday} accent="text-amber-200" />
        <Cell icon={<CalendarDays size={11} className="text-fuchsia-300" />} label="تاریخ شمسی" value={faPersian} accent="text-fuchsia-200" />
        <Cell icon={<Globe2 size={11} className="text-emerald-300" />} label="تاریخ میلادی" value={enGreg} accent="text-emerald-200" ltr />
      </div>
    </div>
  );
}