import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import NeonButton from '../ui/NeonButton';
import { formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const statusColors = { LIVE: 'green', BETA: 'cyan', SOON: 'amber' };

export default function GameCard({ game, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.1 }}
      whileHover={{ y: -8 }}
      className="glass group relative overflow-hidden rounded-2xl"
    >
      <div className={cn('relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br', game.gradient)}>
        <span className="text-7xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125">{game.icon}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050e]/80 via-transparent to-transparent" />
        <div className="absolute right-3 top-3">
          <Badge color={statusColors[game.status]}>{game.status}</Badge>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_45%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-cyan-300">
            {game.title}
          </h3>
          <p className="text-sm text-slate-400">{game.genre}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-amber-300">★ {game.rating}</span>
          <span>👥 {formatNumber(game.players)} players</span>
        </div>
        <div className="flex gap-2">
          <NeonButton size="sm" className="flex-1">Play Now</NeonButton>
          <NeonButton size="sm" variant="ghost">Info</NeonButton>
        </div>
      </div>
    </motion.article>
  );
}