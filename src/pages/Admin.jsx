import { useEffect, useMemo, useState } from 'react';
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
import TournamentsTab from '../components/admin/TournamentsTab';
import NewsModerationTab from '../components/admin/NewsModerationTab';
import GroupsTab from '../components/admin/GroupsTab';
import SiteLockControl from '../components/admin/SiteLockControl';
import WarControlTab from '../components/admin/WarControlTab';
import SpySettingsTab from '../components/admin/SpySettingsTab';
import { toFa, fmtNum } from '../data/countries';
import { cn } from '../utils/cn';
import { Activity, Users, Shield, Swords, Search, Snowflake, Trophy, Banknote, Bell, Lock, Newspaper, Layers, Trash2, Eye, Zap, Skull, Clock, Globe, Ticket, Tv, Coins, Flame, TrendingUp, Radar } from 'lucide-react';

const CLIP = '[clip-path:polygon(0_0,calc(100%-18px)_0,100%_18px,100%_100%,18px_100%,0_calc(100%-18px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,10px_100%,0_calc(100%-10px))]';
const SHIMMER = { backgroundImage: 'linear-gradient(110deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.3) 50%, rgba(255,255,255,0) 65%)', backgroundSize: '200% 100%', animation: 'shimmer 2.8s linear infinite' };
const pad = (n) => String(n).padStart(2, '0');

const statusInfo = {
  active: { label: 'فعال', color: 'green' },
  banned: { label: 'بن شده', color: 'red' },
  blocked: { label: 'مسدود', color: 'amber' },
};

const SIDEBAR = [
  { g: 'فرماندهی', items: [
    { id: 'overview', label: 'آمار زنده', icon: Activity },
    { id: 'warroom', label: 'اتاق جنگ', icon: Swords },
    { id: 'economy', label: 'اقتصاد کلان', icon: Coins },
    { id: 'war', label: 'جنگ و اقتصاد', icon: Flame },
    { id: 'spy', label: '🕵️ جاسوسی', icon: Eye },
  ]},
  { g: 'کاربران', items: [
    { id: 'users', label: 'کاربران', icon: Users },
    { id: 'reports', label: 'گزارش‌ها', icon: Shield },
    { id: 'tickets', label: 'تیکت‌ها', icon: Ticket },
  ]},
  { g: 'محتوا', items: [
    { id: 'news', label: 'اخبار', icon: Newspaper },
    { id: 'tournaments', label: 'تورنومنت‌ها', icon: Trophy },
    { id: 'groups', label: 'گروه‌ها', icon: Layers },
    { id: 'stream', label: 'استریم', icon: Tv },
  ]},
  { g: 'سیستم', items: [
    { id: 'notify', label: 'اعلانات', icon: Bell },
    { id: 'lock', label: 'قفل سایت', icon: Lock },
    { id: 'reset', label: 'ریست تست', icon: Trash2 },
  ]},
];

