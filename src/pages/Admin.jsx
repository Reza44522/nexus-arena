import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PageWrapper from '../components/ui/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import NeonButton from '../components/ui/NeonButton';
import ReportsTab from '../components/admin/ReportsTab';
import TicketsTab from '../components/admin/TicketsTab';
import StreamControlTab from '../components/admin/StreamControlTab';
import SiteLockControl from '../components/admin/SiteLockControl';
import { cn } from '../utils/cn';

const statusInfo = {
  active: { label: 'فعال', color: 'green' },
  banned: { label: 'بن شده', color: 'red' },
  blocked: { label: 'مسدود', color: 'amber' },
};

function StatBox({ icon, label, value, accent = 'from-cyan-400 to-blue-500' }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-4">
        <div className={cn('grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-xl', accent)}>{icon}</div>
        <div>
          <p className="font-display text-2xl font-bold text-white">{value}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
        </div>
      </div>
    </GlassCard>
  );
}

export default function Admin() {
  const { user, profile, getAllUsers, deleteUser, moderateUser, sendNotification, isAdmin, isOwner } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [modTarget, setModTarget] = useState(null);
  const [modAction, setModAction] = useState('ban');
  const [modHours, setModHours] = useState('1');
  const [modReason, setModReason] = useState('');
  const [notifType, setNotifType] = useState('public');
  const [notifUser, setNotifUser] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [warnTarget, setWarnTarget] = useState(null);
  const [warnMessage, setWarnMessage] = useState('');

  const refreshUsers = async () => {
    setLoadingUsers(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin) refreshUsers();
  }, [isAdmin]);

  // ✅ حذف امن (با قوانین مالک)
  const handleDelete = async (targetUser) => {
    if (targetUser.is_owner) return alert('❌ مالک سیستم قابل حذف نیست!');
    if (targetUser.id === user.id) return alert('❌ نمی‌توانید حساب خودتان را حذف کنید!');
    if (targetUser.role === 'admin' && !isOwner) return alert('❌ فقط مالک می‌تواند ادمین‌ها را حذف کند!');
    if (confirm(`آیا از حذف کاربر "${targetUser.username}" مطمئن هستید؟`)) {
      const res = await deleteUser(targetUser.id);
      if (res.ok) { alert('✅ کاربر با موفقیت حذف شد'); refreshUsers(); }
      else alert('❌ خطا: ' + res.error);
    }
  };

  // ✅ ارتقا با تابع جدید (فقط مالک)
  const handlePromote = async (t) => {
    if (t.deleted_at) return alert('❌ این کاربر حذف شده است');
    if (!confirm(`آیا می‌خواهید "${t.username}" را به ادمین ارتقا دهید؟`)) return;
    const { data, error } = await supabase.rpc('admin_set_role', { p_user_id: t.id, p_role: 'admin' });
    if (error) return alert('❌ خطا: ' + error.message);
    if (data && data.ok === false) return alert('❌ ' + data.error);
    alert('✅ ارتقا با موفقیت انجام شد');
    refreshUsers();
  };

  // ✅ عزل ادمین (فقط مالک)
  const handleDemote = async (t) => {
    if (!confirm(`آیا می‌خواهید "${t.username}" را از ادمینی عزل کنید؟`)) return;
    const { data, error } = await supabase.rpc('admin_set_role', { p_user_id: t.id, p_role: 'user' });
    if (error) return alert('❌ خطا: ' + error.message);
    if (data && data.ok === false) return alert('❌ ' + data.error);
    alert('✅ کاربر از ادمینی عزل شد');
    refreshUsers();
  };

  // ✅ ارسال اخطار → اعلانات کاربر
  const handleWarn = async () => {
    if (!warnTarget || !warnMessage.trim()) return;
    const { data, error } = await supabase.rpc('admin_warn_user', {
      p_user_id: warnTarget.id,
      p_message: warnMessage.trim(),
    });
    if (error) return alert('❌ خطا: ' + error.message);
    if (data && data.ok === false) return alert('❌ ' + data.error);
    alert('✅ اخطار ارسال شد و به اعلانات کاربر رفت');
    setWarnTarget(null);
    setWarnMessage('');
    refreshUsers();
  };

  const applyModeration = async () => {
    if (!modTarget) return;
    let status = 'active';
    let hours = 0;
    if (modAction === 'ban') status = 'banned';
    else if (modAction === 'ban_temp') { status = 'banned'; hours = Number(modHours) || 1; }
    else if (modAction === 'block') status = 'blocked';
    else if (modAction === 'block_temp') { status = 'blocked'; hours = Number(modHours) || 1; }
    const res = await moderateUser(modTarget.id, { status, hours, reason: modReason || null });
    if (res.ok) { alert('✅ اعمال شد'); setModTarget(null); setModReason(''); refreshUsers(); }
    else alert('❌ خطا: ' + res.error);
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return alert('عنوان و متن را پر کنید');
    if (notifType === 'private' && !notifUser) return alert('کاربر را انتخاب کنید');
    const res = await sendNotification({
      userId: notifType === 'private' ? notifUser : null,
      title: notifTitle,
      message: notifMessage,
      type: notifType,
    });
    if (res.ok) { alert('✅ اعلان ارسال شد!'); setNotifTitle(''); setNotifMessage(''); setNotifUser(''); }
    else alert('❌ خطا: ' + res.error);
  };

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const bannedCount = users.filter((u) => u.status && u.status !== 'active').length;

  const tabs = [
    { id: 'overview', label: '📊 آمار' },
    { id: 'users', label: '👥 کاربران' },
    { id: 'reports', label: '🚨 گزارش‌ها' },
    { id: 'tickets', label: '🎫 تیکت‌ها' },
    { id: 'stream', label: '🎛 استریم' },
    { id: 'notify', label: '📢 اعلانات' },
    { id: 'lock', label: '🔒 قفل سایت' },
  ];

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black text-white md:text-4xl">پنل مدیریت</h1>
            <p className="mt-1 text-sm text-slate-400">
              خوش آمدید، {profile?.username}
              {isOwner && <span className="mr-2 text-amber-400">👑 مالک</span>}
            </p>
          </div>
          <Badge color={isOwner ? 'amber' : 'magenta'}>{isOwner ? '👑 Owner' : '👑 Admin'}</Badge>
        </div>

        {/* تب‌ها */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'glass whitespace-nowrap rounded-xl px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-colors',
                activeTab === tab.id ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* آمار */}
        {activeTab === 'overview' && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatBox icon="👥" label="کل کاربران" value={loadingUsers ? '...' : totalUsers} />
            <StatBox icon="👑" label="ادمین‌ها" value={loadingUsers ? '...' : adminCount} accent="from-fuchsia-500 to-purple-500" />
            <StatBox icon="🚫" label="مسدود/بن" value={loadingUsers ? '...' : bannedCount} accent="from-rose-500 to-red-600" />
            <StatBox icon="⚠️" label="کل اخطارها" value={loadingUsers ? '...' : users.reduce((s, u) => s + (u.warnings || 0), 0)} accent="from-amber-400 to-orange-500" />
          </div>
        )}

        {/* کاربران */}
        {activeTab === 'users' && (
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">مدیریت کاربران</h2>
              <NeonButton size="sm" variant="ghost" onClick={refreshUsers}>🔄 تازه‌سازی</NeonButton>
            </div>
            {loadingUsers ? (
              <div className="grid place-items-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-3">کاربر</th>
                      <th className="pb-3">نقش</th>
                      <th className="pb-3">وضعیت</th>
                      <th className="pb-3">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id} className={cn(u.deleted_at && 'opacity-40')}>
                        <td className="py-3">
                          <div>
                            <p className="text-white">
                              {u.username}
                              {u.is_owner && <span className="mr-2 text-amber-400">👑</span>}
                              {u.warnings > 0 && <Badge color="amber">⚠ {u.warnings}</Badge>}
                            </p>
                            {u.id === user.id && <span className="text-[10px] text-cyan-400">(خودم)</span>}
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge color={u.role === 'admin' ? 'magenta' : 'cyan'}>
                            {u.role === 'admin' ? '👑 ادمین' : '🎮 کاربر'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge color={statusInfo[u.status || 'active'].color}>
                            {statusInfo[u.status || 'active'].label}
                          </Badge>
                          {u.restrict_until && u.status !== 'active' && (
                            <p className="mt-1 text-[10px] text-slate-500">تا: {new Date(u.restrict_until).toLocaleString('fa-IR')}</p>
                          )}
                          {u.restrict_reason && u.status !== 'active' && (
                            <p className="mt-1 text-[10px] text-slate-500">دلیل: {u.restrict_reason}</p>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            {(!u.is_owner || isOwner) && !u.deleted_at && (
                              <NeonButton size="sm" variant="ghost" onClick={() => setModTarget(u)}>🛡 مدیریت</NeonButton>
                            )}
                            {u.id !== user.id && !u.is_owner && !u.deleted_at && (
                              <NeonButton size="sm" variant="ghost" onClick={() => setWarnTarget(u)}>⚠ اخطار</NeonButton>
                            )}
                            {u.role !== 'admin' && !u.deleted_at && (
                              <NeonButton size="sm" variant="ghost" onClick={() => handlePromote(u)}>⬆ ارتقا</NeonButton>
                            )}
                            {u.role === 'admin' && !u.is_owner && isOwner && (
                              <NeonButton size="sm" variant="ghost" onClick={() => handleDemote(u)}>⬇ عزل</NeonButton>
                            )}
                            {!u.is_owner && u.id !== user.id && !u.deleted_at && (
                              <NeonButton
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(u)}
                                className={cn(u.role === 'admin' && !isOwner && 'opacity-50')}
                                disabled={u.role === 'admin' && !isOwner}
                              >
                                🗑 حذف
                              </NeonButton>
                            )}
                            {u.is_owner && !isOwner && (
                              <span className="px-2 py-1 text-[10px] font-bold text-amber-400">👑 مالک</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        )}

        {/* گزارش‌ها */}
        {activeTab === 'reports' && <ReportsTab />}

        {/* تیکت‌ها */}
        {activeTab === 'tickets' && <TicketsTab />}

        {/* کنترل استریم */}
        {activeTab === 'stream' && <StreamControlTab />}

        {/* 🔒 قفل سایت */}
        {activeTab === 'lock' && <SiteLockControl />}

        {/* اعلانات */}
        {activeTab === 'notify' && (
          <GlassCard className="p-6">
            <h2 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.25em] text-white">ارسال اعلان</h2>
            <div className="space-y-5">
              <div className="flex gap-3">
                <button
                  onClick={() => setNotifType('public')}
                  className={cn(
                    'flex-1 rounded-xl px-4 py-3 font-display text-xs font-bold transition-colors',
                    notifType === 'public' ? 'border border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'glass text-slate-400'
                  )}
                >
                  📢 عمومی (همه)
                </button>
                <button
                  onClick={() => setNotifType('private')}
                  className={cn(
                    'flex-1 rounded-xl px-4 py-3 font-display text-xs font-bold transition-colors',
                    notifType === 'private' ? 'border border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300' : 'glass text-slate-400'
                  )}
                >
                  📨 خصوصی
                </button>
              </div>
              {notifType === 'private' && (
                <div>
                  <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">گیرنده</label>
                  <select
                    value={notifUser}
                    onChange={(e) => setNotifUser(e.target.value)}
                    className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="">انتخاب کاربر...</option>
                    {users.filter((u) => u.id !== user.id && !u.deleted_at).map((u) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">عنوان</label>
                <input
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="مثلاً: رویداد ویژه!"
                  className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">متن پیام</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  rows={4}
                  placeholder="متن اعلان..."
                  className="glass w-full resize-none rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                />
              </div>
              <NeonButton className="w-full" onClick={handleSendNotification}>📨 ارسال اعلان</NeonButton>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Modal مدیریت کاربر */}
      <AnimatePresence>
        {modTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setModTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong w-full max-w-md rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold text-white">مدیریت: {modTarget.username}</h3>
              <div className="mt-5 space-y-3">
                <div>
                  <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">نوع عمل</label>
                  <select
                    value={modAction}
                    onChange={(e) => setModAction(e.target.value)}
                    className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="ban">🚫 بن دائم</option>
                    <option value="ban_temp">⏱ بن ساعتی (تایم‌اوت)</option>
                    <option value="block">🔒 مسدود کامل (فقط چت)</option>
                    <option value="block_temp">🔒 مسدود ساعتی (فقط چت)</option>
                    <option value="unban">✅ رفع محدودیت</option>
                  </select>
                </div>
                {(modAction === 'ban_temp' || modAction === 'block_temp') && (
                  <div>
                    <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">مدت (ساعت)</label>
                    <input
                      type="number"
                      min="1"
                      value={modHours}
                      onChange={(e) => setModHours(e.target.value)}
                      className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">دلیل (نمایش به کاربر)</label>
                  <input
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                    placeholder="مثلاً: تخلف از قوانین"
                    className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <NeonButton className="flex-1" onClick={applyModeration}>اعمال</NeonButton>
                <NeonButton variant="ghost" className="flex-1" onClick={() => setModTarget(null)}>انصراف</NeonButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal اخطار */}
      <AnimatePresence>
        {warnTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setWarnTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong w-full max-w-md rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold text-white">⚠️ ارسال اخطار به: {warnTarget.username}</h3>
              <p className="mt-2 text-xs text-slate-400">اخطار به اعلانات کاربر می‌رود و شمارنده اخطارهایش +۱ می‌شود.</p>
              <textarea
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                rows={3}
                placeholder="متن اخطار..."
                className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white outline-none focus:border-amber-400/50"
              />
              <div className="mt-4 flex gap-3">
                <NeonButton className="flex-1" onClick={handleWarn}>ارسال اخطار</NeonButton>
                <NeonButton variant="ghost" className="flex-1" onClick={() => setWarnTarget(null)}>انصراف</NeonButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}