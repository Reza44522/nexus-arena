import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Trash2, Users, CalendarClock, Coins, Swords, ChevronDown, ChevronUp, Radio, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const GAMES = [
  { id: 'mafia', name: 'مافیا', icon: '🕵️' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'csgo', name: 'CS:GO', icon: '💣' },
  { id: 'lol', name: 'League of Legends', icon: '⚔️' },
  { id: 'dota2', name: 'Dota 2', icon: '🛡️' },
  { id: 'pubg', name: 'PUBG', icon: '🎯' },
  { id: 'other', name: 'سایر', icon: '🎮' },
];

const BRACKETS = [
  { id: 'single', label: 'تک‌حذفی' },
  { id: 'double', label: 'دوحذفی' },
  { id: 'groups', label: 'گروهی' },
];

const STATUS_META = {
  upcoming: { label: 'پیش‌رو', cls: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' },
  live: { label: 'زنده', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
  completed: { label: 'پایان‌یافته', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
};

/* ─────────── تقویم شمسی ─────────── */
const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const YEAR_OPTIONS = [1404, 1405, 1406, 1407, 1408, 1409, 1410];
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/* تبدیل دقیق شمسی → ISO (با ICU مرورگر + ساعت تهران UTC+3:30) */
const persianFmt = new Intl.DateTimeFormat('en-US-u-ca-persian', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC',
});

function jalaliToISO(jy, jm, jd, hh, mm) {
  const DAY = 86400000;
  let lo = Math.floor(Date.UTC(2020, 0, 1) / DAY);
  let hi = Math.floor(Date.UTC(2040, 0, 1) / DAY);
  const target = jy * 10000 + jm * 100 + jd;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const parts = persianFmt.formatToParts(new Date(mid * DAY));
    const py = +parts.find((x) => x.type === 'year').value;
    const pm = +parts.find((x) => x.type === 'month').value;
    const pd = +parts.find((x) => x.type === 'day').value;
    if (py * 10000 + pm * 100 + pd < target) lo = mid + 1;
    else hi = mid;
  }
  const d = new Date(lo * DAY);
  // ساعت انتخابی = وقت تهران → تبدیل به UTC
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hh, mm) - 3.5 * 3600000).toISOString();
}

