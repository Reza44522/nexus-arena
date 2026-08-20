import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserX, Flag, Wifi, Users, Inbox, Send, Ban, Bell, BellOff, Plus, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFriends, isOnlineNow } from '../hooks/useFriends';
import { useGroups } from '../hooks/useGroups';
import PrivateChatModal from '../components/friends/PrivateChatModal';
import GroupChatModal from '../components/friends/GroupChatModal';
import NeonButton from '../components/ui/NeonButton';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── Friends v7 — NETWORK HUB + گروه‌ها ─────────── */
export default function Friends() {
  const { user, reportUser } = useAuth();
  const navigate = useNavigate();
  const {
    friends, requests, sentRequests, blocked, blockedBy, loading,
    sendRequest, respondRequest, removeFriend,
    blockUser, unblockUser, searchUsers, getOnlineUsers,
  } = useFriends(user?.id);
  const groupsApi = useGroups(user?.id);

  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [notice, setNotice] = useState('');
  const [notifyIds, setNotifyIds] = useState(new Set());

  /* مودال ساخت گروه */
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupMembers, setGroupMembers] = useState(new Set());
  const [creatingGroup, setCreatingGroup] = useState(false);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  useEffect(() => {
    if (!user?.id) return;
    getOnlineUsers().then(setOnlineUsers);
  }, [user?.id, friends.length, blocked.length, blockedBy.length]);

  /* 🔔 ترجیحات اعلان */
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase.from('friend_notifications').select('friend_id, enabled').eq('user_id', user.id);
      setNotifyIds(new Set((data || []).filter((r) => r.enabled).map((r) => r.friend_id)));
    };
    load();
  }, [user?.id]);

  const toggleNotify = async (friendId, username) => {
    const enabled = !notifyIds.has(friendId);
    setNotifyIds((prev) => {
      const n = new Set(prev);
      if (enabled) n.add(friendId); else n.delete(friendId);
      return n;
    });
    const { error } = await supabase.from('friend_notifications').upsert(
      { user_id: user.id, friend_id: friendId, enabled },
      { onConflict: 'user_id,friend_id' }
    );
    if (error) showNotice('❌ ' + error.message);
    else showNotice(enabled ? `🔔 اعلان پیام‌های ${username} روشن شد` : `🔕 اعلان پیام‌های ${username} خاموش شد`);
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);
    if (value.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    setSearchResults(await searchUsers(value));
    setSearching(false);
  };

  const friendIds = new Set(friends.map((f) => (f.user_id === user?.id ? f.friend_profile?.id : f.profile?.id)));
  const sentIds = new Set(sentRequests.map((r) => r.profile?.id));
  const blockedIds = new Set(blocked.map((b) => b.blocked_id));
  const findList = searchQuery.trim().length >= 2 ? searchResults : onlineUsers;

  const handleAddFriend = async (t) => {
    const res = await sendRequest(t.id);
    showNotice(res.ok ? `✅ درخواست دوستی برای ${t.username} ارسال شد` : `❌ ${res.error || 'امکان ارسال درخواست نیست'}`);
  };
  const handleBlock = async (t) => {
    if (!window.confirm(`کاربر ${t.username} بلاک شود؟ دوستی بین شما حذف می‌شود.`)) return;
    const res = await blockUser(t.id);
    showNotice(res.ok ? `🚫 ${t.username} بلاک شد` : `❌ ${res.error || 'خطا در بلاک کردن'}`);
  };
  const handleUnblock = async (t) => {
    const res = await unblockUser(t.id);
    showNotice(res.ok ? `✅ ${t.username || 'کاربر'} آنبلاک شد` : `❌ ${res.error || 'خطا در آنبلاک'}`);
  };
  const handleRespond = async (id, action) => {
    const res = await respondRequest(id, action);
    showNotice(res.ok ? (action === 'accept' ? '✅ درخواست پذیرفته شد' : 'درخواست رد شد') : `❌ ${res.error || 'خطا'}`);
  };
  const handleRemove = async (id, name) => {
    if (!window.confirm(`${name} از لیست دوستان حذف شود؟`)) return;
    const res = await removeFriend(id);
    showNotice(res.ok ? '✅ حذف شد' : `❌ ${res.error || 'خطا'}`);
  };
  const handleReport = async () => {
    if (!reportTarget || !reportReason.trim()) return;
    const result = await reportUser(reportTarget.id, reportReason.trim());
    if (result.ok) {
      setShowReportModal(false); setReportReason(''); setReportTarget(null);
      showNotice('✅ گزارش شما برای ادمین‌ها ارسال شد');
    } else {
      showNotice(`❌ ${result.error || 'خطا در ارسال گزارش'}`);
    }
  };
  const openReport = (t) => { setReportTarget(t); setShowReportModal(true); };

  /* 👥 ساخت گروه */
  const createGroup = async () => {
    if (!groupName.trim()) return showNotice('❌ نام گروه الزامی است');
    setCreatingGroup(true);
    const res = await groupsApi.createGroup(groupName.trim(), groupDesc.trim(), Array.from(groupMembers));
    setCreatingGroup(false);
    if (res.ok) {
      setShowCreateGroup(false);
      setGroupName(''); setGroupDesc(''); setGroupMembers(new Set());
      showNotice('✅ گروه ساخته شد! 🎉');
    } else showNotice('❌ ' + res.error);
  };

  const renderActionButton = (u) => {
    if (blockedIds.has(u.id)) {
      return <NeonButton size="sm" variant="ghost" onClick={() => handleUnblock(u)}>Unblock</NeonButton>;
    }
    if (blockedBy.includes(u.id)) return <span className="text-xs text-slate-500">Unavailable</span>;
    if (friendIds.has(u.id)) return <span className="text-xs text-emerald-400">✓ Friends</span>;
    if (sentIds.has(u.id)) return <span className="text-xs text-cyan-400">Request sent</span>;
    return (
      <NeonButton size="sm" onClick={() => handleAddFriend(u)}>
        <span className="flex items-center gap-1"><UserPlus size={14} /> Add Friend</span>
      </NeonButton>
    );
  };

  const tabs = [
    { id: 'friends', label: 'Friends', count: friends.length, icon: Users },
    { id: 'groups', label: 'Groups', count: groupsApi.groups.length, icon: Wifi },
    { id: 'incoming', label: 'Incoming', count: requests.length, icon: Inbox },
    { id: 'sent', label: 'Sent', count: sentRequests.length, icon: Send },
    { id: 'blocked', label: 'Blocked', count: blocked.length, icon: Ban },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
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
              className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM)}
            >
              {notice}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-6xl">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Social // Network Hub
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            YOUR <span className="text-gradient">NETWORK</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500">دوست پیدا کن، گروه بساز و خصوصی چت کن.</p>
        </div>

        {/* ─────────── پنل Find Players ─────────── */}
        <div className={cn('relative mb-8 border border-cyan-400/25 bg-[#070b18]/85 p-6 backdrop-blur-xl', CLIP)}>
          <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
          <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/60" />
          <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" style={{ animation: 'scanY 5s linear infinite' }} />

          <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
            <Wifi className="h-5 w-5 text-cyan-300" />
            <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-white">Find Players</h2>
            <span className="ml-auto text-xs text-slate-500">
              {searchQuery.trim().length >= 2 ? 'Search results' : 'Online players'}
            </span>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search players by username..."
              className="w-full rounded-md border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
            />
          </div>

          {searching ? (
            <div className="py-6 text-center text-sm text-slate-500">Searching...</div>
          ) : findList.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              {searchQuery.trim().length >= 2 ? 'No players found' : 'No other online players right now'}
            </div>
          ) : (
            <div className="chat-scroll max-h-72 space-y-2 overflow-y-auto pl-2">
              {findList.map((u) => {
                const isOnline = isOnlineNow(u);
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -4 }}
                    className={cn('relative flex items-center gap-3 border border-white/5 bg-white/5 p-3 pr-4', CLIP_SM)}
                  >
                    <span className={cn('absolute right-0 top-0 h-full w-0.5', isOnline ? 'bg-emerald-400' : 'bg-slate-600')} />
                    <div className="relative">
                      <div className={cn('grid h-10 w-10 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-bold text-slate-950', CLIP_SM)}>
                        {u.username?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#070b18]', isOnline ? 'bg-green-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{u.username}</p>
                      <p className="text-xs text-slate-500">
                        {isOnline ? 'Online' : 'Offline'}{u.level ? ` • Level ${u.level}` : ''}
                      </p>
                    </div>
                    {renderActionButton(u)}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─────────── تب‌ها ─────────── */}
        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border px-6 py-3 font-display text-xs font-bold uppercase tracking-wider transition-all',
                CLIP_SM,
                activeTab === tab.id
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
              )}
            >
              <tab.icon size={13} />
              {tab.label}
              {tab.count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-fuchsia-500/20 px-1.5 text-[10px] font-bold text-fuchsia-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─────────── محتوای تب‌ها ─────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'friends' && (
            <motion.div key="friends" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {loading ? (
                <div className={cn('border border-white/10 bg-[#070b18]/80 p-8 text-center text-slate-400', CLIP)}>Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className={cn('border border-white/10 bg-[#070b18]/80 p-8 text-center text-slate-400', CLIP)}>
                  هنوز دوستی نداری — از «Find Players» بالا شروع کن!
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {friends.map((f) => {
                    const fp = f.user_id === user?.id ? f.friend_profile : f.profile;
                    const isOnline = isOnlineNow(fp);
                    const notifyOn = notifyIds.has(fp?.id);
                    return (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        className={cn('relative border border-white/10 bg-[#070b18]/80 p-5 backdrop-blur-xl transition-colors hover:border-cyan-400/40', CLIP)}
                      >
                        <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-cyan-400/40" />
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className={cn('grid h-14 w-14 place-items-center bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-lg font-bold text-slate-950', CLIP_SM)}>
                              {fp?.username?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <span className={cn('absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#070b18]', isOnline ? 'bg-green-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600')} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display font-semibold text-white">{fp?.username || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{isOnline ? 'Online' : 'Offline'}</p>
                          </div>
                          <button
                            onClick={() => toggleNotify(fp?.id, fp?.username)}
                            title={notifyOn ? 'خاموش کردن اعلان پیام' : 'روشن کردن اعلان پیام'}
                            className={cn(
                              'grid h-9 w-9 shrink-0 place-items-center border transition-all',
                              CLIP_SM,
                              notifyOn
                                ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.4)]'
                                : 'border-white/10 bg-white/5 text-slate-600 hover:text-slate-300'
                            )}
                          >
                            {notifyOn ? <Bell size={15} /> : <BellOff size={15} />}
                          </button>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <NeonButton size="sm" variant="ghost" className="flex-1" onClick={() => setSelectedFriend({ id: fp?.id, username: fp?.username, avatar_url: fp?.avatar_url })}>
                            Chat
                          </NeonButton>
                          <NeonButton size="sm" variant="ghost" className="flex-1" onClick={() => handleRemove(f.id, fp?.username)}>
                            Remove
                          </NeonButton>
                          <NeonButton size="sm" variant="ghost" onClick={() => navigate(`/profile/${fp?.id}`)} title="Profile">👤</NeonButton>
                          <NeonButton size="sm" variant="ghost" onClick={() => openReport(fp)} title="Report"><Flag size={14} /></NeonButton>
                          <NeonButton size="sm" variant="ghost" onClick={() => handleBlock({ id: fp?.id, username: fp?.username })} title="Block"><UserX size={14} /></NeonButton>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─────────── تب گروه‌ها ─────────── */}
          {activeTab === 'groups' && (
            <motion.div key="groups" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-slate-500">گروه‌هایی که عضوشان هستی</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className={cn('flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_36px_rgba(34,211,238,0.6)]', CLIP_SM)}
                >
                  <Plus size={14} /> ساخت گروه جدید
                </button>
              </div>
              {groupsApi.loading ? (
                <div className={cn('border border-white/10 bg-[#070b18]/80 p-8 text-center text-slate-400', CLIP)}>Loading groups...</div>
              ) : groupsApi.groups.length === 0 ? (
                <div className={cn('border border-white/10 bg-[#070b18]/80 p-12 text-center text-slate-400', CLIP)}>
                  👥 هنوز گروهی نداری — اولین گروهت را بساز!
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupsApi.groups.map((grp) => (
                    <motion.div
                      key={grp.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4 }}
                      className={cn('relative border border-white/10 bg-[#070b18]/80 p-5 backdrop-blur-xl transition-colors hover:border-fuchsia-400/40', CLIP)}
                    >
                      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-fuchsia-400/40" />
                      <div className="flex items-center gap-4">
                        <div className={cn('grid h-14 w-14 place-items-center bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-2xl', CLIP_SM)}>👥</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display font-semibold text-white">{grp.name}</p>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            {grp.my_role === 'owner' && (<><Crown size={10} className="text-amber-400" /> مالک گروه</>)}
                            {grp.my_role !== 'owner' && 'عضو'}
                          </p>
                        </div>
                      </div>
                      {grp.description && <p className="mt-3 line-clamp-2 text-xs text-slate-400">{grp.description}</p>}
                      <button
                        onClick={() => setSelectedGroup(grp)}
                        className={cn('mt-4 w-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_18px_rgba(232,121,249,0.35)] transition-all hover:shadow-[0_0_28px_rgba(232,121,249,0.55)]', CLIP_SM)}
                      >
                        باز کردن گروه
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'incoming' && (
            <motion.div key="incoming" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {requests.length === 0 ? (
                <div className={cn('border border-white/10 bg-[#070b18]/80 p-8 text-center text-slate-400', CLIP)}>No pending friend requests</div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <motion.div key={req.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={cn('flex items-center gap-4 border border-white/10 bg-[#070b18]/80 p-4', CLIP_SM)}>
                      <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-fuchsia-500 to-purple-600 text-sm font-bold text-white', CLIP_SM)}>
                        {req.profile?.username?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex-1">
                        <p className="font-display font-semibold text-white">{req.profile?.username || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">wants to be your friend</p>
                      </div>
                      <div className="flex gap-2">
                        <NeonButton size="sm" onClick={() => handleRespond(req.id, 'accept')}>Accept</NeonButton>
                        <NeonButton size="sm" variant="ghost" onClick={() => handleRespond(req.id, 'reject')}>Decline</NeonButton>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'sent' && (
            <motion.div key="sent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {sentRequests.length === 0 ? (
                <div className={cn('border border-white/10 bg-[#070b18]/80 p-8 text-center text-slate-400', CLIP)}>No sent friend requests</div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((req) => (
                    <motion.div key={req.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={cn('flex items-center gap-4 border border-white/10 bg-[#070b18]/80 p-4', CLIP_SM)}>
                      <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white', CLIP_SM)}>
                        {req.profile?.username?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex-1">
                        <p className="font-display font-semibold text-white">{req.profile?.username || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">Request sent</p>
                      </div>
                      <NeonButton size="sm" variant="ghost" onClick={() => handleRemove(req.id, req.profile?.username)}>Cancel</NeonButton>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'blocked' && (
            <motion.div key="blocked" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {blocked.length === 0 ? (
                <div className={cn('border border-white/10 bg-[#070b18]/80 p-8 text-center text-slate-400', CLIP)}>No blocked users</div>
              ) : (
                <div className="space-y-3">
                  {blocked.map((b) => (
                    <motion.div key={b.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={cn('flex items-center gap-4 border border-red-500/20 bg-[#070b18]/80 p-4', CLIP_SM)}>
                      <div className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-red-500 to-rose-600 text-sm font-bold text-white', CLIP_SM)}>
                        {b.blocked_profile?.username?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex-1">
                        <p className="font-display font-semibold text-white">{b.blocked_profile?.username || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">Blocked</p>
                      </div>
                      <NeonButton size="sm" variant="ghost" onClick={() => handleUnblock({ id: b.blocked_id, username: b.blocked_profile?.username })}>
                        Unblock
                      </NeonButton>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────── مودال چت خصوصی ─────────── */}
        <AnimatePresence>
          {selectedFriend && (
            <PrivateChatModal
              friend={selectedFriend}
              onClose={() => setSelectedFriend(null)}
              onReport={() => openReport(selectedFriend)}
            />
          )}
        </AnimatePresence>

        {/* ─────────── مودال چت گروهی ─────────── */}
        <AnimatePresence>
          {selectedGroup && (
            <GroupChatModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
          )}
        </AnimatePresence>

        {/* ─────────── مودال ساخت گروه ─────────── */}
        <AnimatePresence>
          {showCreateGroup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm px-4"
              onClick={() => setShowCreateGroup(false)}
            >
              <motion.div
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 16 }}
                onClick={(e) => e.stopPropagation()}
                className={cn('w-full max-w-md border border-cyan-400/40 bg-[#070b18]/95 p-6 backdrop-blur-2xl', CLIP)}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
                <p className="mb-4 flex items-center gap-2 font-display text-sm font-black text-white">
                  <Plus size={15} className="text-cyan-300" /> ساخت گروه جدید
                </p>
                <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">نام گروه *</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="مثلاً: تیم مافیای شب‌ها"
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
                />
                <label className="mb-1.5 mt-3 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">توضیح (اختیاری)</label>
                <input
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="درباره گروه..."
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50"
                />
                <label className="mb-1.5 mt-3 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">
                  افزودن دوستان ({groupMembers.size.toLocaleString('fa-IR')} انتخاب شده)
                </label>
                <div className="chat-scroll max-h-44 space-y-1.5 overflow-y-auto rounded-md border border-white/10 bg-black/30 p-2">
                  {friends.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-500">دوستی نداری — گروه خالی ساخته می‌شود</p>
                  ) : (
                    friends.map((f) => {
                      const fp = f.user_id === user?.id ? f.friend_profile : f.profile;
                      const on = groupMembers.has(fp?.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            setGroupMembers((prev) => {
                              const n = new Set(prev);
                              if (on) n.delete(fp?.id); else n.add(fp?.id);
                              return n;
                            });
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 border p-2 text-right transition',
                            CLIP_SM,
                            on ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/5 bg-white/5 hover:bg-white/10'
                          )}
                        >
                          <span className={cn('grid h-5 w-5 place-items-center border text-[10px]', CLIP_SM, on ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-300' : 'border-white/20 text-transparent')}>✓</span>
                          <span className="text-xs font-bold text-white">{fp?.username}</span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setShowCreateGroup(false)} className={cn('flex-1 border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                  <button onClick={createGroup} disabled={creatingGroup} className={cn('flex-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>
                    {creatingGroup ? '⏳ ...' : 'ساخت گروه'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────── مودال گزارش ─────────── */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              onClick={() => setShowReportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={cn('relative w-full max-w-md border border-red-400/30 bg-[#070b18]/95 p-6 backdrop-blur-xl', CLIP)}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-red-400/60" />
                <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-red-400/60" />
                <h3 className="mb-4 font-display text-lg font-black text-white">
                  Report <span className="text-red-400">{reportTarget?.username}</span>
                </h3>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Why are you reporting this user?"
                  className="w-full resize-none rounded-md border border-white/10 bg-black/40 p-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-red-400/50"
                  rows={4}
                />
                <div className="mt-4 flex gap-3">
                  <NeonButton size="sm" variant="ghost" className="flex-1" onClick={() => setShowReportModal(false)}>Cancel</NeonButton>
                  <NeonButton size="sm" className="flex-1" onClick={handleReport}>Submit Report</NeonButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}