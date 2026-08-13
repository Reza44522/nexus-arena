import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, ThumbsUp, ThumbsDown, Plus, X, Image as ImageIcon, Video,
  Newspaper, Clock, CheckCircle2, Hourglass, ShieldAlert, User,
  MessageSquare, Send, Trash2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const CATEGORIES = [
  { id: 'all', label: 'همه' },
  { id: 'community', label: 'جامعه' },
  { id: 'esports', label: 'ای‌اسپورتس' },
  { id: 'update', label: 'آپدیت‌ها' },
  { id: 'event', label: 'رویدادها' },
];
const CAT_LABEL = { community: 'جامعه', esports: 'ای‌اسپورتس', update: 'آپدیت', event: 'رویداد' };

const MAX_IMG = 2 * 1024 * 1024;   // 2MB
const MAX_VID = 10 * 1024 * 1024;  // 10MB

const toFa = (n) => String(n ?? 0).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

/* ─────────── News v7 — NEXUS FEED + نظرات اختیاری ─────────── */
export default function News() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [myReacts, setMyReacts] = useState({});
  const [modal, setModal] = useState(false);
  const [reader, setReader] = useState(null);
  const [notice, setNotice] = useState(null);

  /* نظرات */
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  /* فرم ساخت پست */
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('community');
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const canPost = isAdmin || (profile?.level ?? 0) >= 3;

  const flash = (t, m) => {
    setNotice({ t, m });
    setTimeout(() => setNotice(null), 3500);
  };

  const load = async () => {
    const { data } = await supabase
      .from('news_posts')
      .select('*, author:profiles(username)')
      .order('created_at', { ascending: false })
      .limit(60);
    setPosts(data || []);
    if (user?.id && (data || []).length) {
      const ids = data.map((p) => p.id);
      const { data: r } = await supabase
        .from('news_reactions')
        .select('post_id, type')
        .eq('user_id', user.id)
        .in('post_id', ids);
      const map = {};
      (r || []).forEach((x) => (map[x.post_id] = x.type));
      setMyReacts(map);
    }
    setLoading(false);
  };

  const loadComments = async (postId) => {
    const { data } = await supabase
      .from('news_comments')
      .select('*, user:profiles(username)')
      .eq('post_id', postId)
      .order('created_at');
    setComments(data || []);
  };

  /* Realtime پست‌ها + نظرات */
  useEffect(() => {
    load();
    const ch = supabase
      .channel('news-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_posts' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_reactions' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  /* Realtime نظرات وقتی مودال خواندن باز است */
  useEffect(() => {
    if (!reader?.id) return;
    loadComments(reader.id);
    const ch = supabase
      .channel('news-comments-' + reader.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_comments', filter: `post_id=eq.${reader.id}` }, () => loadComments(reader.id))
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [reader?.id]);

  const visible = posts.filter(
    (p) => p.status === 'approved' || p.author_id === user?.id || isAdmin
  );
  const filtered = filter === 'all' ? visible : visible.filter((p) => p.category === filter);

  /* ❤️ واکنش لایک/دیسلایک */
  const react = async (p, type) => {
    if (!user) return flash('err', '❌ برای واکنش ابتدا وارد حساب شو');
    const { data, error } = await supabase.rpc('react_to_news', { p_post_id: p.id, p_type: type });
    if (error) return flash('err', '❌ ' + error.message);
    if (data && data.ok === false) return flash('err', '❌ ' + data.error);
    const cur = myReacts[p.id];
    setPosts((prev) =>
      prev.map((x) => {
        if (x.id !== p.id) return x;
        let { likes, dislikes } = x;
        if (cur === type) {
          if (type === 'like') likes = Math.max(0, likes - 1);
          else dislikes = Math.max(0, dislikes - 1);
        } else if (cur) {
          if (type === 'like') { likes += 1; dislikes = Math.max(0, dislikes - 1); }
          else { dislikes += 1; likes = Math.max(0, likes - 1); }
        } else {
          if (type === 'like') likes += 1;
          else dislikes += 1;
        }
        return { ...x, likes, dislikes };
      })
    );
    setMyReacts((prev) => ({ ...prev, [p.id]: prev[p.id] === type ? undefined : type }));
  };

  /* 👁 باز کردن پست = ثبت بازدید + بارگذاری نظرات */
  const openPost = async (p) => {
    setReader(p);
    setComments([]);
    setCommentText('');
    await supabase.rpc('view_news', { p_post_id: p.id });
    setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, views: (x.views || 0) + 1 } : x)));
  };

  /* 💬 ارسال نظر */
  const addComment = async () => {
    if (!commentText.trim() || !reader) return;
    const { error } = await supabase.from('news_comments').insert({
      post_id: reader.id,
      user_id: user.id,
      content: commentText.trim(),
    });
    if (error) return flash('err', '❌ ' + error.message);
    setCommentText('');
    loadComments(reader.id);
  };

  /* 🗑 حذف نظر (خود نظر یا ادمین) */
  const deleteComment = async (c) => {
    const { error } = await supabase.from('news_comments').delete().eq('id', c.id);
    if (error) return flash('err', '❌ ' + error.message);
    loadComments(reader.id);
  };

  /* 📎 انتخاب فایل با محدودیت حجم */
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isImg = f.type.startsWith('image/');
    const isVid = f.type.startsWith('video/');
    if (!isImg && !isVid) return flash('err', '❌ فقط عکس یا ویدیو مجاز است');
    if (isImg && f.size > MAX_IMG) return flash('err', '❌ حجم عکس حداکثر ۲ مگابایت است');
    if (isVid && f.size > MAX_VID) return flash('err', '❌ حجم ویدیو حداکثر ۱۰ مگابایت است');
    setFile(f);
    setMediaType(isImg ? 'image' : 'video');
    setPreview(URL.createObjectURL(f));
  };

  /* 🚀 ارسال پست */
  const submit = async () => {
    if (!title.trim() || !content.trim()) return flash('err', '❌ عنوان و متن پست الزامی است');
    setBusy(true);
    let mediaUrl = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('news-media').upload(path, file);
      if (upErr) {
        setBusy(false);
        return flash('err', '❌ آپلود ناموفق: ' + upErr.message);
      }
      mediaUrl = supabase.storage.from('news-media').getPublicUrl(path).data.publicUrl;
    }
    const { data, error } = await supabase.rpc('create_news_post', {
      p_title: title.trim(),
      p_content: content.trim(),
      p_category: category,
      p_media_url: mediaUrl,
      p_media_type: mediaType,
      p_comments_enabled: commentsEnabled,
    });
    setBusy(false);
    if (error) return flash('err', '❌ ' + error.message);
    if (data && data.ok === false) return flash('err', '❌ ' + data.error);
    setModal(false);
    setTitle(''); setContent(''); setFile(null); setPreview(null); setMediaType(null); setCommentsEnabled(false);
    flash('ok', isAdmin ? '✅ پست همان لحظه منتشر شد!' : '✅ ارسال شد! پس از تأیید ادمین منتشر می‌شود ⏳');
    load();
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
          92% { text-shadow: -2px 0 #e879f9, 2px 0 #22d3ee; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #e879f9, -2px 0 #22d3ee; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
        }
      `}</style>

      {/* ─────────── صحنه ─────────── */}
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
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {notice && (
          <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM, notice.t === 'ok' ? 'border-emerald-400/40' : 'border-red-400/40')}
            >
              {notice.m}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-7xl">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
              News // Data Feed
            </p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
              NEXUS <span className="text-gradient">FEED</span>
            </h1>
            <p className="mt-3 text-sm text-slate-500">اخبار جامعه آرنا — بنویس، بخوان، واکنش نشان بده!</p>
          </div>

          {/* دکمه پست جدید */}
          {user ? (
            canPost ? (
              <button
                onClick={() => setModal(true)}
                className={cn('flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_36px_rgba(34,211,238,0.6)]', CLIP_SM)}
              >
                <Plus size={14} /> پست جدید
              </button>
            ) : (
              <span className={cn('flex items-center gap-2 border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-bold text-amber-300', CLIP_SM)}>
                <ShieldAlert size={13} /> برای پست‌گذاشتن به سطح ۳ برس!
              </span>
            )
          ) : (
            <span className={cn('border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-500', CLIP_SM)}>
              برای پست‌گذاشتن وارد شو
            </span>
          )}
        </div>

        {/* فیلتر دسته‌ها */}
        <div className="mb-10 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                'border px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all',
                CLIP_SM,
                filter === c.id
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* ─────────── کارت‌های پست ─────────── */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative h-72 overflow-hidden rounded-md bg-white/5">
                <span className="absolute inset-0" style={{ animation: 'shimmer 1.4s infinite', background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.12), transparent)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-14 text-center text-slate-400', CLIP)}>
            <Newspaper className="mx-auto mb-3 h-12 w-12 opacity-30" />
            هنوز پستی منتشر نشده — اولین نفر باش! ✨
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p, i) => {
              const my = myReacts[p.id];
              return (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -6 }}
                  className={cn('group relative flex flex-col border border-white/10 bg-[#070b18]/85 backdrop-blur-xl transition-colors hover:border-cyan-400/40 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]', CLIP)}
                >
                  <span className="pointer-events-none absolute left-2 top-2 z-10 h-4 w-4 border-l-2 border-t-2 border-cyan-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-2 right-2 z-10 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/40 opacity-0 transition-opacity group-hover:opacity-100" />

                  {/* مدیا */}
                  {p.media_url && (
                    <div className="relative h-48 overflow-hidden border-b border-white/10 bg-black/40">
                      {p.media_type === 'video' ? (
                        <video src={p.media_url} className="h-full w-full object-cover" preload="metadata" muted playsInline />
                      ) : (
                        <img src={p.media_url} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      )}
                      <span className={cn('absolute right-3 top-3 grid h-7 w-7 place-items-center border border-white/20 bg-black/60 text-white backdrop-blur', CLIP_SM)}>
                        {p.media_type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    {/* متا */}
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
                      <span className={cn('border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-bold text-cyan-300', CLIP_SM)}>
                        {CAT_LABEL[p.category] || 'عمومی'}
                      </span>
                      {p.comments_enabled && (
                        <span className={cn('flex items-center gap-1 border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-0.5 font-bold text-fuchsia-300', CLIP_SM)}>
                          <MessageSquare size={10} /> نظرات باز
                        </span>
                      )}
                      {p.status === 'pending' && (
                        <span className={cn('flex items-center gap-1 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-bold text-amber-300', CLIP_SM)}>
                          <Hourglass size={10} /> در انتظار تأیید
                        </span>
                      )}
                      {p.status === 'rejected' && (
                        <span className={cn('border border-red-400/30 bg-red-400/10 px-2 py-0.5 font-bold text-red-400', CLIP_SM)}>
                          رد شده
                        </span>
                      )}
                      <span className="mr-auto flex items-center gap-1 text-slate-500">
                        <Clock size={10} /> {new Date(p.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    <h3
                      onClick={() => p.status === 'approved' && openPost(p)}
                      className="cursor-pointer font-display text-lg font-bold text-white transition-colors group-hover:text-cyan-300"
                    >
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">{p.content}</p>

                    {/* نویسنده */}
                    <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
                      <div className={cn('grid h-7 w-7 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-[10px] font-black text-slate-950', CLIP_SM)}>
                        {(p.author?.username || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-300">{p.author?.username || 'کاربر آرنا'}</span>
                      <span className="mr-auto flex items-center gap-1 text-[11px] text-slate-500">
                        <Eye size={12} className="text-cyan-400/70" /> {toFa(p.views)}
                      </span>
                    </div>

                    {/* واکنش‌ها */}
                    <div className="mt-3 flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => react(p, 'like')}
                        className={cn(
                          'flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold transition-all',
                          CLIP_SM,
                          my === 'like'
                            ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.4)]'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-emerald-400/40 hover:text-emerald-300'
                        )}
                      >
                        <ThumbsUp size={12} /> {toFa(p.likes)}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => react(p, 'dislike')}
                        className={cn(
                          'flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold transition-all',
                          CLIP_SM,
                          my === 'dislike'
                            ? 'border-red-400/50 bg-red-400/15 text-red-400 shadow-[0_0_14px_rgba(248,113,113,0.4)]'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-red-400/40 hover:text-red-400'
                        )}
                      >
                        <ThumbsDown size={12} /> {toFa(p.dislikes)}
                      </motion.button>
                      <button
                        onClick={() => p.status === 'approved' && openPost(p)}
                        className="mr-auto text-xs font-bold text-cyan-300 transition hover:text-cyan-200"
                      >
                        ادامه مطلب ←
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────── مودال ساخت پست ─────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[15000] grid place-items-center bg-black/55 px-4 backdrop-blur-[3px]"
            onClick={() => setModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, rotateX: -80, scale: 0.85, y: 34 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, rotateX: -70, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
              style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
              onClick={(e) => e.stopPropagation()}
              className={cn('relative max-h-[90vh] w-full max-w-lg overflow-y-auto border border-cyan-400/40 bg-[#070b18]/95 p-6 shadow-[0_0_70px_rgba(34,211,238,0.3)] backdrop-blur-2xl', CLIP)}
            >
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
              <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/60" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.3em] text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.2s infinite' }} />
                  New Post // Broadcast
                </p>
                <button onClick={() => setModal(false)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <label className="mb-1.5 mt-4 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">عنوان *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: برد تیم ما در جام سایبری!"
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
              />

              <label className="mb-1.5 mt-4 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">دسته‌بندی</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                style={{ colorScheme: 'dark' }}
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <label className="mb-1.5 mt-4 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">متن پست *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="خبرت را بنویس..."
                className="w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
              />

              {/* 💬 فعال‌سازی نظرات */}
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={commentsEnabled}
                  onChange={(e) => setCommentsEnabled(e.target.checked)}
                  className="accent-fuchsia-400"
                />
                <MessageSquare size={13} className="text-fuchsia-300" />
                فعال‌سازی نظرات برای این پست
              </label>

              {/* آپلود مدیا */}
              <label className="mb-1.5 mt-4 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">
                عکس / ویدیو (اختیاری — عکس ≤۲MB، ویدیو ≤۱۰MB)
              </label>
              <label className={cn('flex cursor-pointer items-center justify-center gap-2 border border-dashed border-cyan-400/30 bg-cyan-400/5 py-4 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/10', CLIP_SM)}>
                <ImageIcon size={14} /> انتخاب فایل
                <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
              </label>
              {preview && (
                <div className="relative mt-3 overflow-hidden rounded-md border border-white/10">
                  {mediaType === 'video' ? (
                    <video src={preview} controls className="max-h-52 w-full bg-black" />
                  ) : (
                    <img src={preview} alt="preview" className="max-h-52 w-full object-cover" />
                  )}
                  <button
                    onClick={() => { setFile(null); setPreview(null); setMediaType(null); }}
                    className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-black/70 text-red-400 transition hover:bg-black/90"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <button
                onClick={submit}
                disabled={busy}
                className={cn('mt-5 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] disabled:opacity-50', CLIP_SM)}
              >
                {busy ? '⏳ در حال ارسال...' : (<><CheckCircle2 size={14} /> ارسال برای تأیید</>)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال خواندن + نظرات ─────────── */}
      <AnimatePresence>
        {reader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]"
            onClick={() => setReader(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className={cn('relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-fuchsia-400/40 bg-[#070b18]/95 p-6 shadow-[0_0_70px_rgba(232,121,249,0.3)] backdrop-blur-2xl', CLIP)}
            >
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
              <button onClick={() => setReader(null)} className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-white">
                <X size={15} />
              </button>

              <p className="text-[10px] text-slate-500">
                {CAT_LABEL[reader.category] || 'عمومی'} • {new Date(reader.created_at).toLocaleString('fa-IR')} • نویسنده: {reader.author?.username || 'کاربر آرنا'}
              </p>
              <h2 className="mt-2 font-display text-2xl font-black text-white">{reader.title}</h2>

              {reader.media_url && (
                <div className="mt-4 overflow-hidden rounded-md border border-white/10">
                  {reader.media_type === 'video' ? (
                    <video src={reader.media_url} controls className="max-h-80 w-full bg-black" />
                  ) : (
                    <img src={reader.media_url} alt={reader.title} className="max-h-80 w-full object-cover" />
                  )}
                </div>
              )}

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{reader.content}</p>

              <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Eye size={13} className="text-cyan-400/70" /> {toFa(reader.views)} بازدید</span>
                <span className="flex items-center gap-1"><ThumbsUp size={13} className="text-emerald-400/70" /> {toFa(reader.likes)}</span>
                <span className="flex items-center gap-1"><ThumbsDown size={13} className="text-red-400/70" /> {toFa(reader.dislikes)}</span>
                <span className="mr-auto flex items-center gap-1"><User size={13} /> {reader.author?.username}</span>
              </div>

              {/* 💬 بخش نظرات — فقط اگر فعال باشد */}
              {reader.comments_enabled && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-fuchsia-300">
                    <MessageSquare size={12} /> نظرات ({toFa(comments.length)})
                  </p>

                  <div className="chat-scroll mt-3 max-h-56 space-y-2 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-500">هنوز نظری نیست — اولین نظر را بنویس! ✨</p>
                    ) : (
                      comments.map((c) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group flex items-start gap-2.5 rounded-md border border-white/5 bg-white/5 p-2.5"
                        >
                          <div className={cn('grid h-7 w-7 shrink-0 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-[9px] font-black text-slate-950', CLIP_SM)}>
                            {(c.user?.username || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-slate-500">
                              <span className="font-bold text-slate-300">{c.user?.username || 'کاربر آرنا'}</span>
                              {' • '}{new Date(c.created_at).toLocaleString('fa-IR')}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-300">{c.content}</p>
                          </div>
                          {(user?.id === c.user_id || isAdmin) && (
                            <button
                              onClick={() => deleteComment(c)}
                              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-600 opacity-0 transition hover:bg-red-400/10 hover:text-red-400 group-hover:opacity-100"
                              title="حذف نظر"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* ارسال نظر */}
                  {user ? (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addComment()}
                        placeholder="نظرت را بنویس..."
                        className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none transition placeholder:text-slate-700 focus:border-fuchsia-400/50"
                      />
                      <button
                        onClick={addComment}
                        className={cn('grid h-8 w-8 place-items-center bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-slate-950 shadow-[0_0_14px_rgba(232,121,249,0.4)] transition hover:shadow-[0_0_22px_rgba(232,121,249,0.6)]', CLIP_SM)}
                        title="ارسال نظر"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-center text-[10px] text-slate-500">برای نوشتن نظر، وارد حساب خود شو.</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}