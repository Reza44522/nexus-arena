import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, ChevronDown, ChevronUp, Crown, MessageSquare, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── GroupsTab — نظارت ادمین بر همه گروه‌ها ─────────── */
export default function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [msgs, setMsgs] = useState({});
  const [notice, setNotice] = useState('');

  const flash = (m) => {
    setNotice(m);
    setTimeout(() => setNotice(''), 3000);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select('*, owner:profiles(username), members:group_members(id, user_id, role, profile:profiles(username))')
      .order('created_at', { ascending: false });
    if (error) console.error('❌ groups:', error.message);
    setGroups(data || []);
    setLoading(false);
  };

  /* Realtime تازه‌سازی */
  useEffect(() => {
    load();
    const ch = supabase
      .channel('admin-groups-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  /* باز/بسته کردن + بارگذاری پیام‌ها */
  const toggle = async (id) => {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    const { data } = await supabase
      .from('group_messages')
      .select('*, sender:profiles(username)')
      .eq('group_id', id)
      .order('created_at', { ascending: false })
      .limit(30);
    setMsgs((m) => ({ ...m, [id]: (data || []).reverse() }));
  };

  /* انحلال گروه */
  const dissolve = async (g) => {
    if (!window.confirm(`⚠️ گروه «${g.name}» برای همیشه منحل شود؟ همه پیام‌ها حذف می‌شوند.`)) return;
    const { data, error } = await supabase.rpc('dissolve_group', { p_group_id: g.id });
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('✅ گروه منحل شد');
    load();
  };

  /* حذف عضو از گروه */
  const removeMember = async (g, uid, name) => {
    if (!window.confirm(`${name} از گروه «${g.name}» حذف شود؟`)) return;
    const { data, error } = await supabase.rpc('remove_group_member', { p_group_id: g.id, p_user_id: uid });
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('✅ عضو حذف شد');
    load();
  };

  const totalMembers = groups.reduce((s, g) => s + (g.members?.length || 0), 0);

  return (
    <div className="space-y-6">
      {notice && (
        <div className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white', CLIP_SM)}>{notice}</div>
      )}

      {/* آمار کلی */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cn('border border-cyan-400/25 bg-[#070b18]/85 p-4 text-center', CLIP_SM)}>
          <p className="font-display text-2xl font-black text-cyan-300">{groups.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">کل گروه‌ها</p>
        </div>
        <div className={cn('border border-fuchsia-400/25 bg-[#070b18]/85 p-4 text-center', CLIP_SM)}>
          <p className="font-display text-2xl font-black text-fuchsia-300">{totalMembers}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">کل عضویت‌ها</p>
        </div>
      </div>

      {/* لیست گروه‌ها */}
      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
        </div>
      ) : groups.length === 0 ? (
        <div className={cn('border border-white/10 bg-[#070b18]/80 p-12 text-center text-slate-400', CLIP)}>
          👥 هنوز گروهی ساخته نشده است
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn('relative border border-white/10 bg-[#070b18]/85 p-5 backdrop-blur-xl transition-colors hover:border-cyan-400/30', CLIP)}
            >
              <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-cyan-400/40" />

              <div className="flex flex-wrap items-center gap-4">
                <div className={cn('grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-xl', CLIP_SM)}>👥</div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-white">{g.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Crown size={11} className="text-amber-400" /> مالک: {g.owner?.username || '—'}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {g.members?.length || 0} عضو</span>
                    <span>📅 {new Date(g.created_at).toLocaleDateString('fa-IR')}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggle(g.id)}
                    className={cn('flex items-center gap-1 border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-400/20', CLIP_SM)}
                  >
                    {expanded === g.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    جزئیات
                  </button>
                  <button
                    onClick={() => dissolve(g)}
                    className={cn('flex items-center gap-1 border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-[10px] font-bold text-red-400 transition hover:bg-red-400/20', CLIP_SM)}
                  >
                    <Trash2 size={12} /> انحلال
                  </button>
                </div>
              </div>

              {/* جزئیات: اعضا + پیام‌ها */}
              <AnimatePresence>
                {expanded === g.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 lg:grid-cols-2">
                      {/* اعضا */}
                      <div>
                        <p className="mb-2 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.25em] text-cyan-300">
                          <Users size={12} /> اعضا
                        </p>
                        <div className="space-y-1.5">
                          {(g.members || []).map((m) => (
                            <div key={m.id} className={cn('flex items-center gap-2 border border-white/5 bg-white/5 px-3 py-2', CLIP_SM)}>
                              <span className="flex-1 text-xs font-bold text-white">{m.profile?.username || '—'}</span>
                              {m.role === 'owner' ? (
                                <span className="flex items-center gap-1 text-[9px] text-amber-300"><Crown size={10} /> مالک</span>
                              ) : (
                                <button
                                  onClick={() => removeMember(g, m.user_id, m.profile?.username)}
                                  className="grid h-6 w-6 place-items-center text-red-400 transition hover:bg-red-400/10"
                                  title="حذف عضو"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* پیام‌های اخیر */}
                      <div>
                        <p className="mb-2 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.25em] text-fuchsia-300">
                          <MessageSquare size={12} /> ۳۰ پیام اخیر
                        </p>
                        <div className="chat-scroll max-h-64 space-y-1.5 overflow-y-auto">
                          {(msgs[g.id] || []).length === 0 ? (
                            <p className="py-4 text-center text-xs text-slate-500">پیامی نیست</p>
                          ) : (
                            (msgs[g.id] || []).map((m) => (
                              <div key={m.id} className={cn('border border-white/5 bg-white/5 px-3 py-2', CLIP_SM)}>
                                <p className="text-[9px] text-slate-500">
                                  <span className="font-bold text-slate-300">{m.sender?.username || '—'}</span>
                                  {' • '}{new Date(m.created_at).toLocaleString('fa-IR')}
                                  {' • '}{m.type}
                                </p>
                                {m.content && <p className="mt-0.5 line-clamp-2 text-xs text-slate-300">{m.content}</p>}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}