import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Moon } from 'lucide-react';

// ─────────── تبدیل اعداد انگلیسی به فارسی ───────────
const toPersianDigits = (str) =>
  String(str).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// ─────────── روزهای هفته فارسی ───────────
const PERSIAN_DAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

// ─────────── ماه‌های میلادی فارسی ───────────
const GREGORIAN_MONTHS = [
  'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
];

// ─────────── Hook داخلی (تاریخ و ساعت ایران) ───────────
function useIranianDateTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ساعت ایران
  const time = now.toLocaleTimeString('fa-IR', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // تاریخ میلادی
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const mm = parts.find((p) => p.type === 'month')?.value || '01';
  const dd = parts.find((p) => p.type === 'day')?.value || '01';
  const yyyy = parts.find((p) => p.type === 'year')?.value || '2026';
  const gregorian = `${toPersianDigits(dd)} ${GREGORIAN_MONTHS[parseInt(mm, 10) - 1]} ${toPersianDigits(yyyy)}`;

  // تاریخ قمری
  let hijri = '---';
  try {
    hijri = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', {
      timeZone: 'Asia/Tehran',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  } catch {
    hijri = '---';
  }

  // روز هفته
  const weekdayIdx = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' })
  ).getDay();
  const weekday = PERSIAN_DAYS[weekdayIdx] || '---';

  return { time, gregorian, hijri, weekday };
}

// ─────────── کامپوننت اصلی ───────────
export default function DateTimeBadge({ compact = false }) {
  const { time, gregorian, hijri, weekday } = useIranianDateTime();

  if (compact) {
    return (
      <div
        className="hidden items-center gap-2 rounded-xl border border-cyan-400/25 bg-slate-950/70 px-3 py-1.5 text-xs backdrop-blur sm:flex"
        style={{ boxShadow: '0 0 20px rgba(34,211,238,0.15)' }}
      >
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Clock size={13} />
          <span className="font-mono font-bold tabular-nums">{time}</span>
        </div>
        <div className="h-3 w-px bg-white/20" />
        <span className="font-bold text-amber-300">{weekday}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-cyan-400/25 bg-slate-950/70 px-5 py-3 backdrop-blur"
      style={{ boxShadow: '0 0 30px rgba(34,211,238,0.15)' }}
    >
      {/* ساعت */}
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950">
          <Clock size={16} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-500">ساعت ایران</p>
          <p className="font-mono text-sm font-bold tabular-nums text-cyan-300">{time}</p>
        </div>
      </div>

      <div className="h-8 w-px bg-white/10" />

      {/* روز هفته */}
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950">
          <Calendar size={16} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-500">روز</p>
          <p className="text-sm font-bold text-amber-300">{weekday}</p>
        </div>
      </div>

      <div className="h-8 w-px bg-white/10" />

      {/* میلادی */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-slate-500">میلادی</p>
        <p className="text-sm font-semibold text-white">{gregorian}</p>
      </div>

      <div className="h-8 w-px bg-white/10" />

      {/* قمری */}
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white">
          <Moon size={16} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-500">قمری</p>
          <p className="text-sm font-semibold text-fuchsia-300">{hijri}</p>
        </div>
      </div>
    </motion.div>
  );
}