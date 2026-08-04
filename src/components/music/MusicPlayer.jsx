import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { tracks } from '../../data/tracks';
import { formatTime } from '../../utils/format';
import { cn } from '../../utils/cn';

/* ---------- tiny animated equalizer ---------- */
function Equalizer({ playing, className }) {
  const heights = [0.9, 0.5, 1, 0.65, 0.8];
  return (
    <div className={cn('flex h-4 items-end gap-[3px]', className)}>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-500"
          style={{ height: '100%', transformOrigin: 'bottom' }}
          animate={playing ? { scaleY: [0.3, h, 0.45, h, 0.3] } : { scaleY: 0.2 }}
          transition={
            playing
              ? { duration: 0.9 + i * 0.12, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

/* ---------- icons ---------- */
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l11-6.86a1.05 1.05 0 0 0 0-1.8l-11-6.86A1.05 1.05 0 0 0 8 5.14Z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);
const PrevIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="5" width="2.5" height="14" rx="1" />
    <path d="M19 6.3v11.4c0 .83-.92 1.32-1.6.86l-8.2-5.7a1.05 1.05 0 0 1 0-1.72l8.2-5.7c.68-.46 1.6.03 1.6.86Z" />
  </svg>
);
const NextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="16.5" y="5" width="2.5" height="14" rx="1" />
    <path d="M5 6.3v11.4c0 .83.92 1.32 1.6.86l8.2-5.7a1.05 1.05 0 0 0 0-1.72l-8.2-5.7C5.92 5 5 5.47 5 6.3Z" />
  </svg>
);

export default function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const audioRef = useRef(null);

  const track = tracks[index];
  const hasAudio = Boolean(track?.src);

  const goTo = (i) => {
    setIndex(((i % tracks.length) + tracks.length) % tracks.length);
    setProgress(0);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  /* simulated playback when the track has no real audio file */
  useEffect(() => {
    if (!playing || hasAudio) return undefined;
    const id = setInterval(() => {
      setProgress((p) => Math.min(p + 1, track.duration));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, hasAudio, track]);

  /* auto-advance when track ends */
  useEffect(() => {
    if (playing && progress >= track.duration) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, playing]);

  /* real <audio> control when a src is provided */
  useEffect(() => {
    const el = audioRef.current;
    if (!hasAudio || !el) return;
    el.volume = volume;
    if (playing) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, hasAudio, volume, index]);

  const selectTrack = (i) => {
    if (i === index) {
      setPlaying((p) => !p);
      return;
    }
    goTo(i);
    setPlaying(true);
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const t = ratio * track.duration;
    setProgress(t);
    if (hasAudio && audioRef.current) audioRef.current.currentTime = t;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* ---------- expanded panel ---------- */}
      <AnimatePresence>
        {open && (
          <motion.section
            key="player-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="glass-strong w-[21rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                Now Playing
              </p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Collapse player"
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                ▾
              </button>
            </div>

            <div className="flex gap-3 p-4">
              <div
                className={cn(
                  'grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-3xl shadow-lg',
                  track.gradient
                )}
              >
                <motion.span
                  animate={playing ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
                  transition={playing ? { duration: 2, repeat: Infinity } : {}}
                >
                  {track.icon}
                </motion.span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-white">{track.title}</p>
                <p className="truncate text-xs text-slate-400">{track.artist}</p>
                <div className="mt-2">
                  <Equalizer playing={playing} />
                </div>
              </div>
            </div>

            {/* progress */}
            <div className="px-4">
              <div onClick={seek} className="group h-2 cursor-pointer rounded-full bg-white/10">
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                  style={{ width: `${(progress / track.duration) * 100}%` }}
                >
                  <span className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover:opacity-100" />
                </div>
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(track.duration)}</span>
              </div>
            </div>

            {/* controls */}
            <div className="flex items-center justify-center gap-6 pb-2 pt-1">
              <button onClick={prev} aria-label="Previous track" className="text-slate-300 transition hover:scale-110 hover:text-cyan-300">
                <PrevIcon />
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Pause' : 'Play'}
                className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.5)]"
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </motion.button>
              <button onClick={next} aria-label="Next track" className="text-slate-300 transition hover:scale-110 hover:text-cyan-300">
                <NextIcon />
              </button>
            </div>

            {/* volume */}
            <div className="flex items-center gap-3 px-4 pb-3">
              <span className="text-xs">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
                className="h-1 flex-1 cursor-pointer"
              />
            </div>

            {/* playlist */}
            <div className="chat-scroll max-h-44 overflow-y-auto border-t border-white/10 p-2">
              {tracks.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => selectTrack(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                    i === index ? 'border border-cyan-400/30 bg-cyan-400/10' : 'border border-transparent hover:bg-white/5'
                  )}
                >
                  <span className={cn('grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br text-sm', t.gradient)}>
                    {t.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-xs font-semibold', i === index ? 'text-cyan-300' : 'text-slate-200')}>
                      {t.title}
                    </span>
                    <span className="block truncate text-[10px] text-slate-500">{t.artist}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{formatTime(t.duration)}</span>
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---------- floating toggle button ---------- */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle music player"
        className="glass-strong relative grid h-14 w-14 place-items-center rounded-full shadow-[0_0_30px_rgba(34,211,238,0.35)]"
      >
        {playing && <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-cyan-400/40" />}
        <motion.span
          animate={playing ? { rotate: 360 } : { rotate: 0 }}
          transition={playing ? { duration: 6, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
          className={cn('grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-lg', track.gradient)}
        >
          {track.icon}
        </motion.span>
      </motion.button>

      {/* hidden real-audio element (used only when tracks have a src) */}
      {hasAudio && (
        <audio
          ref={audioRef}
          src={track.src}
          onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
          onEnded={next}
          preload="metadata"
        />
      )}
    </div>
  );
}