import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Image as ImageIcon, Paperclip, Mic, Square, BarChart2, Newspaper,
  Users, UserPlus, Trash2, LogOut, Crown, Download, Check, Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import { cn } from '../../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── کارت نظرسنجی ─────────── */
function PollCard({ poll, userId, canClose, onVote, onClose }) {
  const total = poll.votes?.length || 0;
  return (
    <div className={cn('border border-fuchsia-400/30 bg-fuchsia-500/5 p-3', CLIP_SM)}>
      <p className="flex items-center gap-2 text-sm font-bold text-white">
        <BarChart2 size={14} className="text-fuchsia-300" /> {poll.question}
      </p>
      <p className="mt-1 text-[10px] text-slate-500">
        {poll.multiple ? 'چندانتخابی' : 'تک‌انتخابی'} • {total.toLocaleString('fa-IR')} رأی
        {poll.closed && <span className="mr-2 text-red-400">• بسته شده</span>}
      </p>
      <div className="mt-2 space-y-1.5">
        {(poll.options || []).map((o) => {
          const votes = (poll.votes || []).filter((v) => v.option_id === o.id).length;
          const pct = total ? Math.round((votes / total) * 100) : 0;
          const mine = (poll.votes || []).some((v) => v.option_id === o.id && v.user_id === userId);
          return (
            <button
              key={o.id}
              disabled={poll.closed}
              onClick={() => onVote(o.id)}
              className={cn(
                'relative w-full overflow-hidden border p-2 text-right text-xs transition',
                CLIP_SM,
                mine ? 'border-fuchsia-400/50 bg-fuchsia-400/15 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-fuchsia-400/30',
                poll.closed && 'opacity-70'
              )}
            >
              <span className="absolute inset-y-0 right-0 bg-fuchsia-500/20 transition-all duration-500" style={{ width: `${pct}%` }} />
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  {mine && <Check size={11} className="text-fuchsia-300" />}
                  {o.label}
                </span>
                <span className="font-bold text-fuchsia-300">{pct.toLocaleString('fa-IR')}٪</span>
              </span>
            </button>
          );
        })}
      </div>
      {canClose && !poll.closed && (
        <button onClick={onClose} className={cn('mt-2 border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-400/20', CLIP_SM)}>
          بستن نظرسنجی
        </button>
      )}
    </div>
  );
}

