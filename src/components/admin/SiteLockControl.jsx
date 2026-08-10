import { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Unlock, Wrench, Loader2, CalendarClock, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

/* ─────────── تبدیل تاریخ شمسی به میلادی (الگوریتم فشرده و دقیق) ─────────── */
function jalaaliToGregorian(jy, jm, jd) {
  jy += 1595;
  let days =
    -355668 +
    365 * jy +
    ~~(jy / 33) * 8 +
    ~~(((jy % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * ~~(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * ~~(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return { gy, gm, gd };
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const toFa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

/* تاریخ شمسی امروز */
function nowJalali() {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    timeZone: 'Asia/Tehran',
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
  return { jy: get('year'), jm: get('month'), jd: get('day') };
}

/* ─────────── پنل کنترل قفل سایت ─────────── */
export default function SiteLockControl() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState(null);
  const [mode, setMode] = useState('timed'); // timed | maintenance
  const init = nowJalali();
  const [jy, setJy] = useState(init.jy);
  const [jm, setJm] = useState(init.jm);
  const [jd, setJd] = useState(init.jd);
  const [hh, setHh] = useState('23');
  const [mm, setMm] = useState('59');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (data) {
      setSettings(data);
      setMessage(data.lock_message || '');
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* پیش‌نمایش تبدیل شمسی → میلادی (ساعت ایران = UTC+3:30 ثابت) */
  const preview = useMemo(() => {
    const g = jalaaliToGregorian(Number(jy), Number(jm), Number(jd));
    const utcMs = Date.UTC(g.gy, g.gm - 1, g.gd, Number(hh) || 0, Number(mm) || 0) - 3.5 * 3600000;
    return { g, iso: new Date(utcMs).toISOString(), ms: utcMs };
  }, [jy, jm, jd, hh, mm]);

  const lock = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'timed' && preview.ms <= Date.now()) {
        setMsg({ type: 'err', text: 'تاریخ انتخابی در گذشته است — تاریخ آینده انتخاب کن.' });
        return;
      }
      const { error } = await supabase
        .from('site_settings')
        .update({
          is_locked: true,
          lock_until: mode === 'timed' ? preview.iso : null,
          lock_message: message.trim() || null,
          locked_by: profile?.username || 'Admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      if (error) throw new Error(error.message);
      setMsg({
        type: 'ok',
        text: mode === 'timed' ? '🔒 سایت با شمارش معکوس قفل شد.' : '🔒 سایت برای آپگرید قفل شد (بدون تاریخ).',
      });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ is_locked: false, updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (error) throw new Error(error.message);
      setMsg({ type: 'ok', text: '🔓 سایت باز شد.' });
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const locked = settings?.is_locked === true;

  return (
    <div className="glass-strong rounded-3xl border border-amber-500/20 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20">
          <ShieldCheck className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <h3 className="font-display text-base font-black text-white">قفل سراسری سایت</h3>
          <p className="text-[11px] text-slate-400">بستن سایت با شمارش معکوس یا حالت آپگرید — ورود فقط برای ادمین</p>
        </div>
      </div>

      {/* وضعیت فعلی */}
      <div
        className={`mb-5 rounded-2xl border p-4 text-sm font-bold ${
          !locked
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : settings?.lock_until
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        }`}
      >
        {!locked
          ? '🟢 سایت باز است'
          : settings?.lock_until
            ? `🔴 قفل زمان‌دار — تا: ${new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(settings.lock_until))} • توسط ${settings.locked_by || 'ادمین'}`
            : `🟠 قفل آپگرید (بدون تاریخ) • توسط ${settings?.locked_by || 'ادمین'}`}
      </div>

      {/* انتخاب حالت */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('timed')}
          className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition ${
            mode === 'timed'
              ? 'border-red-500/50 bg-red-500/15 text-red-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <CalendarClock size={14} />
          قفل با تاریخ شمسی
        </button>
        <button
          onClick={() => setMode('maintenance')}
          className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition ${
            mode === 'maintenance'
              ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <Wrench size={14} />
          قفل آپگرید (بدون تاریخ)
        </button>
      </div>

      {/* انتخاب تاریخ شمسی */}
      {mode === 'timed' && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs font-bold text-slate-300">📅 تاریخ و ساعت بازگشایی (شمسی):</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <select value={jy} onChange={(e) => setJy(Number(e.target.value))} className="rounded-xl border border-white/10 bg-[#0b0714] px-2 py-2 text-xs text-white focus:outline-none">
              {Array.from({ length: 8 }, (_, i) => init.jy + i).map((y) => (
                <option key={y} value={y}>{toFa(y)}</option>
              ))}
            </select>
            <select value={jm} onChange={(e) => setJm(Number(e.target.value))} className="rounded-xl border border-white/10 bg-[#0b0714] px-2 py-2 text-xs text-white focus:outline-none">
              {JALALI_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select value={jd} onChange={(e) => setJd(Number(e.target.value))} className="rounded-xl border border-white/10 bg-[#0b0714] px-2 py-2 text-xs text-white focus:outline-none">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{toFa(d)}</option>
              ))}
            </select>
            <input type="number" min="0" max="23" value={hh} onChange={(e) => setHh(e.target.value)} className="rounded-xl border border-white/10 bg-[#0b0714] px-2 py-2 text-center text-xs text-white focus:outline-none" title="ساعت" />
            <input type="number" min="0" max="59" value={mm} onChange={(e) => setMm(e.target.value)} className="rounded-xl border border-white/10 bg-[#0b0714] px-2 py-2 text-center text-xs text-white focus:outline-none" title="دقیقه" />
          </div>
          <p className="mt-3 text-[11px] text-slate-400" dir="ltr">
            = {preview.g.gy}/{String(preview.g.gm).padStart(2, '0')}/{String(preview.g.gd).padStart(2, '0')} — {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')} (Tehran)
          </p>
        </div>
      )}

      {/* توضیحات اضافی (هر دو حالت) */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-bold text-slate-300">📢 توضیحات اضافی (نمایش به کاربران):</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="مثلاً: در حال به‌روزرسانی فروشگاه و تورنومنت‌ها هستیم..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
        />
      </div>

      {/* پیام نتیجه */}
      {msg && (
        <p className={`mb-3 text-xs font-bold ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg.text}
        </p>
      )}

      {/* دکمه‌ها */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={lock}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 py-3 text-sm font-black text-slate-950 transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <LockKeyhole size={15} />}
          قفل کردن سایت
        </button>
        <button
          onClick={unlock}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          <Unlock size={15} />
          باز کردن سایت
        </button>
      </div>
    </div>
  );
}