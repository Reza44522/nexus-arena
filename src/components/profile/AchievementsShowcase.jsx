import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const toFa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

/* ─────────── ویترین دستاوردهای یک بازیکن ───────────
   - بررسی خودکار باز شدن (فقط برای پروفایل خود کاربر)
   - نمایش دستاوردهای باز شده + قفل‌شده‌ها به‌عنوان هدف
   - آپدیت زنده با Realtime
─────────────────────────────────────────────────── */
export default function AchievementsShowcase({ userId }) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [unlockedMap, setUnlockedMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      // ✅ فقط وقتی کاربر پروفایل خودش را می‌بیند، بررسی خودکار انجام شود
      if (user?.id === userId) {
        try {
          await supabase.rpc('check_achievements', { p_user_id: userId });
        } catch {}
      }

      const [achRes, uaRes] = await Promise.all([
        supabase.from('achievements').select('*').order('created_at'),
        supabase.from('user_achievements').select('*').eq('user_id', userId),
      ]);
      if (cancelled) return;

      setAchievements(achRes.data || []);
      const map = {};
      (uaRes.data || []).forEach((ua) => {
        map[ua.achievement_id] = ua.unlocked_at;
      });
      setUnlockedMap(map);
      setLoading(false);
    };
    load();

    // 📡 آپدیت زنده وقتی دستاوردی همان لحظه باز می‌شود
    const channel = supabase
      .channel('ach-showcase-' + userId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_achievements', filter: `user_id=eq.${userId}` },
        (payload) => {
          setUnlockedMap((prev) => ({ ...prev, [payload.new.achievement_id]: payload.new.unlocked_at }));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, user?.id]);

  const unlockedCount = achievements.filter((a) => unlockedMap[a.id]).length;

  // باز شده‌ها اول
  const sorted = [...achievements].sort(
    (x, y) => (unlockedMap[y.id] ? 1 : 0) - (unlockedMap[x.id] ? 1 : 0)
  );

  return (
    <section className="glass-strong rounded-3xl border border-white/10 p-6">
      {/* هدر */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20">
            <Trophy className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-display text-base font-black text-white">دستاوردها</h3>
            <p className="text-[11px] text-slate-400">افتخارات این بازیکن در آرنا</p>
          </div>
        </div>
        <span className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-display text-xs font-bold text-amber-300">
          {toFa(unlockedCount)} / {toFa(achievements.length)}
        </span>
      </div>

      {loading ? (
        <div className="grid place-items-center py-12">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        </div>
      ) : achievements.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">هنوز دستاوردی تعریف نشده است.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {sorted.map((a, i) => {
            const unlockedAt = unlockedMap[a.id];
            const unlocked = !!unlockedAt;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                title={a.description}
                className={
                  unlocked
                    ? 'relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-transparent p-4 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
                    : 'relative rounded-2xl border border-white/5 bg-white/[0.03] p-4 opacity-60'
                }
              >
                <div className={`text-3xl ${unlocked ? '' : 'grayscale'}`}>{a.icon}</div>
                <p className={`mt-2 text-sm font-bold ${unlocked ? 'text-white' : 'text-slate-300'}`}>
                  {a.title}
                </p>
                <p className={`mt-1 text-[10px] leading-5 ${unlocked ? 'text-slate-400' : 'text-slate-500'}`}>
                  {a.description}
                </p>

                {unlocked ? (
                  <>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                        +{toFa(a.xp_reward)} XP
                      </span>
                      {a.coins_reward > 0 && (
                        <span className="rounded-md bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                          +{toFa(a.coins_reward)} سکه
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[9px] text-slate-500">
                      🔓 {new Date(unlockedAt).toLocaleDateString('fa-IR')}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 flex items-center gap-1 text-[9px] text-slate-500">
                    <Lock size={10} />
                    هنوز باز نشده
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}