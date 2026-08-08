import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Target,
  TrendingUp,
  Zap,
  Plus,
  Gamepad2,
  Clock,
  Swords,
  Award,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// 🔹 XP لازم برای هر سطح (همون فرمول داخل تریگر SQL)
const xpForLevel = (level) => level * 100;

// 🔹 لیست بازی‌های قابل انتخاب (بعداً می‌تونیم از stream_settings بگیریم)
const GAME_OPTIONS = [
  { id: 'mafia', name: 'مافیا', icon: '🕵️' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'csgo', name: 'CS:GO', icon: '💣' },
  { id: 'lol', name: 'League of Legends', icon: '⚔️' },
  { id: 'dota2', name: 'Dota 2', icon: '🛡️' },
  { id: 'pubg', name: 'PUBG', icon: '🎯' },
  { id: 'other', name: 'سایر', icon: '🎮' },
];

// 🔹 رنگ‌ها بر اساس نتیجه (برای نمایش در لیست)
const RESULT_COLORS = {
  win: 'text-cyan-400 border-cyan-400/40 bg-cyan-500/10 shadow-glow-cyan',
  loss: 'text-red-400 border-red-400/40 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
  draw: 'text-yellow-400 border-yellow-400/40 bg-yellow-500/10 shadow-[0_0_12px_rgba(234,179,8,0.4)]',
};

const RESULT_LABELS = {
  win: 'پیروزی',
  loss: 'شکست',
  draw: 'مساوی',
};

const XP_MAP = { win: 50, draw: 20, loss: 10 };

