import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Crown, Shield, Trophy, Swords, Target, Gamepad2, Calendar, UserPlus, Star, Award } from 'lucide-react';
import AchievementsShowcase from '../components/profile/AchievementsShowcase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

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

/* ─────────── Profile v7 — PLAYER CARD ─────────── */
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
          .or(`and(user_id.eq.${user.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${id})`)
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
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <Link to="/leaderboard" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-cyan-300">
          <ArrowRight size={16} /> بازگشت به لیدربورد
        </Link>

        {/* Toast */}
        {notice && (
          <div className={cn('mb-4 border bg-slate-950/95 px-5 py-2.5 text-center text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM)}>
            {notice}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="relative h-40 overflow-hidden rounded-md bg-white/5">
                <span className="absolute inset-0" style={{ animation: 'shimmer 1.4s infinite', background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.12), transparent)' }} />
              </div>
            ))}
          </div>
        ) : !p ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-12 text-center text-slate-400', CLIP)}>
            کاربر پیدا نشد! 😕
          </div>
        ) : (
          <>
            {/* ─────────── هدر پروفایل ─────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className={cn('relative border border-fuchsia-400/25 bg-[#070b18]/85 p-6 backdrop-blur-xl md:p-8', CLIP)}>
                <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
                <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />
                <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" style={{ animation: 'scanY 5s linear infinite' }} />

                <div className="relative flex flex-wrap items-center gap-5">
                  {/* آواتار با قاب فعال */}
                  <div className="relative">
                    <span className="absolute inset-0 rounded-xl bg-cyan-400/25 blur-[12px]" />
                    <div
                      className={cn(
                        'relative grid h-24 w-24 place-items-center bg-gradient-to-br text-3xl font-black text-slate-950',
                        CLIP,
                        equippedFrame ? equippedFrame.item.accent : 'from-cyan-400 to-fuchsia-500'
                      )}
                    >
                      {p.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <span className={cn('absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#070b18]', p.status === 'active' ? 'bg-green-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-600')} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl font-black text-white md:text-3xl" style={{ animation: 'glitch 5s infinite' }}>
                        {p.username}
                        {equippedBadge && (
                          <span className="mr-2 align-middle" title={equippedBadge.item.name}>{equippedBadge.item.icon}</span>
                        )}
                      </h1>
                      {p.is_owner && (
                        <span className={cn('flex items-center gap-1 border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300', CLIP_SM)}>
                          <Crown size={11} /> مالک
                        </span>
                      )}
                      {p.role === 'admin' && !p.is_owner && (
                        <span className={cn('flex items-center gap-1 border border-fuchsia-400/40 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300', CLIP_SM)}>
                          <Shield size={11} /> ادمین
                        </span>
                      )}
                      {isMe && (
                        <span className={cn('border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300', CLIP_SM)}>(تو)</span>
                      )}
                    </div>

                    {equippedTitle && (
                      <span className={cn('mt-1 inline-block rounded-md bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold text-slate-950', equippedTitle.item.accent)}>
                        {equippedTitle.item.icon} {equippedTitle.item.name.replace('تایتل: ', '')}
                      </span>
                    )}

                    <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <Calendar size={12} /> عضو از {new Date(p.created_at).toLocaleDateString('fa-IR')}
                      <span className="text-slate-600">•</span>
                      {p.status === 'active' ? <span className="text-green-400">آنلاین</span> : 'آفلاین'}
                    </p>

                    <div className="mt-4 max-w-md">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-bold text-cyan-300">سطح {p.level}</span>
                        <span className="text-slate-400">{p.xp} / {xpForNext} XP</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_14px_rgba(34,211,238,0.6)]"
                        />
                      </div>
                    </div>
                  </div>

                  {!isMe && (
                    <div className="shrink-0">
                      {relation === 'friend' ? (
                        <span className={cn('border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300', CLIP_SM)}>✓ دوست هستید</span>
                      ) : relation === 'pending' ? (
                        <span className={cn('border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300', CLIP_SM)}>درخواست در انتظار</span>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={addFriend}
                          className={cn('flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_32px_rgba(34,211,238,0.6)] disabled:opacity-50', CLIP_SM)}
                        >
                          <UserPlus size={14} /> Add Friend
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ─────────── کارت‌های آمار ─────────── */}
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Gamepad2, label: 'کل مسابقات', value: p.matches_played, color: 'text-cyan-300' },
                { icon: Trophy, label: 'پیروزی‌ها', value: p.wins, color: 'text-green-400' },
                { icon: Swords, label: 'شکست‌ها', value: p.losses, color: 'text-red-400' },
                { icon: Target, label: 'درصد برد', value: winRate + '٪', color: 'text-fuchsia-300' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className={cn('border border-white/10 bg-[#070b18]/80 p-4 text-center backdrop-blur-xl transition-colors hover:border-cyan-400/40', CLIP_SM)}
                >
                  <s.icon className={cn('mx-auto mb-2 h-5 w-5 drop-shadow-[0_0_8px_currentColor]', s.color)} />
                  <p className="font-display text-xl font-bold text-white">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* ─────────── تاریخچه مسابقات ─────────── */}
            <div className={cn('mt-6 border border-cyan-400/25 bg-[#070b18]/85 p-6 backdrop-blur-xl', CLIP)}>
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
              <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.25em] text-white">
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
                        whileHover={{ x: -4 }}
                        className={cn('relative flex items-center gap-3 border border-white/5 bg-white/5 p-3 pr-4', CLIP_SM)}
                      >
                        <span className={cn('absolute right-0 top-0 h-full w-0.5', m.result === 'win' ? 'bg-cyan-400' : m.result === 'loss' ? 'bg-red-500' : 'bg-yellow-400')} />
                        <span className="text-2xl">{g.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{g.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(m.played_at).toLocaleString('fa-IR')} • {m.duration_minutes} دقیقه
                          </p>
                        </div>
                        <span className="text-xs font-bold text-fuchsia-300">+{m.xp_gained} XP</span>
                        <span className={cn('border px-3 py-1 text-xs font-bold', CLIP_SM, r.cls)}>{r.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─────────── 🏆 ویترین دستاوردها ─────────── */}
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Award size={16} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
                <h2 className="font-display text-sm font-black uppercase tracking-[0.25em] text-white">ویترین دستاوردها</h2>
              </div>
              <AchievementsShowcase userId={id} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}