/* ─────────── Admin v3 — فرماندهی کل اولترا + بازار آزاد ─────────── */
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
  const [now, setNow] = useState(Date.now());
  const [war, setWar] = useState({ matches: [], alliances: [], coords: [], spies: [], countries: [], profs: [] });
  const [sanTarget, setSanTarget] = useState('');
  const [grantUser, setGrantUser] = useState('');
  const [grantAmt, setGrantAmt] = useState('500');
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 4000); };

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const refreshUsers = async () => {
    setLoadingUsers(true);
    const data = await getAllUsers();
    setUsers(data || []);
    setLoadingUsers(false);
  };

  const loadWar = async () => {
    const [m, a, c, s, cc, pr] = await Promise.all([
      supabase.from('war_matches').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('alliance_wars').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('coord_battles').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('spy_ops').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('player_countries').select('id, name_fa, flag'),
      supabase.from('profiles').select('created_at, war_dollars, username, id').limit(1000),
    ]);
    setWar({ matches: m.data || [], alliances: a.data || [], coords: c.data || [], spies: s.data || [], countries: cc.data || [], profs: pr.data || [] });
  };

  useEffect(() => {
    if (isAdmin) { refreshUsers(); loadWar(); }
    // eslint-disable-next-line
  }, [isAdmin]);

  const nameOf = (id) => { const c = war.countries.find((x) => x.id === id); return c ? `${c.flag} ${c.name_fa}` : '—'; };
  const since24 = Date.now() - 24 * 3600000;
  const in24 = (ts) => new Date(ts).getTime() > since24;
  const stats = useMemo(() => ({
    users: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    banned: users.filter((u) => u.status && u.status !== 'active').length,
    new24: war.profs.filter((p) => in24(p.created_at)).length,
    wars24: war.matches.filter((m) => in24(m.created_at)).length,
    spies24: war.spies.filter((s) => in24(s.created_at)).length,
    totalWD: war.profs.reduce((s, p) => s + Number(p.war_dollars || 0), 0),
    countries: war.countries.length,
  }), [users, war]);
  const chart = useMemo(() => {
    const D = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return { t: d.getTime(), u: 0, w: 0 }; });
    war.profs.forEach((p) => { const k = new Date(p.created_at); k.setHours(0, 0, 0, 0); const b = D.find((x) => x.t === k.getTime()); if (b) b.u += 1; });
    war.matches.forEach((m) => { const k = new Date(m.created_at); k.setHours(0, 0, 0, 0); const b = D.find((x) => x.t === k.getTime()); if (b) b.w += 1; });
    return D;
  }, [war]);
  const chartMax = Math.max(1, ...chart.map((d) => d.u + d.w));

  const run = async (key, fn) => { setBusy(key); await fn(); setBusy(null); };
  const forceResolve = (id) => run('fr' + id, async () => {
    const { data, error } = await supabase.rpc('admin_force_resolve', { p_id: id });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ نبرد به‌صورت اجباری حل شد');
    loadWar();
  });
  const finishAlliance = (id) => run('fa' + id, async () => {
    const { data, error } = await supabase.rpc('admin_finish_alliance_war', { p_id: id });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ جنگ اتحاد پایان یافت + جوایز');
    loadWar();
  });
  const applySan = (type) => run('san' + type, async () => {
    if (!sanTarget) return flash('❌ کشور را انتخاب کن');
    const { data, error } = await supabase.rpc('admin_apply_sanction', { p_defender: sanTarget, p_type: type });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '🥶 تحریم ادمین اعمال شد');
    loadWar();
  });
  const grant = () => run('grant', async () => {
    if (!grantUser) return flash('❌ کاربر را انتخاب کن');
    const { data, error } = await supabase.rpc('admin_grant_wd', { p_user: grantUser, p_amount: Number(grantAmt) || 0 });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ WD اعطا شد');
    loadWar();
  });

  /* ─── کاربران ─── */
  const handleDelete = async (t) => {
    if (t.is_owner) return alert('❌ مالک سیستم قابل حذف نیست!');
    if (t.id === user.id) return alert('❌ نمی‌توانید حساب خودتان را حذف کنید!');
    if (t.role === 'admin' && !isOwner) return alert('❌ فقط مالک می‌تواند ادمین‌ها را حذف کند!');
    if (confirm(`حذف کاربر "${t.username}"؟`)) {
      const res = await deleteUser(t.id);
      if (res.ok) { alert('✅ حذف شد'); refreshUsers(); } else alert('❌ ' + res.error);
    }
  };
  const handlePromote = async (t) => {
    if (t.deleted_at) return alert('❌ کاربر حذف شده است');
    if (!confirm(`ارتقا "${t.username}" به ادمین؟`)) return;
    const { data, error } = await supabase.rpc('admin_set_role', { p_user_id: t.id, p_role: 'admin' });
    if (error) return alert('❌ ' + error.message);
    if (data && data.ok === false) return alert('❌ ' + data.error);
    alert('✅ ارتقا انجام شد'); refreshUsers();
  };
  const handleDemote = async (t) => {
    if (!confirm(`عزل "${t.username}" از ادمینی؟`)) return;
    const { data, error } = await supabase.rpc('admin_set_role', { p_user_id: t.id, p_role: 'user' });
    if (error) return alert('❌ ' + error.message);
    if (data && data.ok === false) return alert('❌ ' + data.error);
    alert('✅ عزل شد'); refreshUsers();
  };
  const handleFullReset = async () => {
    if (!confirm('⚠️ همه کاربران و داده‌ها (به‌جز مالک و خودت) برای همیشه حذف می‌شوند. مطمئنی؟')) return;
    if (!confirm('❗ تأیید نهایی: غیرقابل بازگشت!')) return;
    const { data, error } = await supabase.rpc('admin_full_reset');
    if (error) return alert('❌ ' + error.message);
    if (data && data.ok === false) return alert('❌ ' + data.error);
    alert(`✅ ریست شد — ${data.deleted} کاربر حذف شدند`);
    refreshUsers(); loadWar();
  };
  const handleWarn = async () => {
    if (!warnTarget || !warnMessage.trim()) return;
    const { data, error } = await supabase.rpc('admin_warn_user', { p_user_id: warnTarget.id, p_message: warnMessage.trim() });
    if (error) return alert('❌ ' + error.message);
    if (data && data.ok === false) return alert('❌ ' + data.error);
    alert('✅ اخطار ارسال شد'); setWarnTarget(null); setWarnMessage(''); refreshUsers();
  };
  const applyModeration = async () => {
    if (!modTarget) return;
    let status = 'active'; let hours = 0;
    if (modAction === 'ban') status = 'banned';
    else if (modAction === 'ban_temp') { status = 'banned'; hours = Number(modHours) || 1; }
    else if (modAction === 'block') status = 'blocked';
    else if (modAction === 'block_temp') { status = 'blocked'; hours = Number(modHours) || 1; }
    const res = await moderateUser(modTarget.id, { status, hours, reason: modReason || null });
    if (res.ok) { alert('✅ اعمال شد'); setModTarget(null); setModReason(''); refreshUsers(); }
    else alert('❌ ' + res.error);
  };
  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return alert('عنوان و متن را پر کنید');
    if (notifType === 'private' && !notifUser) return alert('کاربر را انتخاب کنید');
    const res = await sendNotification({ userId: notifType === 'private' ? notifUser : null, title: notifTitle, message: notifMessage, type: notifType });
    if (res.ok) { alert('✅ ارسال شد!'); setNotifTitle(''); setNotifMessage(''); setNotifUser(''); }
    else alert('❌ ' + res.error);
  };

  const activeMatches = war.matches.filter((m) => m.status !== 'finished');
  const activeAlliances = war.alliances.filter((a) => a.status === 'active');
  const rich = [...war.profs].sort((a, b) => Number(b.war_dollars || 0) - Number(a.war_dollars || 0)).slice(0, 8);
  const d = new Date(now);

  return (
    <PageWrapper>
      <style>{`
        @keyframes nxSpin { to { transform: rotate(360deg); } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes aurora { from { transform: translate3d(-30px,0,0) scale(1); } to { transform: translate3d(40px,20px,0) scale(1.12); } }
        @keyframes glitch { 0%,91%,100% { text-shadow: 0 0 26px rgba(34,211,238,.5); transform: none; } 92% { text-shadow: -3px 0 #22d3ee, 3px 0 #e879f9; transform: translateX(2px); } 94% { text-shadow: 3px 0 #22d3ee, -3px 0 #e879f9; transform: translateX(-2px); } 96% { text-shadow: 0 0 26px rgba(34,211,238,.5); transform: none; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
      `}</style>

      {/* صحنه اولترا */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[340px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" style={{ animation: 'aurora 9s ease-in-out infinite alternate' }} />
        <div className="absolute top-10 right-1/4 h-[300px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[110px]" style={{ animation: 'aurora 11s ease-in-out infinite alternate-reverse' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'64\' viewBox=\'0 0 56 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 0L56 16v32L28 64 0 48V16z\' fill=\'none\' stroke=\'%2322d3ee\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '56px 64px' }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" style={{ animation: 'scanY 8s linear infinite' }} />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 py-10">
        {/* هدر فرماندهی */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
              فرماندهی <span className="text-gradient">کل</span>
            </h1>
            <p className="mt-2 font-mono text-[10px] tracking-[0.35em] text-cyan-400/70">
              {profile?.username} // {isOwner ? '👑 مالک سیستم' : '👑 ادمین'} // ساعت سرور {pad(d.getHours())}:{pad(d.getMinutes())}:{pad(d.getSeconds())}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={cn('flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black text-emerald-300', CLIP_SM)}>
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> سیستم آنلاین
            </span>
            <span className={cn('border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[10px] font-black text-amber-300', CLIP_SM)}>👑 {isOwner ? 'Owner' : 'Admin'}</span>
          </div>
        </div>

        <AnimatePresence>
          {notice && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn('mb-6 border border-cyan-400/40 bg-slate-950/95 px-4 py-2.5 text-xs text-white', CLIP_SM)}>
              {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* ─────────── سایدبار نئونی ─────────── */}
          <aside className={cn('h-fit border border-white/10 bg-[#0a0c08]/85 p-3 backdrop-blur-xl lg:sticky lg:top-24', CLIP)}>
            {SIDEBAR.map((g) => (
              <div key={g.g} className="mb-4">
                <p className="mb-2 px-2 font-display text-[8px] font-black uppercase tracking-[0.35em] text-slate-500">{g.g}</p>
                {g.items.map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn('mb-1 flex w-full items-center gap-2.5 border px-3 py-2.5 text-right text-[10px] font-black transition-all', CLIP_SM, activeTab === t.id ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.25)]' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white')}>
                    {t.icon ? <t.icon size={13} /> : <span className="text-[10px]">◆</span>} {t.label}
                    {t.id === 'warroom' && activeMatches.length > 0 && <span className="mr-auto grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[8px] text-white">{toFa(activeMatches.length)}</span>}
                  </button>
                ))}
              </div>
            ))}
          </aside>

          {/* ─────────── محتوا ─────────── */}
          <div className="min-w-0 space-y-6">
            {/* ═══════════ آمار زنده ═══════════ */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { i: Users, l: 'کل کاربران', v: stats.users, c: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/5' },
                    { i: Zap, l: 'کاربران جدید ۲۴س', v: stats.new24, c: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/5' },
                    { i: Swords, l: 'نبردهای ۲۴س', v: stats.wars24, c: 'text-red-300 border-red-400/30 bg-red-400/5' },
                    { i: Search, l: 'جاسوسی‌های ۲۴س', v: stats.spies24, c: 'text-purple-300 border-purple-400/30 bg-purple-400/5' },
                    { i: Shield, l: 'ادمین‌ها', v: stats.admins, c: 'text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-400/5' },
                    { i: Skull, l: 'بن/مسدود', v: stats.banned, c: 'text-rose-300 border-rose-400/30 bg-rose-400/5' },
                    { i: Globe, l: 'کشورهای فعال', v: stats.countries, c: 'text-amber-300 border-amber-400/30 bg-amber-400/5' },
                    { i: Banknote, l: 'WD در گردش', v: fmtNum(stats.totalWD), c: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/5' },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }} className={cn('border p-4', CLIP, s.c)}>
                      <s.i size={16} className="mb-2" />
                      <p className="font-display text-xl font-black tabular-nums text-white">{typeof s.v === 'number' ? toFa(s.v) : s.v}</p>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.2em] opacity-70">{s.l}</p>
                    </motion.div>
                  ))}
                </div>
                <div className={cn('border border-white/10 bg-[#0a0c08]/85 p-5', CLIP)}>
                  <p className="mb-4 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><Activity size={12} /> نبض ۷ روز گذشته (کاربر + نبرد)</p>
                  <div className="flex h-36 items-end gap-2">
                    {chart.map((c, i) => (
                      <div key={i} className="group relative flex-1">
                        <motion.div initial={{ height: 0 }} animate={{ height: Math.max(6, ((c.u + c.w) / chartMax) * 130) }} transition={{ delay: i * 0.06, duration: 0.5 }} className="w-full rounded-t bg-gradient-to-t from-cyan-500/50 to-fuchsia-400/80" />
                        <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded border border-white/10 bg-black/90 px-1.5 text-[8px] text-white opacity-0 transition group-hover:opacity-100">{toFa(c.u)}👤 {toFa(c.w)}⚔</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[8px] text-slate-600"><span>۶ روز پیش</span><span>امروز</span></div>
                </div>
              </>
            )}

            {/* ═══════════ اتاق جنگ ═══════════ */}
            {activeTab === 'warroom' && (
              <div className="space-y-6">
                <div className={cn('border border-red-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                  <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-red-300"><Swords size={12} /> نبردهای فعال ({toFa(activeMatches.length)})</p>
                  {activeMatches.length === 0 ? <p className="text-xs text-slate-600">نبرد فعالی نیست</p> : activeMatches.map((m) => (
                    <div key={m.id} className={cn('mb-2 flex flex-wrap items-center gap-3 border border-red-400/20 bg-red-400/5 p-3', CLIP_SM)}>
                      <span className="flex-1 text-xs font-bold text-white">{nameOf(m.attacker_country)} ⚔ {nameOf(m.defender_country)}</span>
                      <span className="text-[9px] text-slate-500">{m.mode} • دور {toFa(m.round || 1)}</span>
                      <button onClick={() => forceResolve(m.id)} disabled={busy === 'fr' + m.id} className={cn('border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-[9px] font-black text-red-300 hover:bg-red-400/20', CLIP_SM)}>⚡ حل اجباری</button>
                    </div>
                  ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className={cn('border border-fuchsia-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                    <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-fuchsia-300"><Shield size={12} /> جنگ‌های اتحاد فعال</p>
                    {activeAlliances.length === 0 ? <p className="text-xs text-slate-600">جنگ اتحادی فعال نیست</p> : activeAlliances.map((a) => (
                      <div key={a.id} className={cn('mb-2 border border-fuchsia-400/20 bg-fuchsia-400/5 p-3', CLIP_SM)}>
                        <p className="flex items-center justify-between text-xs font-bold text-white">
                          <span>{nameOf(a.attacker_alliance)} ⚔ {nameOf(a.defender_alliance)}</span>
                          <span className="font-display text-red-400">{toFa(a.att_score)}-{toFa(a.def_score)}</span>
                        </p>
                        <button onClick={() => finishAlliance(a.id)} disabled={busy === 'fa' + a.id} className={cn('mt-2 border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1.5 text-[9px] font-black text-fuchsia-300 hover:bg-fuchsia-400/20', CLIP_SM)}>🏁 پایان اجباری + جوایز</button>
                      </div>
                    ))}
                  </div>
                  <div className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                    <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><Snowflake size={12} /> تحریم مستقیم ادمین</p>
                    <select value={sanTarget} onChange={(e) => setSanTarget(e.target.value)} className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none" style={{ colorScheme: 'dark' }}>
                      <option value="">انتخاب کشور...</option>
                      {war.countries.map((c) => (<option key={c.id} value={c.id}>{c.flag} {c.name_fa}</option>))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ k: 'oil', l: '🛢️ نفتی' }, { k: 'financial', l: '🏦 مالی' }, { k: 'naval', l: '🚢 دریایی' }, { k: 'arms', l: '🎖 تسلیحاتی' }, { k: 'cyber', l: '🕵️ سایبری' }].map((s) => (
                        <button key={s.k} onClick={() => applySan(s.k)} disabled={busy === 'san' + s.k} className={cn('border border-cyan-400/40 bg-cyan-400/10 py-2 text-[9px] font-black text-cyan-300 hover:bg-cyan-400/20', CLIP_SM)}>{s.l}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className={cn('border border-purple-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                    <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-purple-300"><Search size={12} /> لاگ جاسوسی جهان</p>
                    {war.spies.length === 0 ? <p className="text-xs text-slate-600">جاسوسی ثبت نشده</p> : war.spies.slice(0, 8).map((s) => (
                      <p key={s.id} className="mb-1.5 text-[10px] text-slate-400">🕵️ {nameOf(s.spy_country)} ← {nameOf(s.target_country)} <span className="text-slate-600">{new Date(s.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span></p>
                    ))}
                  </div>
                  <div className={cn('border border-emerald-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                    <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-emerald-300"><Radar size={12} /> نبردهای مختصاتی</p>
                    {war.coords.length === 0 ? <p className="text-xs text-slate-600">نبرد مختصاتی نیست</p> : war.coords.slice(0, 8).map((c) => (
                      <p key={c.id} className="mb-1.5 text-[10px] text-slate-400">🗺 {nameOf(c.attacker_country)} ⚔ {nameOf(c.defender_country)} — {c.status === 'finished' ? (c.winner_country ? 'پایان' : 'مساوی') : 'فعال'}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ اقتصاد کلان ═══════════ */}
            {activeTab === 'economy' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className={cn('border border-emerald-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                  <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-emerald-300"><Banknote size={12} /> ثروتمندترین فرماندهان</p>
                  {rich.map((p, i) => (
                    <div key={p.id} className={cn('mb-2 flex items-center gap-3 border p-2.5', CLIP_SM, i === 0 ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10 bg-white/5')}>
                      <span className="font-display text-sm font-black text-white">#{toFa(i + 1)}</span>
                      <span className="flex-1 text-xs font-bold text-white">{p.username}</span>
                      <span className="text-[10px] font-black text-emerald-300">{fmtNum(p.war_dollars || 0)} WD</span>
                    </div>
                  ))}
                </div>
                <div className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-5', CLIP)}>
                  <p className="mb-3 flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300"><Coins size={12} /> تزریق فوری بودجه</p>
                  <select value={grantUser} onChange={(e) => setGrantUser(e.target.value)} className="mb-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none" style={{ colorScheme: 'dark' }}>
                    <option value="">انتخاب کاربر...</option>
                    {users.filter((u) => !u.deleted_at).map((u) => (<option key={u.id} value={u.id}>{u.username}</option>))}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" value={grantAmt} onChange={(e) => setGrantAmt(e.target.value)} className="w-24 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none" />
                    <button onClick={grant} disabled={busy === 'grant'} className={cn('flex-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950', CLIP_SM)} style={SHIMMER}>💵 اعطا</button>
                  </div>
                  <p className="mt-3 text-[9px] leading-4 text-slate-500">کل WD در گردش: {fmtNum(stats.totalWD)} — با تزریق بی‌رویه، تورم جنگ ایجاد می‌شود!</p>
                </div>
              </div>
            )}

            {/* ═══════════ جنگ و اقتصاد (قبلی) ═══════════ */}
            {activeTab === 'war' && <WarControlTab />}
            {activeTab === 'spy' && (
  <SpySettingsTab />
)}
            {/* ═══════════ کاربران ═══════════ */}
            {activeTab === 'users' && (
              <GlassCard className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">مدیریت کاربران</h2>
                  <NeonButton size="sm" variant="ghost" onClick={refreshUsers}>🔄 تازه‌سازی</NeonButton>
                </div>
                {loadingUsers ? (
                  <div className="grid place-items-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                          <th className="pb-3">کاربر</th><th className="pb-3">نقش</th><th className="pb-3">وضعیت</th><th className="pb-3">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.map((u) => (
                          <tr key={u.id} className={cn(u.deleted_at && 'opacity-40')}>
                            <td className="py-3">
                              <p className="text-white">{u.username}{u.is_owner && <span className="mr-2 text-amber-400">👑</span>}{u.warnings > 0 && <Badge color="amber">⚠ {u.warnings}</Badge>}</p>
                              {u.id === user.id && <span className="text-[10px] text-cyan-400">(خودم)</span>}
                            </td>
                            <td className="py-3"><Badge color={u.role === 'admin' ? 'magenta' : 'cyan'}>{u.role === 'admin' ? '👑 ادمین' : '🎮 کاربر'}</Badge></td>
                            <td className="py-3">
                              <Badge color={statusInfo[u.status || 'active'].color}>{statusInfo[u.status || 'active'].label}</Badge>
                              {u.restrict_until && u.status !== 'active' && <p className="mt-1 text-[10px] text-slate-500">تا: {new Date(u.restrict_until).toLocaleString('fa-IR')}</p>}
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-2">
                                {(!u.is_owner || isOwner) && !u.deleted_at && <NeonButton size="sm" variant="ghost" onClick={() => setModTarget(u)}>🛡 مدیریت</NeonButton>}
                                {u.id !== user.id && !u.is_owner && !u.deleted_at && <NeonButton size="sm" variant="ghost" onClick={() => setWarnTarget(u)}>⚠ اخطار</NeonButton>}
                                {u.role !== 'admin' && !u.deleted_at && <NeonButton size="sm" variant="ghost" onClick={() => handlePromote(u)}>⬆ ارتقا</NeonButton>}
                                {u.role === 'admin' && !u.is_owner && isOwner && <NeonButton size="sm" variant="ghost" onClick={() => handleDemote(u)}>⬇ عزل</NeonButton>}
                                {!u.is_owner && u.id !== user.id && !u.deleted_at && <NeonButton size="sm" variant="ghost" onClick={() => handleDelete(u)} disabled={u.role === 'admin' && !isOwner}>🗑 حذف</NeonButton>}
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

            {/* ═══════════ بقیه تب‌ها ═══════════ */}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'tickets' && <TicketsTab />}
            {activeTab === 'stream' && <StreamControlTab />}
            {activeTab === 'lock' && <SiteLockControl />}
            {activeTab === 'tournaments' && <TournamentsTab />}
            {activeTab === 'news' && <NewsModerationTab />}
            {activeTab === 'groups' && <GroupsTab />}

            {activeTab === 'notify' && (
              <GlassCard className="p-6">
                <h2 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.25em] text-white">ارسال اعلان</h2>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <button onClick={() => setNotifType('public')} className={cn('flex-1 rounded-xl px-4 py-3 font-display text-xs font-bold', notifType === 'public' ? 'border border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'glass text-slate-400')}>📢 عمومی</button>
                    <button onClick={() => setNotifType('private')} className={cn('flex-1 rounded-xl px-4 py-3 font-display text-xs font-bold', notifType === 'private' ? 'border border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300' : 'glass text-slate-400')}>📨 خصوصی</button>
                  </div>
                  {notifType === 'private' && (
                    <select value={notifUser} onChange={(e) => setNotifUser(e.target.value)} className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none">
                      <option value="">انتخاب کاربر...</option>
                      {users.filter((u) => u.id !== user.id && !u.deleted_at).map((u) => (<option key={u.id} value={u.id}>{u.username}</option>))}
                    </select>
                  )}
                  <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="عنوان" className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60" />
                  <textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={4} placeholder="متن پیام..." className="glass w-full resize-none rounded-xl bg-slate-950/40 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/60" />
                  <NeonButton className="w-full" onClick={handleSendNotification} >📨 ارسال اعلان</NeonButton>
                </div>
              </GlassCard>
            )}

            {activeTab === 'reset' && (
              <GlassCard className="border-2 border-red-500/40 p-6">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-red-400">🧹 ریست کامل سایت</h2>
                <p className="mt-3 text-xs leading-6 text-slate-400">همه کاربران (به‌جز مالک 👑 و خودت)، کشورها، اتحادها، جنگ‌ها، تورنومنت‌ها و موجودی‌ها برای همیشه پاک می‌شوند. فروشگاه و کاتالوگ حفظ می‌شوند. غیرقابل بازگشت!</p>
                <button onClick={handleFullReset} className="mt-5 w-full rounded-xl border-2 border-red-500/60 bg-red-500/10 py-4 font-display text-sm font-black uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                  ⚠️ حذف همه کاربران و ریست سایت
                </button>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* مودال مدیریت کاربر */}
      <AnimatePresence>
        {modTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setModTarget(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-strong w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-lg font-bold text-white">مدیریت: {modTarget.username}</h3>
              <div className="mt-5 space-y-3">
                <select value={modAction} onChange={(e) => setModAction(e.target.value)} className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none">
                  <option value="ban">🚫 بن دائم</option>
                  <option value="ban_temp">⏱ بن ساعتی</option>
                  <option value="block">🔒 مسدود (فقط چت)</option>
                  <option value="block_temp">🔒 مسدود ساعتی</option>
                  <option value="unban">✅ رفع محدودیت</option>
                </select>
                {(modAction === 'ban_temp' || modAction === 'block_temp') && (
                  <input type="number" min="1" value={modHours} onChange={(e) => setModHours(e.target.value)} className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none" />
                )}
                <input value={modReason} onChange={(e) => setModReason(e.target.value)} placeholder="دلیل (نمایش به کاربر)" className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="mt-6 flex gap-3">
                <NeonButton className="flex-1" onClick={applyModeration}>اعمال</NeonButton>
                <NeonButton variant="ghost" className="flex-1" onClick={() => setModTarget(null)}>انصراف</NeonButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال اخطار */}
      <AnimatePresence>
        {warnTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setWarnTarget(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-strong w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-lg font-bold text-white">⚠️ اخطار به: {warnTarget.username}</h3>
              <textarea value={warnMessage} onChange={(e) => setWarnMessage(e.target.value)} rows={3} placeholder="متن اخطار..." className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white outline-none focus:border-amber-400/50" />
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