/* ─────────── GroupChatModal — چت گروهی کامل ─────────── */
export default function GroupChatModal({ group, onClose }) {
  const { user } = useAuth();
  const g = useGroups(user?.id);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [recording, setRecording] = useState(false);
  const [postCache, setPostCache] = useState({});
  const [pollForm, setPollForm] = useState({ question: '', options: ['', ''], multiple: false });
  const [shareForm, setShareForm] = useState({ postId: null, caption: '' });
  const [newsPosts, setNewsPosts] = useState([]);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState([]);
  const listRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const imgInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const isOwner = group.owner_id === user?.id || group.my_role === 'owner';

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3000); };

  const reload = async () => {
    const [m, mem] = await Promise.all([g.loadMessages(group.id), g.loadMembers(group.id)]);
    setMessages(m);
    setMembers(mem);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [group.id]);

  /* Realtime: پیام‌ها + رأی‌ها + اعضا */
  useEffect(() => {
        const ch = supabase
      .channel('group-chat-' + group.id + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_messages', filter: `group_id=eq.${group.id}` }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${group.id}` }, () => reload())
      .subscribe();
        const ch2 = supabase
      .channel('group-polls-' + group.id + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_poll_votes' }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); supabase.removeChannel(ch2); };
    // eslint-disable-next-line
  }, [group.id]);

  /* اسکرول خودکار */
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  /* کش پست‌های اشتراکی */
  useEffect(() => {
    const ids = messages.filter((m) => m.type === 'post' && m.post_id && !postCache[m.post_id]).map((m) => m.post_id);
    if (!ids.length) return;
    supabase.from('news_posts').select('id, title, content, author:profiles(username)').in('id', ids).then(({ data }) => {
      setPostCache((prev) => {
        const n = { ...prev };
        (data || []).forEach((p) => (n[p.id] = p));
        return n;
      });
    });
    // eslint-disable-next-line
  }, [messages]);

  /* ─────────── ارسال‌ها ─────────── */
  const sendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    const res = await g.sendText(group.id, text);
    if (res.ok) setText('');
    else flash('❌ ' + res.error);
    setBusy(false);
  };

  const onMediaPicked = async (kind, file) => {
    if (!file) return;
    const MAX = kind === 'image' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > MAX) return flash(`❌ حجم ${kind === 'image' ? 'عکس حداکثر ۵MB' : 'فایل حداکثر ۲۰MB'} است`);
    setBusy(true);
    const res = await g.uploadAndSend(group.id, file, kind);
    if (!res.ok) flash('❌ ' + res.error);
    setBusy(false);
  };

  /* 🎙 ضبط ویس */
  const toggleRec = async () => {
    if (recording) { recRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const res = await g.uploadAndSend(group.id, blob, 'voice');
        if (!res.ok) flash('❌ ' + res.error);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      flash('❌ دسترسی به میکروفون ممکن نشد');
    }
  };

  /* 📊 ساخت نظرسنجی */
  const submitPoll = async () => {
    const opts = pollForm.options.map((o) => o.trim()).filter(Boolean);
    if (!pollForm.question.trim() || opts.length < 2) return flash('❌ سوال و حداقل ۲ گزینه لازم است');
    setBusy(true);
    const res = await g.createPoll(group.id, pollForm.question.trim(), opts, pollForm.multiple);
    if (res.ok) { setShowPoll(false); setPollForm({ question: '', options: ['', ''], multiple: false }); }
    else flash('❌ ' + res.error);
    setBusy(false);
  };

  /* 📰 اشتراک پست */
  const openShare = async () => {
    setShowShare(true);
    const { data } = await supabase.from('news_posts').select('id, title').eq('status', 'approved').order('created_at', { ascending: false }).limit(20);
    setNewsPosts(data || []);
  };
  const submitShare = async () => {
    if (!shareForm.postId) return flash('❌ یک پست انتخاب کن');
    setBusy(true);
    const res = await g.sharePost(group.id, shareForm.postId, shareForm.caption);
    if (res.ok) { setShowShare(false); setShareForm({ postId: null, caption: '' }); }
    else flash('❌ ' + res.error);
    setBusy(false);
  };

  /* 👥 مدیریت اعضا */
  const searchAdd = async (q) => {
    setAddQuery(q);
    if (q.trim().length < 2) return setAddResults([]);
    const { data } = await supabase.from('profiles').select('id, username').ilike('username', `%${q}%`).neq('id', user.id).limit(10);
    setAddResults((data || []).filter((u) => !members.some((m) => m.user_id === u.id)));
  };
  const doAdd = async (uid) => {
    const res = await g.addMember(group.id, uid);
    flash(res.ok ? '✅ عضو اضافه شد' : '❌ ' + res.error);
    if (res.ok) reload();
  };
  const doRemove = async (uid, name) => {
    if (!window.confirm(`${name} از گروه حذف شود؟`)) return;
    const res = await g.removeMember(group.id, uid);
    flash(res.ok ? '✅ حذف شد' : '❌ ' + res.error);
    if (res.ok) reload();
  };
  const doDissolve = async () => {
    if (!window.confirm('⚠️ گروه برای همیشه منحل شود؟ همه پیام‌ها حذف می‌شوند.')) return;
    const res = await g.dissolve(group.id);
    if (res.ok) { flash('✅ گروه منحل شد'); onClose(); }
    else flash('❌ ' + res.error);
  };
  const doLeave = async () => {
    if (!window.confirm('از گروه خارج می‌شوی؟')) return;
    const res = await g.leave(group.id);
    if (res.ok) onClose();
    else flash('❌ ' + res.error);
  };

  const iconBtn = 'grid h-9 w-9 shrink-0 place-items-center border border-white/10 bg-white/5 text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <style>{`@keyframes gcmBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }`}</style>
      <motion.div
        initial={{ opacity: 0, rotateX: -60, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
        onClick={(e) => e.stopPropagation()}
        className={cn('relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden border border-cyan-400/40 bg-[#070b18]/95 backdrop-blur-2xl', CLIP)}
      >
        <span className="pointer-events-none absolute left-2 top-2 z-10 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
        <span className="pointer-events-none absolute bottom-2 right-2 z-10 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/60" />

        {/* ─────────── هدر گروه ─────────── */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className={cn('grid h-10 w-10 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-lg', CLIP_SM)}>👥</div>
            <div>
              <p className="font-display font-bold text-white">{group.name}</p>
              <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'gcmBlink 1.4s infinite' }} />
                {members.length.toLocaleString('fa-IR')} عضو • Group Channel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowMembers((v) => !v)} className={cn(iconBtn, showMembers && 'border-cyan-400/50 text-cyan-300')} title="اعضا">
              <Users size={15} />
            </button>
            <button onClick={onClose} className={iconBtn} title="بستن"><X size={16} /></button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* ─────────── پیام‌ها ─────────── */}
          <div ref={listRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[80%]', mine ? 'text-left' : 'text-right')}>
                    {!mine && <p className="mb-0.5 text-[10px] font-bold text-cyan-300">{m.sender?.username || 'کاربر'}</p>}
                    <div className={cn('px-4 py-2.5 text-sm', CLIP_SM, mine ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' : 'border border-white/10 bg-white/5 text-slate-100')}>
                      {m.type === 'text' && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                      {m.type === 'image' && (
                        <div>
                          <img src={m.media_url} alt="" className="max-h-56 rounded-md object-cover" />
                          {m.content && <p className="mt-1">{m.content}</p>}
                        </div>
                      )}
                      {m.type === 'file' && (
                        <a href={m.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                          <Paperclip size={14} /> {m.media_name || 'فایل'} <Download size={12} />
                        </a>
                      )}
                      {m.type === 'voice' && (
                        <div className="flex items-center gap-2">
                          <Mic size={14} className={mine ? 'text-white' : 'text-fuchsia-300'} />
                          <audio controls src={m.media_url} className="h-9 max-w-[220px]" />
                        </div>
                      )}
                      {m.type === 'poll' && m.poll && (
                        <PollCard
                          poll={m.poll}
                          userId={user?.id}
                          canClose={m.poll.creator_id === user?.id || isOwner}
                          onVote={(oid) => g.votePoll(m.poll.id, oid).then((r) => !r.ok && flash('❌ ' + r.error))}
                          onClose={() => g.closePoll(m.poll.id)}
                        />
                      )}
                      {m.type === 'post' && (
                        <div className={cn('border border-amber-400/30 bg-amber-400/5 p-2.5', CLIP_SM)}>
                          <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300"><Newspaper size={11} /> پست اشتراکی از اخبار</p>
                          <p className="mt-1 text-sm font-bold text-white">{postCache[m.post_id]?.title || '...'}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{postCache[m.post_id]?.content || ''}</p>
                          {m.content && <p className="mt-1 text-xs text-slate-300">{m.content}</p>}
                        </div>
                      )}
                      <p className="mt-1 text-[9px] opacity-60">{new Date(m.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ─────────── پنل اعضا ─────────── */}
          <AnimatePresence>
            {showMembers && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden border-r border-white/10">
                <div className="chat-scroll h-full w-[260px] overflow-y-auto p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-display text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">اعضا</p>
                    <button onClick={() => setShowAdd(true)} className={cn('flex items-center gap-1 border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300', CLIP_SM)}>
                      <UserPlus size={11} /> افزودن
                    </button>
                  </div>
                  <div className="space-y-2">
                    {members.map((mem) => (
                      <div key={mem.id} className={cn('flex items-center gap-2 border border-white/5 bg-white/5 p-2', CLIP_SM)}>
                        <div className={cn('grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-[10px] font-black text-slate-950', CLIP_SM)}>
                          {(mem.profile?.username || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white">{mem.profile?.username}</p>
                          <p className="flex items-center gap-1 text-[9px] text-slate-500">
                            {mem.role === 'owner' && (<><Crown size={9} className="text-amber-400" /> مالک</>)}
                            {mem.role === 'admin' && 'ادمین گروه'}
                            {mem.role === 'member' && 'عضو'}
                          </p>
                        </div>
                        {isOwner && mem.user_id !== user?.id && mem.role !== 'owner' && (
                          <button onClick={() => doRemove(mem.user_id, mem.profile?.username)} className="grid h-6 w-6 place-items-center text-red-400 transition hover:bg-red-400/10" title="حذف">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                    {isOwner ? (
                      <button onClick={doDissolve} className={cn('flex w-full items-center justify-center gap-1.5 border border-red-400/40 bg-red-400/10 py-2 text-[10px] font-bold text-red-400 transition hover:bg-red-400/20', CLIP_SM)}>
                        <Trash2 size={11} /> انحلال گروه
                      </button>
                    ) : (
                      <button onClick={doLeave} className={cn('flex w-full items-center justify-center gap-1.5 border border-white/10 bg-white/5 py-2 text-[10px] font-bold text-slate-400 transition hover:text-red-400', CLIP_SM)}>
                        <LogOut size={11} /> ترک گروه
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─────────── نوار ارسال ─────────── */}
        <form onSubmit={sendText} className="border-t border-white/10 p-3">
          {notice && <p className="mb-2 text-center text-[11px] text-red-400">{notice}</p>}
          <div className="flex items-center gap-1.5">
            <input type="file" accept="image/*" hidden ref={imgInputRef} onChange={(e) => { onMediaPicked('image', e.target.files?.[0]); e.target.value = ''; }} />
            <input type="file" hidden ref={fileInputRef} onChange={(e) => { onMediaPicked('file', e.target.files?.[0]); e.target.value = ''; }} />
            <button type="button" onClick={() => imgInputRef.current?.click()} className={iconBtn} title="عکس"><ImageIcon size={15} /></button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className={iconBtn} title="فایل"><Paperclip size={15} /></button>
            <button type="button" onClick={toggleRec} className={cn(iconBtn, recording && 'border-red-400/60 bg-red-400/15 text-red-400')} title="ویس">
              {recording ? <Square size={15} /> : <Mic size={15} />}
            </button>
            <button type="button" onClick={() => setShowPoll(true)} className={iconBtn} title="نظرسنجی"><BarChart2 size={15} /></button>
            <button type="button" onClick={openShare} className={iconBtn} title="اشتراک پست"><Newspaper size={15} /></button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={recording ? '🎙 در حال ضبط... برای توقف بزن' : 'پیام گروهی...'}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
            />
            <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!text.trim() || busy} className={cn('grid h-10 w-10 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.4)] disabled:opacity-40', CLIP_SM)}>
              <Send size={15} />
            </motion.button>
          </div>
        </form>

        {/* ─────────── مودال نظرسنجی ─────────── */}
        <AnimatePresence>
          {showPoll && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} className={cn('w-full max-w-md border border-fuchsia-400/40 bg-[#070b18]/95 p-5', CLIP)}>
                <p className="mb-3 flex items-center gap-2 font-display text-sm font-black text-white"><BarChart2 size={15} className="text-fuchsia-300" /> ساخت نظرسنجی</p>
                <input value={pollForm.question} onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })} placeholder="سوال نظرسنجی..." className="mb-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-400/50" />
                {pollForm.options.map((o, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input value={o} onChange={(e) => { const opts = [...pollForm.options]; opts[i] = e.target.value; setPollForm({ ...pollForm, options: opts }); }} placeholder={`گزینه ${i + 1}`} className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50" />
                    {pollForm.options.length > 2 && (
                      <button type="button" onClick={() => setPollForm({ ...pollForm, options: pollForm.options.filter((_, x) => x !== i) })} className="grid h-9 w-9 place-items-center text-red-400"><X size={13} /></button>
                    )}
                  </div>
                ))}
                {pollForm.options.length < 6 && (
                  <button type="button" onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })} className="mb-2 text-xs font-bold text-cyan-300">+ افزودن گزینه</button>
                )}
                <label className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox" checked={pollForm.multiple} onChange={(e) => setPollForm({ ...pollForm, multiple: e.target.checked })} className="accent-fuchsia-400" />
                  چندانتخابی
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setShowPoll(false)} className={cn('flex-1 border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                  <button onClick={submitPoll} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-2 text-xs font-black text-slate-950 disabled:opacity-50', CLIP_SM)}>ایجاد نظرسنجی</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────── مودال اشتراک پست ─────────── */}
        <AnimatePresence>
          {showShare && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} className={cn('w-full max-w-md border border-amber-400/40 bg-[#070b18]/95 p-5', CLIP)}>
                <p className="mb-3 flex items-center gap-2 font-display text-sm font-black text-white"><Newspaper size={15} className="text-amber-300" /> اشتراک پست از اخبار</p>
                <select value={shareForm.postId || ''} onChange={(e) => setShareForm({ ...shareForm, postId: e.target.value || null })} className="mb-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none" style={{ colorScheme: 'dark' }}>
                  <option value="">انتخاب پست...</option>
                  {newsPosts.map((p) => (<option key={p.id} value={p.id}>{p.title}</option>))}
                </select>
                <input value={shareForm.caption} onChange={(e) => setShareForm({ ...shareForm, caption: e.target.value })} placeholder="توضیح اختیاری..." className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none" />
                <div className="flex gap-2">
                  <button onClick={() => setShowShare(false)} className={cn('flex-1 border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                  <button onClick={submitShare} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-amber-400 to-orange-500 py-2 text-xs font-black text-slate-950 disabled:opacity-50', CLIP_SM)}>اشتراک</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────── مودال افزودن عضو ─────────── */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} className={cn('w-full max-w-md border border-cyan-400/40 bg-[#070b18]/95 p-5', CLIP)}>
                <p className="mb-3 flex items-center gap-2 font-display text-sm font-black text-white"><UserPlus size={15} className="text-cyan-300" /> افزودن عضو</p>
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input value={addQuery} onChange={(e) => searchAdd(e.target.value)} placeholder="جستجوی کاربر..." className="w-full rounded-md border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-400/50" />
                </div>
                <div className="chat-scroll max-h-52 space-y-1.5 overflow-y-auto">
                  {addResults.map((u) => (
                    <div key={u.id} className={cn('flex items-center gap-2 border border-white/5 bg-white/5 p-2', CLIP_SM)}>
                      <span className="flex-1 text-xs font-bold text-white">{u.username}</span>
                      <button onClick={() => doAdd(u.id)} className={cn('border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300', CLIP_SM)}>افزودن</button>
                    </div>
                  ))}
                  {addQuery.trim().length >= 2 && addResults.length === 0 && <p className="py-4 text-center text-xs text-slate-500">کاربری یافت نشد</p>}
                </div>
                <button onClick={() => setShowAdd(false)} className={cn('mt-3 w-full border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-400', CLIP_SM)}>بستن</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}