/* ─────────── TournamentsTab — مدیریت تورنومنت‌ها (ادمین) ─────────── */
export default function TournamentsTab() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [regs, setRegs] = useState({});
  const [form, setForm] = useState({
    title: '', game_name: 'mafia', description: '',
    jy: 1405, jm: 5, jd: 20, hh: 20, mm: 0,
    prize_pool: 100, max_teams: 16, bracket_type: 'single',
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = (t, m) => {
    setMsg({ t, m });
    setTimeout(() => setMsg(null), 3000);
  };

  /* ➕ ساخت تورنومنت */
  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return flash('err', '❌ عنوان تورنومنت الزامی است');
    setBusy(true);
    const startsAt = jalaliToISO(form.jy, form.jm, form.jd, form.hh, form.mm);
    const { error } = await supabase.from('tournaments').insert({
      title: form.title.trim(),
      game_name: form.game_name,
      description: form.description.trim() || null,
      starts_at: startsAt,
      prize_pool: Number(form.prize_pool) || 0,
      max_teams: Number(form.max_teams) || 16,
      registered_teams: 0,
      status: 'upcoming',
      bracket_type: form.bracket_type,
      created_by: user.id,
    });
    setBusy(false);
    if (error) return flash('err', '❌ ' + error.message);
    flash('ok', '✅ تورنومنت ساخته شد و برای همه کاربران نمایش داده می‌شود');
    setForm({ title: '', game_name: 'mafia', description: '', jy: 1405, jm: 5, jd: 20, hh: 20, mm: 0, prize_pool: 100, max_teams: 16, bracket_type: 'single' });
    load();
  };

  const setStatus = async (id, status) => {
    await supabase.from('tournaments').update({ status }).eq('id', id);
    load();
  };

  const remove = async (t) => {
    if (!window.confirm(`تورنومنت «${t.title}» حذف شود؟ همه ثبت‌نام‌ها هم حذف می‌شوند.`)) return;
    await supabase.from('tournaments').delete().eq('id', t.id);
    load();
  };

  const toggleRegs = async (id) => {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    const { data } = await supabase
      .from('tournament_registrations')
      .select('*, user:profiles(username)')
      .eq('tournament_id', id)
      .order('created_at');
    setRegs((r) => ({ ...r, [id]: data || [] }));
  };

  const inputCls = 'w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50';
  const labelCls = 'mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500';
  const selCls = 'w-full rounded-md border border-white/10 bg-black/40 px-2 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50';

  return (
    <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
      {/* ─────────── فرم ساخت ─────────── */}
      <motion.form
        onSubmit={create}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('relative h-fit border border-fuchsia-400/25 bg-[#070b18]/85 p-6 backdrop-blur-xl', CLIP)}
      >
        <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
        <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />

        <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
          <Plus className="h-5 w-5 text-fuchsia-400" />
          <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-white">ساخت تورنومنت</h2>
        </div>

        <label className={labelCls}>عنوان *</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً: جام سایبری تابستان" className={inputCls} />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>بازی</label>
            <select value={form.game_name} onChange={(e) => setForm({ ...form, game_name: e.target.value })} className={selCls} style={{ colorScheme: 'dark' }}>
              {GAMES.map((g) => (
                <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>فرمت برکت</label>
            <select value={form.bracket_type} onChange={(e) => setForm({ ...form, bracket_type: e.target.value })} className={selCls} style={{ colorScheme: 'dark' }}>
              {BRACKETS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 📅 زمان شروع — شمسی */}
        <label className={cn(labelCls, 'mt-4')}>📅 زمان شروع (شمسی)</label>
        <div className="grid grid-cols-3 gap-2">
          <select value={form.jy} onChange={(e) => setForm({ ...form, jy: +e.target.value })} className={selCls} style={{ colorScheme: 'dark' }}>
            {YEAR_OPTIONS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <select value={form.jm} onChange={(e) => setForm({ ...form, jm: +e.target.value })} className={selCls} style={{ colorScheme: 'dark' }}>
            {PERSIAN_MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
          </select>
          <select value={form.jd} onChange={(e) => setForm({ ...form, jd: +e.target.value })} className={selCls} style={{ colorScheme: 'dark' }}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select value={form.hh} onChange={(e) => setForm({ ...form, hh: +e.target.value })} className={selCls} style={{ colorScheme: 'dark' }}>
            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
              <option key={h} value={h}>ساعت {String(h).padStart(2, '0')}</option>
            ))}
          </select>
          <select value={form.mm} onChange={(e) => setForm({ ...form, mm: +e.target.value })} className={selCls} style={{ colorScheme: 'dark' }}>
            {MINUTE_OPTIONS.map((m) => (
              <option key={m} value={m}>دقیقه {String(m).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          معادل میلادی: {new Date(jalaliToISO(form.jy, form.jm, form.jd, form.hh, form.mm)).toLocaleDateString('en-GB')}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>جایزه (سکه)</label>
            <input type="number" min="0" value={form.prize_pool} onChange={(e) => setForm({ ...form, prize_pool: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>حداکثر تیم</label>
            <input type="number" min="2" value={form.max_teams} onChange={(e) => setForm({ ...form, max_teams: e.target.value })} className={inputCls} />
          </div>
        </div>

        <label className={cn(labelCls, 'mt-4')}>توضیحات</label>
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="قوانین و جوایز..." className={cn(inputCls, 'resize-none')} />

        {msg && (
          <p className={cn('mt-3 text-xs font-bold', msg.t === 'ok' ? 'text-emerald-400' : 'text-red-400')}>{msg.m}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            'mt-4 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_26px_rgba(232,121,249,0.35)] transition-all hover:shadow-[0_0_40px_rgba(232,121,249,0.55)] disabled:opacity-50',
            CLIP_SM
          )}
        >
          {busy ? '⏳ در حال ساخت...' : (<><Trophy size={14} /> انتشار تورنومنت</>)}
        </button>
      </motion.form>

      {/* ─────────── لیست تورنومنت‌ها ─────────── */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid place-items-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-12 text-center text-slate-400', CLIP)}>
            هنوز تورنومنتی نساختی — از فرم سمت راست شروع کن! 🏟
          </div>
        ) : (
          list.map((t, i) => {
            const g = GAMES.find((x) => x.id === t.game_name) || GAMES[6];
            const st = STATUS_META[t.status] || STATUS_META.upcoming;
            const full = (t.registered_teams || 0) >= t.max_teams;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn('relative border border-white/10 bg-[#070b18]/85 p-5 backdrop-blur-xl transition-colors hover:border-cyan-400/30', CLIP)}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-cyan-400/40" />

                <div className="flex flex-wrap items-center gap-4">
                  <div className={cn('grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 text-2xl', CLIP_SM)}>
                    {g.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold text-white">{t.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarClock size={11} />
                        {new Date(t.starts_at || t.created_at).toLocaleString('fa-IR')}
                      </span>
                      <span className="flex items-center gap-1"><Coins size={11} className="text-amber-400" /> {Number(t.prize_pool || 0).toLocaleString('fa-IR')} سکه</span>
                      <span className={cn('flex items-center gap-1', full ? 'text-red-400' : 'text-slate-400')}>
                        <Users size={11} /> {t.registered_teams || 0}/{t.max_teams} تیم
                      </span>
                      <span className="flex items-center gap-1"><Swords size={11} /> {BRACKETS.find((b) => b.id === t.bracket_type)?.label || 'تک‌حذفی'}</span>
                    </p>
                  </div>
                  <span className={cn('border px-2.5 py-1 text-[10px] font-bold', CLIP_SM, st.cls)}>
                    {t.status === 'live' && <Radio size={10} className="mr-1 inline animate-pulse" />}
                    {st.label}
                  </span>
                </div>

                {/* اکشن‌ها */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">وضعیت:</span>
                  {Object.keys(STATUS_META).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(t.id, s)}
                      className={cn(
                        'border px-2.5 py-1 text-[10px] font-bold transition',
                        CLIP_SM,
                        t.status === s ? STATUS_META[s].cls : 'border-white/10 text-slate-500 hover:text-white'
                      )}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                  <div className="mr-auto flex gap-2">
                    <button
                      onClick={() => toggleRegs(t.id)}
                      className={cn('flex items-center gap-1 border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-400/20', CLIP_SM)}
                    >
                      {expanded === t.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      تیم‌ها ({t.registered_teams || 0})
                    </button>
                    <button
                      onClick={() => remove(t)}
                      className={cn('grid h-7 w-7 place-items-center border border-red-400/30 bg-red-400/10 text-red-400 transition hover:bg-red-400/20', CLIP_SM)}
                      title="حذف"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* لیست تیم‌ها */}
                <AnimatePresence>
                  {expanded === t.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                        {(regs[t.id] || []).length === 0 ? (
                          <p className="py-3 text-center text-xs text-slate-500">هنوز تیمی ثبت‌نام نکرده</p>
                        ) : (
                          (regs[t.id] || []).map((r, idx) => (
                            <div key={r.id} className={cn('flex items-center gap-3 border border-white/5 bg-white/5 px-3 py-2', CLIP_SM)}>
                              <span className="font-display text-[10px] font-black text-cyan-400">#{idx + 1}</span>
                              <span className="flex-1 text-xs font-bold text-white">{r.team_name}</span>
                              <span className="text-[10px] text-slate-500">{r.user?.username || '—'}</span>
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}