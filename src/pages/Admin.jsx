import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/ui/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import NeonButton from '../components/ui/NeonButton';
import { cn } from '../utils/cn';

function StatBox({ icon, label, value, accent = 'from-cyan-400 to-blue-500' }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-4">
        <div className={cn('grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-xl', accent)}>
          {icon}
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-white">{value}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
        </div>
      </div>
    </GlassCard>
  );
}

export default function Admin() {
  const { user, getAllUsers, deleteUser, promoteUser } = useAuth();
  const [users, setUsers] = useState(() => getAllUsers());
  const [activeTab, setActiveTab] = useState('overview');

  const refreshUsers = () => setUsers(getAllUsers());

  const handleDelete = (email) => {
    if (email === user.email) {
      alert('نمی‌توانید حساب خودتان را حذف کنید!');
      return;
    }
    if (confirm(`آیا از حذف کاربر ${email} مطمئن هستید؟`)) {
      deleteUser(email);
      refreshUsers();
    }
  };

  const handlePromote = (email) => {
    if (confirm(`آیا می‌خواهید ${email} را به ادمین ارتقا دهید؟`)) {
      promoteUser(email);
      refreshUsers();
    }
  };

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        {/* هدر */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black text-white md:text-4xl">
              پنل مدیریت
            </h1>
            <p className="mt-1 text-sm text-slate-400">خوش آمدید، {user?.name}</p>
          </div>
          <Badge color="magenta">👑 Admin</Badge>
        </div>

        {/* تب‌ها */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 آمار کلی' },
            { id: 'users', label: '👥 کاربران' },
            { id: 'stream', label: '📺 تنظیمات استریم' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'glass whitespace-nowrap rounded-xl px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-colors',
                activeTab === tab.id
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* محتوای تب */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatBox icon="👥" label="کل کاربران" value={totalUsers} accent="from-cyan-400 to-blue-500" />
              <StatBox icon="👑" label="ادمین‌ها" value={adminCount} accent="from-fuchsia-500 to-purple-500" />
              <StatBox icon="🎮" label="کاربران عادی" value={userCount} accent="from-emerald-400 to-teal-500" />
              <StatBox icon="📺" label="استریم فعال" value={1} accent="from-amber-400 to-orange-500" />
            </div>

            <GlassCard className="p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">
                فعالیت‌های اخیر
              </h2>
              <ul className="mt-4 space-y-3">
                {[
                  { action: 'ثبت‌نام کاربر جدید', user: 'player123@nexus.gg', time: '۵ دقیقه پیش' },
                  { action: 'شروع استریم', user: 'MafiaGANG', time: '۱ ساعت پیش' },
                  { action: 'به‌روزرسانی پروفایل', user: 'demo@nexus.gg', time: '۲ ساعت پیش' },
                ].map((log, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-white">{log.action}</p>
                      <p className="text-xs text-slate-500">{log.user}</p>
                    </div>
                    <span className="text-xs text-slate-400">{log.time}</span>
                  </motion.li>
                ))}
              </ul>
            </GlassCard>
          </div>
        )}

        {activeTab === 'users' && (
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">
                مدیریت کاربران
              </h2>
              <NeonButton size="sm" variant="ghost" onClick={refreshUsers}>
                🔄 تازه‌سازی
              </NeonButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3">نام</th>
                    <th className="pb-3">ایمیل</th>
                    <th className="pb-3">نقش</th>
                    <th className="pb-3">تاریخ ثبت‌نام</th>
                    <th className="pb-3">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u, i) => (
                    <motion.tr
                      key={u.email}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td className="py-3 text-white">{u.name}</td>
                      <td className="py-3 text-slate-400">{u.email}</td>
                      <td className="py-3">
                        <Badge color={u.role === 'admin' ? 'magenta' : 'cyan'}>
                          {u.role === 'admin' ? '👑 ادمین' : '🎮 کاربر'}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fa-IR') : '—'}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {u.role !== 'admin' && (
                            <NeonButton size="sm" variant="ghost" onClick={() => handlePromote(u.email)}>
                              ⬆ ارتقا
                            </NeonButton>
                          )}
                          {u.email !== user.email && (
                            <NeonButton size="sm" variant="ghost" onClick={() => handleDelete(u.email)}>
                              🗑 حذف
                            </NeonButton>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {activeTab === 'stream' && (
          <GlassCard className="p-6">
            <h2 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.25em] text-white">
              تنظیمات استریم
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block font-display text-xs uppercase tracking-[0.2em] text-slate-400">
                  نام کانال
                </label>
                <input
                  type="text"
                  defaultValue="MafiaGANG"
                  className="glass mt-1.5 w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                />
              </div>
              <div>
                <label className="block font-display text-xs uppercase tracking-[0.2em] text-slate-400">
                  وضعیت پیش‌فرض
                </label>
                <select className="glass mt-1.5 w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60">
                  <option value="online">آنلاین</option>
                  <option value="offline">آفلاین</option>
                </select>
              </div>
              <NeonButton className="w-full">ذخیره تنظیمات</NeonButton>
            </div>
          </GlassCard>
        )}
      </div>
    </PageWrapper>
  );
}