import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Image as ImageIcon, X, Trash2, Stamp, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── Statements — مجمع بیانیه‌های رسمی ───────────
   ✅ فقط بیانیه با فرمت ثابت — بدون چت و کامنت
──────────────────────────────────────────────────────── */
export default function Statements() {
  const { user, profile } = useAuth();
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  const load = async () => {
    const { data, error } = await supabase
      .from('statements')
      .select('*, user:profiles(username), country:player_countries(name_fa, flag)')
      .order('created_at', { ascending: false })
      .limit(60);
    if (error) console.error('❌ statements:', error.message);
    setStatements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('statements-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statements' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const onPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return flash('❌ فقط عکس مجاز است');
    if (f.size > 5 * 1024 * 1024) return flash('❌ حجم عکس حداکثر ۵MB است');
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (title.trim().length < 5) return flash('❌ موضوع بیانیه حداقل ۵ کاراکتر باشد');
    if (body.trim().length < 20) return flash('❌ متن بیانیه حداقل ۲۰ کاراکتر باشد');
    setBusy(true);
    let photoUrl = null;
    if (photo) {
      const path = `${user.id}/${Date.now()}-${photo.name.replace(/[^\w.\-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('statements-media').upload(path, photo);
      if (upErr) { setBusy(false); return flash('❌ آپلود عکس ناموفق: ' + upErr.message); }
      photoUrl = supabase.storage.from('statements-media').getPublicUrl(path).data.publicUrl;
    }
    const { data, error } = await supabase.rpc('send_statement', {
      p_photo_url: photoUrl,
      p_title: title.trim(),
      p_body: body.trim(),
    });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    setShowForm(false);
    setTitle(''); setBody(''); setPhoto(null); setPreview(null);
    flash('✅ بیانیه رسمی شما منتشر شد');
    load();
  };

  const remove = async (s) => {
    if (!window.confirm('این بیانیه حذف شود؟')) return;
    const { error } = await supabase.from('statements').delete().eq('id', s.id);
    if (error) return flash('❌ ' + error.message);
    flash('✅ بیانیه حذف شد');
    load();
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
          92% { text-shadow: -2px 0 #e879f9, 2px 0 #22d3ee; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #e879f9, -2px 0 #22d3ee; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
        }
      `}</style>

      {/* صحنه */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-x-0 bottom-0 h-[42vh]"
          style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[130px]" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {notice && (
          <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM)}>
              {notice}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-5xl">
        {/* هدر HUD */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-amber-400/70">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
              UN Assembly // Official Statements
            </p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
              بیانیه‌های <span className="text-gradient">رسمی</span>
            </h1>
            <p className="mt-3 text-sm text-slate-500">فقط بیانیه رسمی با فرمت ثابت — اینجا چت و گفتگو نیست. 📜</p>
          </div>
          {user && (
            <button
              onClick={() => setShowForm(true)}
              className={cn('flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.4)] transition-all hover:shadow-[0_0_36px_rgba(251,191,36,0.6)]', CLIP_SM)}
            >
              <Stamp size={14} /> صدور بیانیه
            </button>
          )}
        </div>

        {/* لیست بیانیه‌ها */}
        {loading ? (
          <div className="grid place-items-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          </div>
        ) : statements.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-14 text-center text-slate-400', CLIP)}>
            <ScrollText className="mx-auto mb-3 h-12 w-12 opacity-30" />
            هنوز بیانیه‌ای صادر نشده — اولین باش! 📜
          </div>
        ) : (
          <div className="space-y-6">
            {statements.map((s, i) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn('group relative border border-amber-400/25 bg-[#070b18]/90 p-6 backdrop-blur-xl transition-colors hover:border-amber-400/45', CLIP)}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-amber-400/50" />
                <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-amber-400/50" />

                {/* سربرگ رسمی */}
                <div className="flex flex-wrap items-center gap-3 border-b border-dashed border-white/15 pb-4">
                  <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-2xl', CLIP_SM)}>
                    {s.country?.flag || '🌐'}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-sm font-black text-white">
                      بیانیه رسمی کشور {s.country?.name_fa || '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      صادرکننده: {s.user?.username || '—'} • {new Date(s.created_at).toLocaleString('fa-IR')}
                    </p>
                  </div>
                  {(user?.id === s.user_id || profile?.role === 'admin') && (
                    <button onClick={() => remove(s)} className="grid h-8 w-8 place-items-center text-red-400 opacity-0 transition hover:bg-red-400/10 group-hover:opacity-100" title="حذف بیانیه">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* عکس کشور */}
                {s.photo_url && (
                  <div className="mt-4 overflow-hidden rounded-md border border-white/10">
                    <img src={s.photo_url} alt={s.title} className="max-h-80 w-full object-cover" />
                  </div>
                )}

                {/* متن بیانیه */}
                <h2 className="mt-4 font-display text-xl font-black text-amber-300">موضوع: {s.title}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{s.body}</p>

                {/* مهر رسمی */}
                <div className="mt-5 flex items-center justify-end">
                  <span className={cn('flex rotate-[-6deg] items-center gap-1.5 border-2 border-dashed border-amber-400/40 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-amber-300/80', CLIP_SM)}>
                    <Landmark size={11} /> Official // Nexus Arena
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* ─────────── مودال صدور بیانیه ─────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, rotateX: -70, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
              onClick={(e) => e.stopPropagation()}
              className={cn('relative max-h-[90vh] w-full max-w-lg overflow-y-auto border border-amber-400/40 bg-[#070b18]/95 p-6 backdrop-blur-2xl', CLIP)}
            >
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-amber-400/60" />
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-amber-300">
                  <Stamp size={13} /> صدور بیانیه رسمی
                </p>
                <button onClick={() => setShowForm(false)} className="grid h-7 w-7 place-items-center text-slate-500 transition hover:text-white"><X size={14} /></button>
              </div>

              <p className="mt-3 rounded-md border border-amber-400/20 bg-amber-400/5 p-2.5 text-[10px] leading-5 text-amber-200/80">
                ⚠️ قوانین: فقط بیانیه رسمی با فرمت ثابت (موضوع + متن). هرگونه چت، توهین یا متن غیررسمی توسط ادمین حذف می‌شود.
              </p>

              <label className="mb-1.5 mt-4 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">موضوع بیانیه *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: اعلام اتحاد با کشور همسایه"
                maxLength={120}
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-amber-400/50"
              />

              <label className="mb-1.5 mt-4 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">متن بیانیه * (حداقل ۲۰ کاراکتر)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder={'بدین‌وسیله دولت ... اعلام می‌دارد:\n\n۱) ...\n۲) ...\n\nبا احترام — وزارت امور خارجه'}
                maxLength={2000}
                className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-700 focus:border-amber-400/50"
              />

              <label className="mb-1.5 mt-4 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">عکس کشور (اختیاری ≤۵MB)</label>
              <label className={cn('flex cursor-pointer items-center justify-center gap-2 border border-dashed border-amber-400/30 bg-amber-400/5 py-4 text-xs font-bold text-amber-300 transition hover:bg-amber-400/10', CLIP_SM)}>
                <ImageIcon size={14} /> انتخاب عکس
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
              {preview && (
                <div className="relative mt-3 overflow-hidden rounded-md border border-white/10">
                  <img src={preview} alt="preview" className="max-h-44 w-full object-cover" />
                  <button onClick={() => { setPhoto(null); setPreview(null); }} className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-black/70 text-red-400 transition hover:bg-black/90">
                    <X size={13} />
                  </button>
                </div>
              )}

              <button
                onClick={submit}
                disabled={busy}
                className={cn('mt-5 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_26px_rgba(251,191,36,0.4)] transition-all hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] disabled:opacity-50', CLIP_SM)}
              >
                {busy ? '⏳ در حال انتشار...' : (<><Stamp size={14} /> انتشار بیانیه رسمی</>)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}