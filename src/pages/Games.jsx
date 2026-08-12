import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Download, Gamepad2 } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { games } from '../data/games';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const genres = ['همه', 'شوتر', 'مسابقه‌ای', 'نقش‌آفرینی', 'استراتژی', 'مخفی‌کاری'];
const statusColors = {
  'زنده': 'green',
  'بتا': 'cyan',
  'به‌زودی': 'amber',
};

/* ─────────── Games v7 — GAME VAULT ─────────── */
export default function Games() {
  const [selectedGenre, setSelectedGenre] = useState('همه');
  const filteredGames =
    selectedGenre === 'همه' ? games : games.filter((g) => g.genre === selectedGenre);

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
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Library // Nexus Vault
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            GAME <span className="text-gradient">VAULT</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500">مجموعه‌ی کامل بازی‌های AAA با گرافیک نسل جدید</p>
        </div>

        {/* فیلتر ژانرها — زاویه‌دار */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={cn(
                'border px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all',
                CLIP_SM,
                selectedGenre === genre
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
              )}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* تعداد نتایج */}
        <p className="mb-8 text-center">
          <span className={cn('inline-block border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-400', CLIP_SM)}>
            {filteredGames.length} بازی یافت شد
          </span>
        </p>

        {/* ─────────── گرید بازی‌ها ─────────── */}
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
                  whileHover={{ y: -6 }}
                  className={cn('group relative border border-white/10 bg-[#070b18]/80 backdrop-blur-xl transition-colors hover:border-cyan-400/40 hover:shadow-[0_0_35px_rgba(34,211,238,0.2)]', CLIP)}
                >
                  {/* براکت‌های گوشه */}
                  <span className="pointer-events-none absolute left-2 top-2 z-10 h-4 w-4 border-l-2 border-t-2 border-cyan-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-2 right-2 z-10 h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/40 opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className={cn('relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br', game.gradient)}>
                    <span className="text-6xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125">
                      {game.icon}
                    </span>
                    <div className="absolute right-3 top-3">
                      <Badge color={statusColors[game.status] || 'cyan'}>{game.status}</Badge>
                    </div>
                    {/* اسکن‌لاین + shine در هاور */}
                    <div className="scanlines absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08]" />
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
                      <span className="flex items-center gap-1 text-sm text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                        <Star size={13} /> {game.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Users size={13} className="text-cyan-400/70" />
                        {(game.players / 1000).toFixed(0)}K بازیکن
                      </span>
                      <button className={cn('flex items-center gap-1.5 border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]', CLIP_SM)}>
                        <Download size={13} /> نصب بازی
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn('flex flex-col items-center justify-center border border-white/10 bg-[#070b18]/80 py-20 text-center backdrop-blur-xl', CLIP)}
            >
              <Gamepad2 className="h-14 w-14 text-slate-600" />
              <h3 className="mt-4 font-display text-xl font-bold text-white">بازی یافت نشد</h3>
              <p className="mt-2 text-slate-400">در این دسته‌بندی هنوز بازی‌ای اضافه نشده است</p>
              <button
                onClick={() => setSelectedGenre('همه')}
                className={cn('mt-6 border border-cyan-400/40 bg-cyan-400/10 px-6 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20', CLIP_SM)}
              >
                نمایش همه‌ی بازی‌ها
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}