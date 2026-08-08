import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserX, Flag, Wifi } from 'lucide-react';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import NeonButton from '../components/ui/NeonButton';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../hooks/useFriends';
import PrivateChatModal from '../components/friends/PrivateChatModal';
import { cn } from '../utils/cn';

export default function Friends() {
  const { user, reportUser } = useAuth();
  const {
    friends, requests, sentRequests, blocked, blockedBy, loading,
    sendRequest, respondRequest, removeFriend,
    blockUser, unblockUser, searchUsers, getOnlineUsers,
  } = useFriends(user?.id);

  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [notice, setNotice] = useState('');

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  // لیست آنلاین‌ها (اول بار + بعد از تغییرها)
  useEffect(() => {
    if (!user?.id) return;
    getOnlineUsers().then(setOnlineUsers);
  }, [user?.id, friends.length, blocked.length, blockedBy.length]);

  const handleSearch = async (value) => {
    setSearchQuery(value);
    if (value.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    setSearchResults(await searchUsers(value));
    setSearching(false);
  };

  // وضعیت هر کاربر برای دکمه هوشمند
  const friendIds = new Set(friends.map((f) => (f.user_id === user?.id ? f.friend_profile?.id : f.profile?.id)));
  const sentIds = new Set(sentRequests.map((r) => r.profile?.id));
  const blockedIds = new Set(blocked.map((b) => b.blocked_id));
  const findList = searchQuery.trim().length >= 2 ? searchResults : onlineUsers;

  // ─────────── اکشن‌ها ───────────
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

  // دکمه هوشمند برای هر کاربر در Find Players
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
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'incoming', label: 'Incoming', count: requests.length },
    { id: 'sent', label: 'Sent', count: sentRequests.length },
    { id: 'blocked', label: 'Blocked', count: blocked.length },
  ];

  return (
    <PageWrapper>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          tag="Social"
          title="Your Network"
          subtitle="Connect with friends, accept requests, and chat privately."
        />

        {/* Toast */}
        <AnimatePresence>
          {notice && (
            <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-xl border border-cyan-400/30 bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-glow-cyan"
              >
                {notice}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ─────────── پنل Find Players ─────────── */}
        <div className="glass-strong mb-8 rounded-2xl border border-cyan-500/20 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Wifi className="h-5 w-5 text-cyan-400" />
            <h2 className="font-display text-lg font-bold text-white">Find Players</h2>
            <span className="ml-auto text-xs text-slate-500">
              {searchQuery.trim().length >= 2 ? 'Search results' : 'Online players'}
            </span>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search players by username..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            />
          </div>

          {searching ? (
            <div className="py-6 text-center text-sm text-slate-500">Searching...</div>
          ) : findList.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              {searchQuery.trim().length >= 2 ? 'No players found' : 'No other online players right now'}
            </div>
          ) : (
            <div className="chat-scroll max-h-72 space-y-2 overflow-y-auto pr-1">
              {findList.map((u) => {
                const isOnline = u.status === 'active';
                return (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                    <div className="relative">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-bold text-slate-950">
                        {u.username?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0b0b1c]', isOnline ? 'bg-green-400' : 'bg-slate-600')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{u.username}</p>
                      <p className="text-xs text-slate-500">
                        {isOnline ? 'Online' : 'Offline'}{u.level ? ` • Level ${u.level}` : ''}
                      </p>
                    </div>
                    {renderActionButton(u)}
                  </div>
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
                'relative rounded-xl px-6 py-3 font-display text-sm uppercase tracking-wider transition-all',
                activeTab === tab.id
                  ? 'bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : 'glass text-slate-400 hover:text-white'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500/20 px-1.5 text-xs font-bold text-fuchsia-300">
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
                <div className="glass rounded-2xl p-8 text-center text-slate-400">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center text-slate-400">No friends yet. Use "Find Players" above!</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {friends.map((f) => {
                    const fp = f.user_id === user?.id ? f.friend_profile : f.profile;
                    const isOnline = fp?.status === 'active';
                    return (
                      <motion.div key={f.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-5 transition-all hover:border-cyan-400/30">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-lg font-bold text-slate-950">
                              {fp?.username?.slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <span className={cn('absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0b0b1c]', isOnline ? 'bg-green-400' : 'bg-slate-600')} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display font-semibold text-white">{fp?.username || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{isOnline ? 'Online' : 'Offline'}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <NeonButton size="sm" variant="ghost" className="flex-1" onClick={() => setSelectedFriend({ id: fp?.id, username: fp?.username, avatar_url: fp?.avatar_url })}>
                            Chat
                          </NeonButton>
                          <NeonButton size="sm" variant="ghost" className="flex-1" onClick={() => handleRemove(f.id, fp?.username)}>
                            Remove
                          </NeonButton>
                          <NeonButton size="sm" variant="ghost" onClick={() => openReport(fp)} title="Report">
                            <Flag size={14} />
                          </NeonButton>
                          <NeonButton size="sm" variant="ghost" onClick={() => handleBlock({ id: fp?.id, username: fp?.username })} title="Block">
                            <UserX size={14} />
                          </NeonButton>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'incoming' && (
            <motion.div key="incoming" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {requests.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center text-slate-400">No pending friend requests</div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <motion.div key={req.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass flex items-center gap-4 rounded-xl p-4">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-sm font-bold text-white">
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
                <div className="glass rounded-2xl p-8 text-center text-slate-400">No sent friend requests</div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((req) => (
                    <motion.div key={req.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass flex items-center gap-4 rounded-xl p-4">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white">
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
                <div className="glass rounded-2xl p-8 text-center text-slate-400">No blocked users</div>
              ) : (
                <div className="space-y-3">
                  {blocked.map((b) => (
                    <motion.div key={b.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass flex items-center gap-4 rounded-xl border border-red-500/20 p-4">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-sm font-bold text-white">
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
                className="glass w-full max-w-md rounded-2xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 font-display text-xl font-bold text-white">Report {reportTarget?.username}</h3>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Why are you reporting this user?"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
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
    </PageWrapper>
  );
}