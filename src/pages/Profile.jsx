import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Crown, Shield, Trophy, Swords, Target, Gamepad2, Calendar, UserPlus, Star } from 'lucide-react';
import PageWrapper from '../components/ui/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import NeonButton from '../components/ui/NeonButton';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import { STORE_ACCENTS } from '../utils/storeAccents';

const GAMES = {
  mafia: { name: 'مافیا', icon: '🕵️' },
  valorant: { name: 'Valorant', icon: '🔫' },
  csgo: { name: 'CS:GO', icon: '💣' },
  lol: { name: 'LoL', icon: '⚔️' },
  dota2: { name: 'Dota 2', icon: '🛡️' },
  pubg: { name: 'PUBG', icon: '🎯' },
  other: { name: 'سایر', icon: '🎮' },
};

const RESULT = {
  win: { label: 'پیروزی', cls: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300' },
  loss: { label: 'شکست', cls: 'border-red-400/40 bg-red-500/10 text-red-400' },
  draw: { label: 'مساوی', cls: 'border-yellow-400/40 bg-yellow-500/10 text-yellow-300' },
};

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [matches, setMatches] = useState([]);
  const [equipped, setEquipped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relation, setRelation] = useState('none');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const isMe = user?.id === id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      setP(prof || null);

      const { data: m } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', id)
        .order('played_at', { ascending: false })
        .limit(10);
      setMatches(m || []);

      // ✅ آیتم‌های فعال این کاربر
      const { data: eq, error: eqErr } = await supabase
        .from('user_inventory')
        .select('*, item:store_items(*)')
        .eq('user_id', id)
        .eq('is_equipped', true);

      if (eqErr) {
        console.error('❌ equipped error:', eqErr.message);
        const plain = await supabase
          .from('user_inventory')
          .select('*')
          .eq('user_id', id)
          .eq('is_equipped', true);
        const rows = plain.data || [];
        const ids = rows.map((r) => r.item_id).filter(Boolean);
        if (ids.length) {
          const { data: items } = await supabase.from('store_items').select('*').in('id', ids);
          const map = {};
          (items || []).forEach((it) => (map[it.id] = it));
          rows.forEach((r) => (r.item = map[r.item_id]));
        }
        setEquipped(rows);
      } else {
        setEquipped(eq || []);
      }

      if (user?.id && user.id !== id) {
        const { data: fr } = await supabase
          .from('friendships')
          .select('id, status')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${user.id})`)
          .maybeSingle();
        setRelation(fr ? (fr.status === 'accepted' ? 'friend' : 'pending') : 'none');
      }
      setLoading(false);
    };
    load();
  }, [id, user?.id]);

  const winRate = p && p.matches_played > 0 ? Math.round((p.wins / p.matches_played) * 100) : 0;
  const xpForNext = (p?.level || 1) * 100;
  const progress = p ? Math.min(100, (p.xp / xpForNext) * 100) : 0;

  const equippedFrame = equipped.find((v) => v.item?.type === 'frame');
  const equippedTitle = equipped.find((v) => v.item?.type === 'title');
  const equippedBadge = equipped.find((v) => v.item?.type === 'badge');

  const addFriend = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('send_friend_request', { p_friend_id: id });
    if (error) setNotice('❌ ' + error.message);
    else if (data && data.ok === false) setNotice('❌ ' + data.error);
    else { setNotice('✅ درخواست دوستی ارسال شد'); setRelation('pending'); }
    setBusy(false);
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/leaderboard" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-cyan-300">
          <ArrowRight size={16} /> بازگشت به لیدربورد
        </Link>

        {notice && (
          <div className="glass-strong mb-4 rounded-xl border border-cyan-400/30 px-5 py-2.5 text-center text-sm text-white shadow-glow-cyan">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        ) : !p ? (
          <GlassCard className="p-12 text-center text-slate-400">کاربر پیدا نشد! 😕</GlassCard>
        ) : (
          <>
            {/* ─────────── هدر پروفایل ─────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="relative overflow-hidden p-6 md:p-8">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-cyan-500/20" />
                <div className="relative flex flex-wrap items-center gap-5">
                  {/* ✅ آواتار با قاب فعال */}
                  <div className="relative">
                    <div
                      className={cn(
                        'grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br text-3xl font-black text-slate-950 shadow-glow-cyan ring-4',
                        equippedFrame
                          ? cn(equippedFrame.item.accent, 'ring-white/30')
                          : 'from-cyan-400 to-fuchsia-500 ring-transparent'
                      )}
                    >
                      {p.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <span className={cn('absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#0b0b1c]', p.status === 'active' ? 'bg-green-400' : 'bg-slate-600')} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* ✅ اسم + بج فعال */}
                      <h1 className="font-display text-2xl font-black text-white md:text-3xl">
                        {p.username}
                        {equippedBadge && (
                          <span className="mr-2 align-middle" title={equippedBadge.item.name}>
                            {equippedBadge.item.icon}
                          </span>
                        )}
                      </h1>
                      {p.is_owner && <Badge color="amber"><Crown size={12} /> مالک</Badge>}
                      {p.role === 'admin' && !p.is_owner && <Badge color="magenta"><Shield size={12} /> ادمین</Badge>}
                      {isMe && <Badge color="cyan">(تو)</Badge>}
                    </div>

                    {/* ✅ تایتل فعال */}
                    {equippedTitle && (
                      <span className={cn('mt-1 inline-block rounded-lg bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold text-slate-950', equippedTitle.item.accent)}>
                        {equippedTitle.item.icon} {equippedTitle.item.name.replace('تایتل: ', '')}
                      </span>
                    )}

                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <Calendar size={12} /> عضو از {new Date(p.created_at).toLocaleDateString('fa-IR')}
                      <span className="text-slate-600">•</span>
                      {p.status === 'active' ? <span className="text-green-400">آنلاین</span> : 'آفلاین'}
                    </p>

                    <div className="mt-4 max-w-md">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-bold text-cyan-300">سطح {p.level}</span>
                        <span className="text-slate-400">{p.xp} / {xpForNext} XP</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-black/40">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-glow-cyan"
                        />
                      </div>
                    </div>
                  </div>

                  {!isMe && (
                    <div className="shrink-0">
                      {relation === 'friend' ? (
                        <Badge color="green">✓ دوست هستید</Badge>
                      ) : relation === 'pending' ? (
                        <Badge color="cyan">درخواست در انتظار</Badge>
                      ) : (
                        <NeonButton size="sm" disabled={busy} onClick={addFriend}>
                          <UserPlus size={14} className="ml-1 inline" /> Add Friend
                        </NeonButton>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* ─────────── کارت‌های آمار ─────────── */}
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Gamepad2, label: 'کل مسابقات', value: p.matches_played, color: 'text-cyan-300' },
                { icon: Trophy, label: 'پیروزی‌ها', value: p.wins, color: 'text-green-400' },
                { icon: Swords, label: 'شکست‌ها', value: p.losses, color: 'text-red-400' },
                { icon: Target, label: 'درصد برد', value: winRate + '٪', color: 'text-fuchsia-300' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <GlassCard className="p-4 text-center">
                    <s.icon className={cn('mx-auto mb-2 h-5 w-5', s.color)} />
                    <p className="font-display text-xl font-bold text-white">{s.value}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">{s.label}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* ─────────── تاریخچه مسابقات ─────────── */}
            <GlassCard className="mt-6 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.25em] text-white">
                <Star size={14} className="text-cyan-300" /> ۱۰ مسابقه‌ی اخیر
              </h2>
              {matches.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">هنوز مسابقه‌ای ثبت نکرده!</p>
              ) : (
                <div className="space-y-2">
                  {matches.map((m, i) => {
                    const g = GAMES[m.game_name] || GAMES.other;
                    const r = RESULT[m.result] || RESULT.draw;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
                      >
                        <span className="text-2xl">{g.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{g.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(m.played_at).toLocaleString('fa-IR')} • {m.duration_minutes} دقیقه
                          </p>
                        </div>
                        <span className="text-xs font-bold text-fuchsia-300">+{m.xp_gained} XP</span>
                        <span className={cn('rounded-lg border px-3 py-1 text-xs font-bold', r.cls)}>{r.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </PageWrapper>
  );
}