export default function Dashboard() {
  const { user, profile } = useAuth();

  const [stats, setStats] = useState({
    xp: 0,
    level: 1,
    wins: 0,
    losses: 0,
    draws: 0,
    matches_played: 0,
  });

  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 🔹 فرم ثبت match جدید
  const [form, setForm] = useState({
    game_name: 'mafia',
    result: 'win',
    duration_minutes: 30,
    notes: '',
  });

  // 🔹 محاسبه درصد پیشرفت XP
  const xpForNext = xpForLevel(stats.level);
  const progressPercent = Math.min(100, (stats.xp / xpForNext) * 100);

  // 🔹 گرفتن آمار و matchهای اخیر
  useEffect(() => {
    if (!profile) return;
    setStats({
      xp: profile.xp ?? 0,
      level: profile.level ?? 1,
      wins: profile.wins ?? 0,
      losses: profile.losses ?? 0,
      draws: profile.draws ?? 0,
      matches_played: profile.matches_played ?? 0,
    });
    loadRecentMatches();
  }, [profile]);

  const loadRecentMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentMatches(data || []);
    } catch (err) {
      console.error('❌ خطا در دریافت matchها:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 ثبت match جدید
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    try {
      const xp = XP_MAP[form.result] || 0;
      const { error } = await supabase.from('matches').insert({
        user_id: user.id,
        game_name: form.game_name,
        result: form.result,
        xp_gained: xp,
        duration_minutes: Number(form.duration_minutes) || 0,
        notes: form.notes.trim(),
      });

      if (error) throw error;

      setSuccessMsg(`✅ ثبت شد! +${xp} XP دریافتی`);

      // 🔹 رفرش کردن آمار (چون تریگر داخل دیتابیس پروفایل رو آپدیت کرد)
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updatedProfile) {
        setStats({
          xp: updatedProfile.xp,
          level: updatedProfile.level,
          wins: updatedProfile.wins,
          losses: updatedProfile.losses,
          draws: updatedProfile.draws,
          matches_played: updatedProfile.matches_played,
        });
      }

      await loadRecentMatches();

      // 🔹 پاک کردن success message بعد از ۳ ثانیه
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('❌ خطا: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 🔹 Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent mb-2">
            داشبورد بازیکن
          </h1>
          <p className="text-white/60">
            خوش اومدی، <span className="text-cyan-400 font-semibold">{profile?.username || user.email}</span> 👋
          </p>
        </motion.div>

        {/* 🔹 کارت سطح و XP */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl p-6 mb-6 border border-cyan-500/20 shadow-glow-cyan"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-glow-cyan">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-sm text-white/50">سطح شما</div>
                <div className="font-display text-3xl font-bold text-cyan-400">
                  {stats.level}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-white/50">XP فعلی</div>
              <div className="font-display text-2xl font-bold text-fuchsia-400">
                {stats.xp} <span className="text-sm text-white/50">/ {xpForNext}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full shadow-glow-cyan"
            />
          </div>
          <div className="text-xs text-white/40 mt-2 text-center">
            {Math.floor(xpForNext - stats.xp)} XP تا سطح بعدی
          </div>
        </motion.div>

        {/* 🔹 کارت‌های آماری */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'کل مسابقات', value: stats.matches_played, icon: Gamepad2, color: 'cyan' },
            { label: 'پیروزی‌ها', value: stats.wins, icon: Trophy, color: 'green' },
            { label: 'شکست‌ها', value: stats.losses, icon: Swords, color: 'red' },
            { label: 'مساوی', value: stats.draws, icon: Target, color: 'yellow' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                <span className="text-xs text-white/40">{item.label}</span>
              </div>
              <div className="font-display text-2xl font-bold text-white">
                {item.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 🔹 دو ستون: فرم + لیست matchها */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 🔹 فرم ثبت match جدید */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-strong rounded-2xl p-6 border border-fuchsia-500/20"
          >
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-fuchsia-400" />
              <h2 className="font-display text-xl font-bold text-white">
                ثبت مسابقه جدید
              </h2>
            </div>

            {/* Game */}
            <label className="block text-sm text-white/60 mb-2">🎮 بازی</label>
            <select
              value={form.game_name}
              onChange={(e) => setForm({ ...form, game_name: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white mb-4 focus:outline-none focus:border-cyan-400"
            >
              {GAME_OPTIONS.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900">
                  {g.icon} {g.name}
                </option>
              ))}
            </select>

            {/* Result */}
            <label className="block text-sm text-white/60 mb-2">🏆 نتیجه</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['win', 'draw', 'loss'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, result: r })}
                  className={`py-2 rounded-lg border font-semibold text-sm transition-all ${
                    form.result === r
                      ? RESULT_COLORS[r]
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  }`}
                >
                  {RESULT_LABELS[r]}
                </button>
              ))}
            </div>

            {/* Duration */}
            <label className="block text-sm text-white/60 mb-2">⏱️ مدت (دقیقه)</label>
            <input
              type="number"
              min="1"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white mb-4 focus:outline-none focus:border-cyan-400"
            />

            {/* Notes */}
            <label className="block text-sm text-white/60 mb-2">📝 یادداشت (اختیاری)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="مثلاً: یه بازی سخته بود..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white mb-4 focus:outline-none focus:border-cyan-400 resize-none"
            />

            {/* XP Preview */}
            <div className="bg-fuchsia-500/10 border border-fuchsia-400/30 rounded-lg p-3 mb-4 text-center">
              <Zap className="inline w-4 h-4 text-fuchsia-400 ml-1" />
              <span className="text-fuchsia-300 font-semibold">
                XP دریافتی: +{XP_MAP[form.result]}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-glow-cyan"
            >
              {submitting ? '⏳ در حال ثبت...' : (
                <>
                  <Plus className="w-5 h-5" /> ثبت مسابقه
                </>
              )}
            </button>

            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-center text-cyan-400 font-semibold"
                >
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          {/* 🔹 لیست matchهای اخیر */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-strong rounded-2xl p-6 border border-cyan-500/20"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h2 className="font-display text-xl font-bold text-white">
                ۱۰ مسابقه اخیر
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12 text-white/50">⏳ در حال بارگذاری...</div>
            ) : recentMatches.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                هنوز مسابقه‌ای ثبت نکردی!
              </div>
            ) : (
              <div className="space-y-2 chat-scroll max-h-[420px] overflow-y-auto pr-2">
                {recentMatches.map((m) => {
                  const game = GAME_OPTIONS.find((g) => g.id === m.game_name);
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${RESULT_COLORS[m.result]}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{game?.icon || '🎮'}</div>
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {game?.name || m.game_name}
                          </div>
                          <div className="text-xs text-white/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {m.duration_minutes} دقیقه
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-sm">
                          {RESULT_LABELS[m.result]}
                        </div>
                        <div className="text-xs opacity-70">+{m.xp_gained} XP</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}