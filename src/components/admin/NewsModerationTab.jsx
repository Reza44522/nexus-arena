import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, CheckCircle2, XCircle, Trash2, Eye, Image as ImageIcon, Video, Hourglass, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const STATUS_META = {
  pending: { label: 'در انتظار', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  approved: { label: 'منتشرشده', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  rejected: { label: 'ردشده', cls: 'border-red-400/40 bg-red-400/10 text-red-400' },
};

const toFa = (n) => String(n ?? 0).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

/* ─────────── NewsModerationTab — تأیید و مدیریت پست‌ها ─────────── */
export default function NewsModerationTab() {
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [openMedia, setOpenMedia] = useState(null);

  const flash = (t, m) => {
    setMsg({ t, m });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    const [p, a] = await Promise.all([
      supabase.from('news_posts').select('*, author:profiles(username)').eq('status', 'pending').order('created_at'),
      supabase.from('news_posts').select('*, author:profiles(username)').order('created_at', { ascending: false }).limit(40),
    ]);
    setPending(p.data || []);
    setAll(a.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('news-mod')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_posts' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const setStatus = async (id, status) => {
    await supabase.from('news_posts').update({ status }).eq('id', id);
    flash(status === 'approved' ? 'ok' : 'err', status === 'approved' ? '✅ پست تأیید و منتشر شد' : '❌ پست رد شد');
    load();
  };

  const remove = async (p) => {
    if (!window.confirm(`پست «${p.title}» برای همیشه حذف شود؟`)) return;
    await supabase.from('news_posts').delete().eq('id', p.id);
    flash('ok', '✅ پست حذف شد');
    load();
  };

  const PostCard = ({ p, showActions }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('relative border border-white/10 bg-[#070b18]/85 p-5 backdrop-blur-xl transition-colors hover:border-cyan-400/30', CLIP)}
    >
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-cyan-400/40" />

      <div className="flex flex-wrap items-start gap-4">
        {/* بندانگشتی مدیا */}
        {p.media_url ? (
          <button
            onClick={() => setOpenMedia(openMedia === p.id ? null : p.id)}
            className={cn('relative grid h-16 w-24 shrink-0 place-items-center overflow-hidden border border-white/10 bg-black/50', CLIP_SM)}
            title="پیش‌نمایش"
          >
            {p.media_type === 'video' ? (
              <Video size={18} className="text-cyan-300" />
            ) : (
              <img src={p.media_url} alt="" className="h-full w-full object-cover" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Eye size={14} className="text-white" />
            </span>
          </button>
        ) : (
          <div className={cn('grid h-16 w-24 shrink-0 place-items-center border border-white/10 bg-white/5 text-slate-600', CLIP_SM)}>
            <Newspaper size={18} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-bold text-white">{p.title}</p>
            <span className={cn('border px-2 py-0.5 text-[9px] font-bold', CLIP_SM, STATUS_META[p.status]?.cls || STATUS_META.pending.cls)}>
              {STATUS_META[p.status]?.label || p.status}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{p.content}</p>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
            <span>✍️ {p.author?.username || '—'}</span>
            <span>📅 {new Date(p.created_at).toLocaleString('fa-IR')}</span>
            <span className="flex items-center gap-1"><Eye size={10} /> {toFa(p.views)}</span>
            <span className="flex items-center gap-1 text-emerald-400"><ThumbsUp size={10} /> {toFa(p.likes)}</span>
            <span className="flex items-center gap-1 text-red-400"><ThumbsDown size={10} /> {toFa(p.dislikes)}</span>
          </p>
        </div>

        {/* اکشن‌ها */}
        <div className="flex shrink-0 flex-col gap-2">
          {showActions && (
            <>
              <button
                onClick={() => setStatus(p.id, 'approved')}
                className={cn('flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-400/20 hover:shadow-[0_0_14px_rgba(52,211,153,0.4)]', CLIP_SM)}
              >
                <CheckCircle2 size={12} /> تأیید و انتشار
              </button>
              <button
                onClick={() => setStatus(p.id, 'rejected')}
                className={cn('flex items-center gap-1.5 border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/20', CLIP_SM)}
              >
                <XCircle size={12} /> رد کردن
              </button>
            </>
          )}
          <button
            onClick={() => remove(p)}
            className={cn('flex items-center gap-1.5 border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-[10px] font-bold text-red-400 transition hover:bg-red-400/20', CLIP_SM)}
          >
            <Trash2 size={12} /> حذف
          </button>
        </div>
      </div>

      {/* پیش‌نمایش بزرگ مدیا */}
      <AnimatePresence>
        {openMedia === p.id && p.media_url && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 overflow-hidden rounded-md border border-white/10">
              {p.media_type === 'video' ? (
                <video src={p.media_url} controls className="max-h-72 w-full bg-black" />
              ) : (
                <img src={p.media_url} alt={p.title} className="max-h-72 w-full object-cover" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {msg && (
        <div className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white', CLIP_SM, msg.t === 'ok' ? 'border-emerald-400/40' : 'border-red-400/40')}>
          {msg.m}
        </div>
      )}

      {/* ─────────── در انتظار تأیید ─────────── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Hourglass className="h-5 w-5 text-amber-400" />
          <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-white">
            در انتظار تأیید ({toFa(pending.length)})
          </h2>
        </div>
        {loading ? (
          <div className="grid place-items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        ) : pending.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-10 text-center text-slate-400', CLIP)}>
            ✅ هیچ پستی در صف تأیید نیست
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((p) => (
              <PostCard key={p.id} p={p} showActions />
            ))}
          </div>
        )}
      </section>

      {/* ─────────── همه پست‌ها ─────────── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-cyan-300" />
          <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-white">همه پست‌ها ({toFa(all.length)})</h2>
        </div>
        <div className="space-y-4">
          {all.map((p) => (
            <PostCard key={p.id} p={p} showActions={p.status !== 'approved'} />
          ))}
        </div>
      </section>
    </div>
  );
}