import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, ChevronDown, ListMusic } from 'lucide-react';
import { cn } from '../../utils/cn';

/* 🎵 لیست آهنگ‌های پیش‌فرض */
const TRACKS = [
  { id: 1, title: 'Cyber Dreams', artist: 'NexusArena', src: '/audio/track1.mp3', cover: '🎧', accent: 'from-cyan-400 to-blue-500' },
  { id: 2, title: 'Neon Nights', artist: 'MafiaGANG', src: '/audio/track2.mp3', cover: '🌃', accent: 'from-fuchsia-500 to-purple-600' },
  { id: 3, title: 'Arena Battle Theme', artist: 'NexusArena', src: '/audio/track3.mp3', cover: '⚔️', accent: 'from-rose-500 to-red-600' },
  { id: 4, title: 'Midnight Lobby', artist: 'NexusArena', src: '/audio/track4.mp3', cover: '🌙', accent: 'from-emerald-400 to-teal-500' },
];

/* ─────────── MusicPlayer — NEXUS UI v6 ───────────
   - هماهنگ با سیستم اخطار (nexus-music-pause / resume)
   - ✅ window.__NEXUS_MUSIC_PLAYING__ (نام صحیح)
─────────────────────────────────────────────── */
export default function MusicPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showList, setShowList] = useState(false);
  const [visualBars, setVisualBars] = useState(Array(20).fill(0));
  const track = TRACKS[currentTrack];

  /* 🌐 اعلام وضعیت پخش به سیستم اخطار (هر دو نام برای سازگاری) */
  useEffect(() => {
    window.__NEXUS_MUSIC_PLAYING__ = isPlaying;
    window.NEXUS_MUSIC_PLAYING = isPlaying;
  }, [isPlaying]);

  /* 🎛 کنترل از بیرون (توقف/ادامه توسط سیستم اخطار) */
  useEffect(() => {
    const pause = () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    };
    const resume = () => {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    };
    window.addEventListener('nexus-music-pause', pause);
    window.addEventListener('nexus-music-resume', resume);
    return () => {
      window.removeEventListener('nexus-music-pause', pause);
      window.removeEventListener('nexus-music-resume', resume);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) audio.pause();
      else await audio.play();
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('Audio error:', err);
    }
  };

  const nextTrack = () => setCurrentTrack((c) => (c + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrack((c) => (c - 1 + TRACKS.length) % TRACKS.length);
  const toggleMute = () => setIsMuted((m) => !m);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const onEnd = () => nextTrack();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [currentTrack]);

  /* ویژوالایزر شبیه‌سازی‌شده */
  useEffect(() => {
    if (!isPlaying) {
      setVisualBars(Array(20).fill(0));
      return;
    }
    const interval = setInterval(() => {
      setVisualBars(Array.from({ length: 20 }, () => Math.random() * 100));
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  /* تعویض ترک حین پخش */
  useEffect(() => {
    if (isPlaying && audioRef.current) audioRef.current.play().catch(() => {});
    // eslint-disable-next-line
  }, [currentTrack]);

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const seekTo = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  };

  const pctWidth = duration ? (progress / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} src={track.src} preload="metadata" />

      {/* 🎧 گوشه پایین-راست (بدون تداخل با دکمه بازگشت‌به‌بالای Footer) */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-4 right-4 z-40"
      >
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="glass-strong mb-3 w-80 overflow-hidden rounded-3xl p-4"
            >
              {/* خط نئونی بالای پنل */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

              {/* هدر */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-400/10">
                    <Music size={13} className="text-cyan-300" />
                  </span>
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-white">
                    Music Player
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="grid h-6 w-6 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* کاور + ویژوالایزر */}
              <div className="mt-4 flex items-center gap-4">
                <div className="relative shrink-0">
                  <motion.span
                    animate={isPlaying ? { rotate: 360 } : {}}
                    transition={{ duration: 6, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
                    className="absolute -inset-1.5 rounded-2xl border border-dashed border-white/25"
                  />
                  <div className={cn('grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-lg', track.accent)}>
                    {track.cover}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-white">{track.title}</p>
                  <p className="truncate text-xs text-slate-400">{track.artist}</p>
                  <div className="mt-2 flex h-6 items-end gap-0.5">
                    {visualBars.map((h, i) => (
                      <motion.div
                        key={i}
                        className={cn('w-1 rounded-full bg-gradient-to-t drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]', track.accent)}
                        animate={{ height: isPlaying ? `${Math.max(10, h)}%` : '10%' }}
                        transition={{ duration: 0.12 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* نوار پیشرفت نئونی */}
              <div className="mt-3">
                <div onClick={seekTo} className="group relative h-1.5 cursor-pointer rounded-full bg-white/10">
                  <div
                    className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r shadow-[0_0_12px_rgba(34,211,238,0.6)]', track.accent)}
                    style={{ width: `${pctWidth}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-opacity group-hover:opacity-100"
                    style={{ left: `calc(${pctWidth}% - 6px)` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                  <span>{fmt(progress)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* کنترل‌ها */}
              <div className="mt-3 flex items-center justify-center gap-4">
                <button onClick={prevTrack} className="grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white">
                  <SkipBack size={16} />
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className={cn('grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-slate-950 shadow-lg', track.accent)}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </motion.button>
                <button onClick={nextTrack} className="grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white">
                  <SkipForward size={16} />
                </button>
              </div>

              {/* ولوم + لیست */}
              <div className="mt-3 flex items-center gap-2">
                <button onClick={toggleMute} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="flex-1 accent-cyan-400"
                />
                <button
                  onClick={() => setShowList((v) => !v)}
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-full transition',
                    showList ? 'bg-cyan-400/20 text-cyan-300' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <ListMusic size={13} />
                </button>
              </div>

              {/* پلی‌لیست */}
              <AnimatePresence>
                {showList && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="chat-scroll mt-3 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-1"
                  >
                    {TRACKS.map((t, i) => (
                      <button
                        key={t.id}
                        onClick={() => setCurrentTrack(i)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right transition',
                          i === currentTrack ? 'border border-cyan-400/30 bg-cyan-400/10' : 'hover:bg-white/5'
                        )}
                      >
                        <span className="text-lg">{t.cover}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-white">{t.title}</p>
                          <p className="truncate text-[10px] text-slate-500">{t.artist}</p>
                        </div>
                        {i === currentTrack && isPlaying && (
                          <span className="flex items-end gap-0.5">
                            {[1, 2, 3].map((b) => (
                              <motion.span
                                key={b}
                                animate={{ height: ['4px', '12px', '4px'] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }}
                                className="w-0.5 rounded-full bg-cyan-400"
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* دکمه اصلی شناور */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'group relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.5)]',
            track.accent
          )}
        >
          <motion.div
            animate={isPlaying ? { rotate: 360 } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-1 rounded-2xl border-2 border-dashed border-white/30"
          />
          {isPlaying ? (
            <div className="flex items-end gap-0.5">
              {[1, 2, 3].map((b) => (
                <motion.span
                  key={b}
                  animate={{ height: ['6px', '18px', '6px'] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: b * 0.2 }}
                  className="w-1 rounded-full bg-white"
                />
              ))}
            </div>
          ) : (
            <Music size={22} />
          )}
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-slate-950/95 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {isPlaying ? track.title : 'Play Music'}
          </span>
        </motion.button>
      </motion.div>
    </>
  );
}