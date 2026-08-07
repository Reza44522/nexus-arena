import { motion } from 'framer-motion';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import Badge from '../components/ui/Badge';
import GlassCard from '../components/ui/GlassCard';
import { cn } from '../utils/cn';

const leaderboardData = [
  { rank: 1, name: 'ShadowKing', score: 98540, level: 89, game: 'Cyber Vanguard', avatar: '👑' },
  { rank: 2, name: 'NeonBlade', score: 87320, level: 76, game: 'Starfall Odyssey', avatar: '⚔️' },
  { rank: 3, name: 'PhantomX', score: 82150, level: 71, game: 'Quantum Clash', avatar: '🔥' },
  { rank: 4, name: 'CyberWolf', score: 75890, level: 68, game: 'Shadow Protocol', avatar: '🐺' },
  { rank: 5, name: 'NightHawk', score: 71230, level: 64, game: 'Neon Drift', avatar: '🦅' },
  { rank: 6, name: 'IronFist', score: 68940, level: 61, game: 'Arcane Realms', avatar: '🥊' },
  { rank: 7, name: 'StormRider', score: 65120, level: 58, game: 'Cyber Vanguard', avatar: '⚡' },
  { rank: 8, name: 'DarkMage', score: 62890, level: 55, game: 'Arcane Realms', avatar: '🧙' },
  { rank: 9, name: 'BlazeFury', score: 59430, level: 52, game: 'Quantum Clash', avatar: '🔥' },
  { rank: 10, name: 'FrostBite', score: 56780, level: 49, game: 'Starfall Odyssey', avatar: '❄️' },
];

const medalColors = ['text-amber-400', 'text-slate-300', 'text-orange-600'];

export default function Leaderboard() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          center
          tag="🏆 رقابت"
          title="جدول امتیازات"
          subtitle="بهترین بازیکنان این هفته"
        />

        {/* سه نفر برتر */}
        <div className="mb-10 grid grid-cols-3 gap-3 sm:gap-6">
          {leaderboardData.slice(0, 3).map((player, i) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'glass-glow rounded-2xl p-4 text-center sm:p-6',
                i === 0 && 'border-amber-400/40 bg-amber-400/10',
                i === 1 && 'border-slate-400/30 bg-slate-400/5',
                i === 2 && 'border-orange-600/30 bg-orange-600/5'
              )}
            >
              <div className="text-4xl sm:text-5xl">{player.avatar}</div>
              <p className={cn('mt-2 font-display text-xl font-bold', medalColors[i])}>
                #{player.rank}
              </p>
              <p className="mt-1 font-display text-sm font-bold text-white">{player.name}</p>
              <p className="text-xs text-slate-400">{player.score.toLocaleString()} امتیاز</p>
            </motion.div>
          ))}
        </div>

        {/* لیست کامل */}
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">رتبه</th>
                <th className="px-4 py-3">بازیکن</th>
                <th className="px-4 py-3">بازی</th>
                <th className="px-4 py-3 text-right">امتیاز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboardData.map((player, i) => (
                <motion.tr
                  key={player.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <span className={cn('font-display font-bold', i < 3 && medalColors[i])}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${player.rank}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{player.avatar}</span>
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <p className="text-xs text-slate-500">سطح {player.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{player.game}</td>
                  <td className="px-4 py-3 text-right font-display font-bold text-cyan-300">
                    {player.score.toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}