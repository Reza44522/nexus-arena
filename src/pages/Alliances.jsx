import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Crown, Plus, LogOut, Trash2, Package, X, UserX, HeartHandshake, Megaphone, Warehouse, Pencil, TrendingUp, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RESOURCES, fmtNum, toFa } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const EMBLEMS = ['🛡️', '⚔️', '🦅', '🐺', '🔥', '❄️', '⚡', '🌙', '️', '💎'];
const MAX_MEMBERS = 10;

const powerOf = (members) =>
  (members || []).reduce((sum, m) => {
        const r = m.profile?.country?.resources || m.country?.resources || {};
    return sum + Object.values(r).reduce((a, v) => a + Number(v || 0), 0);
  }, 0);

const roleChip = (role) =>
  role === 'leader'
    ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
    : role === 'admin'
    ? 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300'
    : 'border-white/10 bg-white/5 text-slate-400';

/* ─────────── Alliances v2 — دیپلماسی کامل ─────────── */
export default function Alliances() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [alliances, setAlliances] = useState([]);
  const [my, setMy] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [announces, setAnnounces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fEmblem, setFEmblem] = useState('🛡️');
  const [showEdit, setShowEdit] = useState(false);
  const [transferTo, setTransferTo] = useState(null);
  const [transferRes, setTransferRes] = useState('wood');
  const [transferAmount, setTransferAmount] = useState('');
  const [showDonate, setShowDonate] = useState(false);
  const [donateRes, setDonateRes] = useState('wood');
  const [donateAmount, setDonateAmount] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [helpRes, setHelpRes] = useState('wood');
  const [helpAmount, setHelpAmount] = useState('');
  const [helpMsg, setHelpMsg] = useState('');
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  const load = async () => {
    if (!user?.id) return;
    const [al, mm] = await Promise.all([
      supabase.from('alliances').select('*, leader:profiles(username), members:alliance_members(user_id)').order('created_at', { ascending: false }),
      supabase.from('alliance_members').select('role, alliance:alliances(*)').eq('user_id', user.id).maybeSingle(),
    ]);
        if (al.error) console.error('❌ alliances:', al.error.message);
    if (mm.error) console.error('❌ my membership:', mm.error.message);
    setAlliances(al.data || []);
    setMy(mm.data || null);
    if (mm.data?.alliance?.id) {
      const id = mm.data.alliance.id;
      const [mem, req, ann] = await Promise.all([
                        supabase.from('alliance_members').select('*, profile:profiles(id, username, country:player_countries(flag, name_fa, resources))').eq('alliance_id', id),
        supabase.from('alliance_help_requests').select('*, user:profiles(username)').eq('alliance_id', id).order('created_at', { ascending: false }),
        supabase.from('alliance_announcements').select('*, author:profiles(username)').eq('alliance_id', id).order('created_at', { ascending: false }).limit(20),
      ]);
            if (mem.error) console.error('❌ members:', mem.error.message);
      if (req.error) console.error('❌ requests:', req.error.message);
      if (ann.error) console.error('❌ announcements:', ann.error.message);
      setMembers(mem.data || []);
      setRequests(req.data || []);
      setAnnounces(ann.data || []);
    } else { setMembers([]); setRequests([]); setAnnounces([]); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('alliances-' + user?.id + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alliances' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alliance_members' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alliance_help_requests' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alliance_announcements' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  /* ─────────── اکشن‌ها ─────────── */
  const create = async () => {
    if (fName.trim().length < 3) return flash('❌ نام اتحاد حداقل ۳ کاراکتر');
    setBusy(true);
    const { data, error } = await supabase.rpc('create_alliance', { p_name: fName.trim(), p_description: fDesc.trim() });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    // نماد را جدا ذخیره کن
    const { data: created } = await supabase.from('alliances').select('id').eq('leader_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (created) await supabase.rpc('update_alliance', { p_alliance_id: created.id, p_name: null, p_description: null, p_emblem: fEmblem });
    setShowCreate(false); setFName(''); setFDesc(''); setFEmblem('🛡️');
    flash('✅ اتحاد ساخته شد — تو لیدر هستی! 👑');
    load();
  };

  const saveEdit = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('update_alliance', { p_alliance_id: my.alliance.id, p_name: fName.trim() || null, p_description: fDesc.trim() || null, p_emblem: fEmblem });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    setShowEdit(false);
    flash('✅ اتحاد به‌روزرسانی شد');
    load();
  };

  const join = async (id) => {
    const { data, error } = await supabase.rpc('join_alliance', { p_alliance_id: id });
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('✅ به اتحاد پیوستی');
    load();
  };

  const leave = async () => {
    if (!window.confirm('از اتحاد خارج می‌شوی؟')) return;
    const { error } = await supabase.from('alliance_members').delete().eq('user_id', user.id);
    if (error) return flash('❌ ' + error.message);
    flash('✅ از اتحاد خارج شدی');
    load();
  };

  const kick = async (m) => {
    if (!window.confirm(`${m.profile?.username} از اتحاد اخراج شود؟`)) return;
    const { error } = await supabase.from('alliance_members').delete().eq('id', m.id);
    if (error) return flash('❌ ' + error.message);
    flash('✅ عضو اخراج شد');
    load();
  };

  const setRole = async (m, role) => {
    const { data, error } = await supabase.rpc('set_member_role', { p_alliance_id: my.alliance.id, p_user_id: m.user_id, p_role: role });
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(role === 'admin' ? '✅ به ادمین اتحاد ارتقا یافت' : '✅ نقش به عضو تنزل یافت');
    load();
  };

  const dissolve = async (id, name) => {
    if (!window.confirm(`⚠️ اتحاد «${name}» برای همیشه منحل شود؟`)) return;
    const { data, error } = await supabase.rpc('dissolve_alliance', { p_alliance_id: id });
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('✅ اتحاد منحل شد');
    load();
  };

  const transfer = async () => {
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) return flash('❌ مقدار نامعتبر');
    setBusy(true);
    const { data, error } = await supabase.rpc('transfer_resource', { p_to_user: transferTo.user_id, p_resource: transferRes, p_amount: amount });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`✅ ${toFa(amount)} واحد ${RESOURCES[transferRes]?.label} به ${transferTo.profile?.username} ارسال شد`);
    setTransferTo(null); setTransferAmount('');
    load();
  };

  const donate = async () => {
    const amount = Number(donateAmount);
    if (!amount || amount <= 0) return flash('❌ مقدار نامعتبر');
    setBusy(true);
    const { data, error } = await supabase.rpc('donate_to_alliance', { p_alliance_id: my.alliance.id, p_resource: donateRes, p_amount: amount });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash(`✅ ${toFa(amount)} واحد ${RESOURCES[donateRes]?.label} به خزانه اتحاد اهدا شد`);
    setShowDonate(false); setDonateAmount('');
    load();
  };

  const sendHelp = async () => {
    const amount = Number(helpAmount);
    if (!amount || amount <= 0) return flash('❌ مقدار نامعتبر');
    setBusy(true);
    const { error } = await supabase.from('alliance_help_requests').insert({ alliance_id: my.alliance.id, user_id: user.id, resource: helpRes, amount, message: helpMsg.trim() || null });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    setShowHelp(false); setHelpAmount(''); setHelpMsg('');
    flash('✅ درخواست کمک برای اعضا ارسال شد');
    load();
  };

  const fulfill = async (r) => {
    setBusy(true);
    const { data, error } = await supabase.rpc('transfer_resource', { p_to_user: r.user_id, p_resource: r.resource, p_amount: r.amount });
    if (error) { setBusy(false); return flash('❌ ' + error.message); }
    if (data && data.ok === false) { setBusy(false); return flash('❌ ' + data.error); }
    await supabase.from('alliance_help_requests').update({ status: 'closed' }).eq('id', r.id);
    setBusy(false);
    flash('✅ کمک ارسال و درخواست بسته شد');
    load();
  };

  const closeReq = async (r) => {
    await supabase.from('alliance_help_requests').update({ status: 'closed' }).eq('id', r.id);
    load();
  };

  const publishAnnounce = async () => {
    if (annTitle.trim().length < 3 || annBody.trim().length < 5) return flash('❌ عنوان و متن اطلاعیه را کامل بنویس');
    setBusy(true);
    const { data, error } = await supabase.rpc('announce', { p_alliance_id: my.alliance.id, p_title: annTitle.trim(), p_body: annBody.trim() });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    setShowAnnounce(false); setAnnTitle(''); setAnnBody('');
    flash('✅ اطلاعیه منتشر شد');
    load();
  };

  const deleteAnnounce = async (a) => {
    if (!window.confirm('اطلاعیه حذف شود؟')) return;
    await supabase.from('alliance_announcements').delete().eq('id', a.id);
    load();
  };

  const isLeader = my?.role === 'leader';
  const isOfficer = my?.role === 'leader' || my?.role === 'admin';
  const alliancePower = powerOf(members);

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
        <div className="absolute inset-x-0 bottom-0 h-[42vh]" style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}>
          <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)', backgroundSize: '44px 44px', transform: 'perspective(700px) rotateX(56deg) scale(1.25)', transformOrigin: 'bottom', animation: 'gridFloor 2.2s linear infinite' }} />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[130px]" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {notice && (
          <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM)}>{notice}</motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-6xl">
        {/* هدر */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-emerald-400/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
              Diplomacy // Alliances
            </p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
              اتحاد <span className="text-gradient">ملت‌ها</span>
            </h1>
            <p className="mt-3 text-sm text-slate-500">اتحاد بساز، خزانه مشترک داشته باش، منابع تبادل کن و قدرت بگیر.</p>
          </div>
          {!my && (
            <button onClick={() => setShowCreate(true)} className={cn('flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-cyan-500 px-5 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.4)] transition-all hover:shadow-[0_0_36px_rgba(52,211,153,0.6)]', CLIP_SM)}>
              <Plus size={14} /> ساخت اتحاد
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" /></div>
        ) : !my ? (
          /* ─────────── لیست اتحادها ─────────── */
          alliances.length === 0 ? (
            <div className={cn('border border-white/10 bg-[#070b18]/80 p-14 text-center text-slate-400', CLIP)}>
              <HeartHandshake className="mx-auto mb-3 h-12 w-12 opacity-30" />
              هنوز اتحادی ساخته نشده — اولین اتحاد را تو بساز! 🤝
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {alliances.map((a, i) => {
                const full = (a.members?.length || 0) >= MAX_MEMBERS;
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }} className={cn('relative border border-white/10 bg-[#070b18]/85 p-5 backdrop-blur-xl transition-colors hover:border-emerald-400/40', CLIP)}>
                    <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-emerald-400/40" />
                    <div className="flex items-center gap-3">
                      <div className={cn('grid h-14 w-14 place-items-center bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 text-3xl', CLIP_SM)}>{a.emblem}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-base font-bold text-white">{a.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500"><Crown size={10} className="text-amber-400" /> {a.leader?.username}</p>
                      </div>
                    </div>
                    {a.description && <p className="mt-3 line-clamp-2 text-xs text-slate-400">{a.description}</p>}
                    <div className="mt-3 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-500"><Users size={10} /> {toFa(a.members?.length || 0)}/{toFa(MAX_MEMBERS)} عضو</span>
                      <span className={cn(full ? 'text-red-400' : 'text-emerald-300')}>{full ? 'پر است' : 'جا دارد'}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${((a.members?.length || 0) / MAX_MEMBERS) * 100}%` }} />
                    </div>
                    <button onClick={() => join(a.id)} disabled={full} className={cn('mt-4 w-full py-2 font-display text-xs font-black uppercase tracking-[0.2em] transition-all', CLIP_SM, full ? 'border border-white/10 bg-white/5 text-slate-600' : 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]')}>
                      {full ? 'ظرفیت تکمیل' : 'پیوستن به اتحاد'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          /* ─────────── داشبورد اتحاد من ─────────── */
          <div className="space-y-8">
            {/* هدر اتحاد */}
            <div className={cn('relative border border-emerald-400/30 bg-[#070b18]/90 p-6 backdrop-blur-xl', CLIP)}>
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-emerald-400/60" />
              <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />
              <div className="flex flex-wrap items-center gap-5">
                <div className="relative">
                  <span className="absolute inset-0 rounded-xl bg-emerald-400/25 blur-[12px]" />
                  <div className={cn('relative grid h-20 w-20 place-items-center bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 text-4xl', CLIP_SM)}>{my.alliance.emblem}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl font-black text-white">{my.alliance.name}</h2>
                    {isLeader && (
                      <button onClick={() => { setFName(my.alliance.name); setFDesc(my.alliance.description || ''); setFEmblem(my.alliance.emblem || '🛡️'); setShowEdit(true); }} className="grid h-7 w-7 place-items-center text-slate-500 transition hover:text-cyan-300" title="ویرایش اتحاد">
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{my.alliance.description || 'بدون توضیح'}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                    <span className={cn('flex items-center gap-1 border border-white/10 bg-white/5 px-2 py-1 text-slate-300', CLIP_SM)}><Users size={10} /> {toFa(members.length)}/{toFa(MAX_MEMBERS)} عضو</span>
                    <span className={cn('flex items-center gap-1 border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-cyan-300', CLIP_SM)}><TrendingUp size={10} /> قدرت: {fmtNum(alliancePower)}</span>
                    <span className={cn('flex items-center gap-1 border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-amber-300', CLIP_SM)}><Crown size={10} /> لیدر: {members.find((m) => m.role === 'leader')?.profile?.username}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowDonate(true)} className={cn('flex items-center gap-1.5 border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/20', CLIP_SM)}>
                    <Warehouse size={12} /> اهدا به خزانه
                  </button>
                  <button onClick={() => setShowHelp(true)} className={cn('flex items-center gap-1.5 border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-400/20', CLIP_SM)}>
                    <HeartHandshake size={12} /> درخواست کمک
                  </button>
                  {isOfficer && (
                    <button onClick={() => setShowAnnounce(true)} className={cn('flex items-center gap-1.5 border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-2 text-[10px] font-bold text-fuchsia-300 transition hover:bg-fuchsia-400/20', CLIP_SM)}>
                      <Megaphone size={12} /> اطلاعیه
                    </button>
                  )}
                  {isLeader ? (
                    <button onClick={() => dissolve(my.alliance.id, my.alliance.name)} className={cn('flex items-center gap-1.5 border border-red-400/40 bg-red-400/10 px-3 py-2 text-[10px] font-bold text-red-400 transition hover:bg-red-400/20', CLIP_SM)}>
                      <Trash2 size={12} /> انحلال
                    </button>
                  ) : (
                    <button onClick={leave} className={cn('flex items-center gap-1.5 border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-slate-400 transition hover:text-red-400', CLIP_SM)}>
                      <LogOut size={12} /> ترک
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* خزانه اتحاد */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-white">
                <Warehouse size={15} className="text-amber-300" /> خزانه اتحاد
              </h3>
              <div className="grid grid-cols-4 gap-3 lg:grid-cols-8">
                {Object.entries(RESOURCES).map(([k, r]) => (
                  <div key={k} className={cn('border border-white/10 bg-[#070b18]/85 p-2.5 text-center', CLIP_SM)}>
                    <p className="text-lg">{r.icon}</p>
                    <p className="text-[9px] text-slate-500">{r.label}</p>
                    <p className="font-display text-xs font-black text-amber-300">{fmtNum(my.alliance.resources?.[k] ?? 0)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* اعضا */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-white">
                  <Users size={15} className="text-emerald-300" /> اعضا ({toFa(members.length)})
                </h3>
                <div className="space-y-2.5">
                  {members.map((m) => {
                    const mp = powerOf([m]);
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className={cn('flex items-center gap-3 border border-white/5 bg-white/5 p-3', CLIP_SM)}>
                        <div className={cn('grid h-10 w-10 shrink-0 place-items-center bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-black text-slate-950', CLIP_SM)}>
                          {(m.profile?.username || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-white">
                                                        {m.profile?.username} {m.profile?.country?.flag || ''}
                            <span className={cn('border px-1.5 py-0.5 text-[8px] font-black', CLIP_SM, roleChip(m.role))}>
                              {m.role === 'leader' ? '👑 لیدر' : m.role === 'admin' ? '🛡 ادمین اتحاد' : 'عضو'}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                                                        {m.profile?.country?.name_fa || 'بدون کشور'} • قدرت: {fmtNum(mp)}
                          </p>
                        </div>
                        {m.user_id !== user.id && (
                          <div className="flex gap-1.5">
                            <button onClick={() => setTransferTo(m)} className={cn('grid h-8 w-8 place-items-center border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20', CLIP_SM)} title="ارسال منبع">
                              <Package size={13} />
                            </button>
                            {isLeader && m.role !== 'leader' && (
                              <>
                                <button onClick={() => setRole(m, m.role === 'admin' ? 'member' : 'admin')} className={cn('grid h-8 w-8 place-items-center border border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300 transition hover:bg-fuchsia-400/20', CLIP_SM)} title={m.role === 'admin' ? 'تنزل به عضو' : 'ارتقا به ادمین اتحاد'}>
                                  <ShieldCheck size={13} />
                                </button>
                                <button onClick={() => kick(m)} className={cn('grid h-8 w-8 place-items-center border border-red-400/30 bg-red-400/10 text-red-400 transition hover:bg-red-400/20', CLIP_SM)} title="اخراج">
                                  <UserX size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ستون راست: اطلاعیه‌ها + درخواست‌ها */}
              <div className="space-y-8">
                <div>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-white">
                    <Megaphone size={15} className="text-fuchsia-300" /> اطلاعیه‌های اتحاد
                  </h3>
                  {announces.length === 0 ? (
                    <div className={cn('border border-white/10 bg-[#070b18]/80 p-6 text-center text-slate-500', CLIP)}>اطلاعیه‌ای نیست</div>
                  ) : (
                    <div className="space-y-2.5">
                      {announces.map((a) => (
                        <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn('group border border-fuchsia-400/25 bg-fuchsia-400/5 p-4', CLIP_SM)}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-white">📢 {a.title}</p>
                            {(a.author_id === user.id || isLeader || isAdmin) && (
                              <button onClick={() => deleteAnnounce(a)} className="grid h-6 w-6 place-items-center text-red-400 opacity-0 transition hover:bg-red-400/10 group-hover:opacity-100"><Trash2 size={11} /></button>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-300">{a.body}</p>
                          <p className="mt-2 text-[9px] text-slate-500">{a.author?.username} • {new Date(a.created_at).toLocaleString('fa-IR')}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-white">
                    <HeartHandshake size={15} className="text-amber-300" /> درخواست‌های کمک
                  </h3>
                  {requests.filter((r) => r.status === 'open').length === 0 ? (
                    <div className={cn('border border-white/10 bg-[#070b18]/80 p-6 text-center text-slate-500', CLIP)}>درخواست کمک بازی ندارید</div>
                  ) : (
                    <div className="space-y-2.5">
                      {requests.filter((r) => r.status === 'open').map((r) => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn('border border-amber-400/25 bg-amber-400/5 p-4', CLIP_SM)}>
                          <p className="text-sm font-bold text-white">
                            {r.user?.username} درخواست <span className="text-amber-300">{toFa(r.amount)} واحد {RESOURCES[r.resource]?.label} {RESOURCES[r.resource]?.icon}</span> دارد
                          </p>
                          {r.message && <p className="mt-1 text-xs text-slate-400">«{r.message}»</p>}
                          <div className="mt-3 flex gap-2">
                            {r.user_id !== user.id && (
                              <button onClick={() => fulfill(r)} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-emerald-400 to-cyan-500 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-950 disabled:opacity-50', CLIP_SM)}>ارسال کمک</button>
                            )}
                            {(r.user_id === user.id || isOfficer) && (
                              <button onClick={() => closeReq(r)} className={cn('flex-1 border border-white/10 bg-white/5 py-1.5 text-[10px] font-bold text-slate-400', CLIP_SM)}>بستن درخواست</button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نظارت ادمین */}
        {isAdmin && (
          <div className="mt-12">
            <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-fuchsia-300">
              <Shield size={15} /> نظارت ادمین بر همه اتحادها
            </h3>
            <div className="space-y-2.5">
              {alliances.map((a) => (
                <div key={a.id} className={cn('flex items-center gap-3 border border-fuchsia-400/20 bg-fuchsia-400/5 p-3', CLIP_SM)}>
                  <span className="text-xl">{a.emblem}</span>
                  <span className="flex-1 text-sm font-bold text-white">{a.name}</span>
                  <span className="text-[10px] text-slate-500">لیدر: {a.leader?.username} • {toFa(a.members?.length || 0)} عضو</span>
                  <button onClick={() => dissolve(a.id, a.name)} className={cn('grid h-8 w-8 place-items-center border border-red-400/30 bg-red-400/10 text-red-400 transition hover:bg-red-400/20', CLIP_SM)} title="انحلال">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─────────── مودال ساخت اتحاد ─────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} onClick={(e) => e.stopPropagation()} className={cn('w-full max-w-md border border-emerald-400/40 bg-[#070b18]/95 p-6', CLIP)}>
              <p className="mb-4 flex items-center gap-2 font-display text-sm font-black text-white"><Plus size={15} className="text-emerald-300" /> ساخت اتحاد جدید</p>
              <label className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.28em] text-slate-500">نماد اتحاد</label>
              <div className="mb-3 flex flex-wrap gap-2">
                {EMBLEMS.map((e) => (
                  <button key={e} onClick={() => setFEmblem(e)} className={cn('grid h-10 w-10 place-items-center border text-xl transition', CLIP_SM, fEmblem === e ? 'border-emerald-400/60 bg-emerald-400/15 shadow-[0_0_14px_rgba(52,211,153,0.4)]' : 'border-white/10 bg-white/5 hover:bg-white/10')}>{e}</button>
                ))}
              </div>
              <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="نام اتحاد..." className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50" />
              <input value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder="توضیح (اختیاری)..." className="mb-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50" />
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className={cn('flex-1 border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                <button onClick={create} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-emerald-400 to-cyan-500 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>ساخت اتحاد</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال ویرایش اتحاد ─────────── */}
      <AnimatePresence>
        {showEdit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]" onClick={() => setShowEdit(false)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} onClick={(e) => e.stopPropagation()} className={cn('w-full max-w-md border border-cyan-400/40 bg-[#070b18]/95 p-6', CLIP)}>
              <p className="mb-4 flex items-center gap-2 font-display text-sm font-black text-white"><Pencil size={15} className="text-cyan-300" /> ویرایش اتحاد</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {EMBLEMS.map((e) => (
                  <button key={e} onClick={() => setFEmblem(e)} className={cn('grid h-10 w-10 place-items-center border text-xl transition', CLIP_SM, fEmblem === e ? 'border-cyan-400/60 bg-cyan-400/15' : 'border-white/10 bg-white/5 hover:bg-white/10')}>{e}</button>
                ))}
              </div>
              <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="نام اتحاد..." className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50" />
              <input value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder="توضیح..." className="mb-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50" />
              <div className="flex gap-2">
                <button onClick={() => setShowEdit(false)} className={cn('flex-1 border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                <button onClick={saveEdit} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>ذخیره</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال انتقال منبع ─────────── */}
      <AnimatePresence>
        {transferTo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]" onClick={() => setTransferTo(null)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} onClick={(e) => e.stopPropagation()} className={cn('w-full max-w-md border border-cyan-400/40 bg-[#070b18]/95 p-6', CLIP)}>
              <p className="mb-4 flex items-center gap-2 font-display text-sm font-black text-white"><Package size={15} className="text-cyan-300" /> ارسال منبع به {transferTo.profile?.username}</p>
              <select value={transferRes} onChange={(e) => setTransferRes(e.target.value)} className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none" style={{ colorScheme: 'dark' }}>
                {Object.entries(RESOURCES).map(([k, r]) => (<option key={k} value={k}>{r.icon} {r.label}</option>))}
              </select>
              <input value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} type="number" min="1" placeholder="مقدار..." className="mb-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50" />
              <div className="flex gap-2">
                <button onClick={() => setTransferTo(null)} className={cn('flex-1 border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                <button onClick={transfer} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>ارسال</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال اهدا به خزانه ─────────── */}
      <AnimatePresence>
        {showDonate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]" onClick={() => setShowDonate(false)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} onClick={(e) => e.stopPropagation()} className={cn('w-full max-w-md border border-amber-400/40 bg-[#070b18]/95 p-6', CLIP)}>
              <p className="mb-4 flex items-center gap-2 font-display text-sm font-black text-white"><Warehouse size={15} className="text-amber-300" /> اهدا به خزانه اتحاد</p>
              <select value={donateRes} onChange={(e) => setDonateRes(e.target.value)} className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none" style={{ colorScheme: 'dark' }}>
                {Object.entries(RESOURCES).map(([k, r]) => (<option key={k} value={k}>{r.icon} {r.label}</option>))}
              </select>
              <input value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} type="number" min="1" placeholder="مقدار..." className="mb-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50" />
              <div className="flex gap-2">
                <button onClick={() => setShowDonate(false)} className={cn('flex-1 border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                <button onClick={donate} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-amber-400 to-orange-500 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>اهداء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال درخواست کمک ─────────── */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]" onClick={() => setShowHelp(false)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} onClick={(e) => e.stopPropagation()} className={cn('w-full max-w-md border border-cyan-400/40 bg-[#070b18]/95 p-6', CLIP)}>
              <p className="mb-4 flex items-center gap-2 font-display text-sm font-black text-white"><HeartHandshake size={15} className="text-cyan-300" /> درخواست کمک از اتحاد</p>
              <select value={helpRes} onChange={(e) => setHelpRes(e.target.value)} className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none" style={{ colorScheme: 'dark' }}>
                {Object.entries(RESOURCES).map(([k, r]) => (<option key={k} value={k}>{r.icon} {r.label}</option>))}
              </select>
              <input value={helpAmount} onChange={(e) => setHelpAmount(e.target.value)} type="number" min="1" placeholder="مقدار..." className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50" />
              <input value={helpMsg} onChange={(e) => setHelpMsg(e.target.value)} placeholder="توضیح (اختیاری)..." className="mb-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50" />
              <div className="flex gap-2">
                <button onClick={() => setShowHelp(false)} className={cn('flex-1 border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                <button onClick={sendHelp} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>ارسال درخواست</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────── مودال اطلاعیه ─────────── */}
      <AnimatePresence>
        {showAnnounce && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[15000] grid place-items-center bg-black/60 px-4 backdrop-blur-[3px]" onClick={() => setShowAnnounce(false)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} onClick={(e) => e.stopPropagation()} className={cn('w-full max-w-md border border-fuchsia-400/40 bg-[#070b18]/95 p-6', CLIP)}>
              <p className="mb-4 flex items-center gap-2 font-display text-sm font-black text-white"><Megaphone size={15} className="text-fuchsia-300" /> انتشار اطلاعیه اتحاد</p>
              <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="عنوان اطلاعیه..." className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-400/50" />
              <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={4} placeholder="متن اطلاعیه..." className="mb-4 w-full resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-400/50" />
              <div className="flex gap-2">
                <button onClick={() => setShowAnnounce(false)} className={cn('flex-1 border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-400', CLIP_SM)}>انصراف</button>
                <button onClick={publishAnnounce} disabled={busy} className={cn('flex-1 bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-2.5 font-display text-xs font-black uppercase tracking-[0.2em] text-slate-950 disabled:opacity-50', CLIP_SM)}>انتشار</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}