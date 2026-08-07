import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import Badge from '../components/ui/Badge';
import NeonButton from '../components/ui/NeonButton';
import { games } from '../data/games';
import { cn } from '../utils/cn';

const genres = ['همه', 'شوتر', 'مسابقه‌ای', 'نقش‌آفرینی', 'استراتژی', 'مخفی‌کاری'];

const statusColors = {
  'زنده': 'green',
  'بتا': 'cyan',
  'به‌زودی': 'amber',
};

export default function Games() {
  const [selectedGenre, setSelectedGenre] = useState('همه');

  const filteredGames =
    selectedGenre === 'همه'
      ? games
      : games.filter((g) => g.genre === selectedGenre);

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          center
          tag="🎮 کتابخانه"
          title="همه‌ی بازی‌ها"
          subtitle="مجموعه‌ی کامل بازی‌های AAA با گرافیک نسل جدید"
        />

        {/* فیلتر ژانرها */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={cn(
                'glass rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all duration-300',
                selectedGenre === genre
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                  : 'text-slate-400 hover:border-white/20 hover:text-white'
              )}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* تعداد نتایج */}
        <p className="mb-6 text-center text-sm text-slate-400">
          {filteredGames.length} بازی یافت شد
        </p>

        {/* گرید بازی‌ها */}
        <AnimatePresence mode="wait">
          {filteredGames.length > 0 ? (
            <motion.div
              key={selectedGenre}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredGames.map((game, i) => (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass group overflow-hidden rounded-2xl transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                >
                  <div className={cn('relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br', game.gradient)}>
                    <span className="text-6xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125">
                      {game.icon}
                    </span>
                    <div className="absolute right-3 top-3">
                      <Badge color={statusColors[game.status] || 'slate'}>{game.status}</Badge>
                    </div>
                    {/* افکت shine روی hover */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_45%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-cyan-300">
                          {game.title}
                        </h3>
                        <p className="text-xs text-slate-400">{game.genre}</p>
                      </div>
                      <span className="flex items-center gap-1 text-sm text-amber-400">★ {game.rating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        👥 {(game.players / 1000).toFixed(0)}K بازیکن
                      </span>
                      <NeonButton size="sm">نصب بازی</NeonButton>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <span className="text-6xl">🎮</span>
              <h3 className="mt-4 font-display text-xl font-bold text-white">بازی یافت نشد</h3>
              <p className="mt-2 text-slate-400">در این دسته‌بندی هنوز بازی‌ای اضافه نشده است</p>
              <NeonButton className="mt-6" onClick={() => setSelectedGenre('همه')}>
                نمایش همه‌ی بازی‌ها
              </NeonButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}