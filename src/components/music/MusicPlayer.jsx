import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, ChevronDown, ListMusic } from 'lucide-react';
import { cn } from '../../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* 🎵 لیست آهنگ‌های پیش‌فرض (می‌تونی تغییر بدی) */
const TRACKS = [
  { id: 1, title: 'Cyber Dreams', artist: 'NexusArena', src: '/audio/track1.mp3', cover: '🎧', accent: 'from-cyan-400 to-blue-500' },
  { id: 2, title: 'Neon Nights', artist: 'MafiaGANG', src: '/audio/track2.mp3', cover: '🌃', accent: 'from-fuchsia-500 to-purple-600' },
  { id: 3, title: 'Arena Battle Theme', artist: 'NexusArena', src: '/audio/track3.mp3', cover: '⚔️', accent: 'from-rose-500 to-red-600' },
  { id: 4, title: 'Midnight Lobby', artist: 'NexusArena', src: '/audio/track4.mp3', cover: '🌙', accent: 'from-emerald-400 to-teal-500' },
];

/* ─────────── MusicPlayer v7 — AUDIO DECK ─────────── */
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
  const [visualBars, setVisualBars] = useState(Array(24).fill(8));
  const track = TRACKS[currentTrack];

  /* 🌐 اعلام وضعیت پخش به سیستم اخطار */
  useEffect(() => {
    window.NEXUS_MUSIC_PLAYING = isPlaying;
  }, [isPlaying]);

  /* کنترل از بیرون (توقف/ادامه توسط سیستم اخطار) */
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
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
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
      setVisualBars(Array(24).fill(8));
      return;
    }
    const interval = setInterval(() => {
      setVisualBars(Array.from({ length: 24 }, () => 10 + Math.random() * 90));
    }, 110);
    return () => clearInterval(interval);
  }, [isPlaying]);

  /* وقتی آهنگ عوض شد، اگه در حال پخش بودیم پلی بشه */
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
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

  return (
    <>
      <style>{`
        @keyframes mpSpin { to { transform: rotate(360deg); } }
        @keyframes mpBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes mpScan { 0% { top: -10%; } 100% { top: 110%; } }
      `}</style>
      <audio ref={audioRef} src={track.src} preload="metadata" />

      {/* دکمه شناور — گوشه پایین چپ */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-4 left-4 z-40"
      >
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.92, rotateX: -12 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 24, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ transformPerspective: 1000, transformOrigin: 'bottom center' }}
              className={cn('relative mb-3 w-[22rem] border border-cyan-400/40 bg-[#070b18]/95 p-4 shadow-[0_0_60px_rgba(34,211,238,0.35)] backdrop-blur-2xl', CLIP)}
            >
              {/* خط اسکن + براکت‌ها */}
              <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" style={{ animation: 'mpScan 4s linear infinite' }} />
              <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-cyan-400/60" />
              <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-fuchsia-400/60" />

              {/* هدر HUD */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.3em] text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'mpBlink 1.4s infinite' }} />
                  Audio Deck // {isPlaying ? 'Playing' : 'Idle'}
                </span>
                <button
                  onClick={() => setExpanded(false)}
                  className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* کاور + ویژوالایزر */}
              <div className="mt-4 flex items-center gap-4">
                <div className="relative shrink-0">
                  <span className={cn('absolute inset-0 rounded-xl bg-gradient-to-br opacity-60 blur-[12px]', track.accent)} />
                  <motion.div
                    animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 6, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
                    className={cn('relative grid h-16 w-16 place-items-center bg-gradient-to-br text-3xl shadow-lg', track.accent, CLIP_SM)}
                  >
                    {track.cover}
                  </motion.div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-white">{track.title}</p>
                  <p className="truncate text-xs text-slate-400">{track.artist}</p>
                  {/* ویژوالایزر ۲۴ میله‌ای */}
                  <div className="mt-2 flex h-7 items-end gap-[3px]">
                    {visualBars.map((h, i) => (
                      <motion.div
                        key={i}
                        className={cn('w-[3px] rounded-full bg-gradient-to-t', track.accent)}
                        style={{ boxShadow: '0 0 6px rgba(34,211,238,0.4)' }}
                        animate={{ height: `${isPlaying ? Math.max(10, h) : 10}%` }}
                        transition={{ duration: 0.11 }}
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
                    style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-opacity group-hover:opacity-100"
                    style={{ left: `calc(${duration ? (progress / duration) * 100 : 0}% - 6px)` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                  <span>{fmt(progress)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* کنترل‌ها */}
              <div className="mt-2 flex items-center justify-center gap-4">
                <button
                  onClick={prevTrack}
                  className={cn('grid h-9 w-9 place-items-center border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300', CLIP_SM)}
                >
                  <SkipBack size={15} />
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all hover:shadow-[0_0_38px_rgba(34,211,238,0.7)]', track.accent, CLIP_SM)}
                >
                  {isPlaying ? <Pause size={19} /> : <Play size={19} className="ml-0.5" />}
                </motion.button>
                <button
                  onClick={nextTrack}
                  className={cn('grid h-9 w-9 place-items-center border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300', CLIP_SM)}
                >
                  <SkipForward size={15} />
                </button>
              </div>

              {/* ولوم + لیست */}
              <div className="mt-3 flex items-center gap-2">
                <button onClick={toggleMute} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white">
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
                  className={cn('grid h-7 w-7 place-items-center rounded-md transition', showList ? 'bg-cyan-400/20 text-cyan-300' : 'text-slate-400 hover:bg-white/10 hover:text-white')}
                >
                  <ListMusic size={13} />
                </button>
              </div>

              {/* پلی‌لیست هولولوگرافیک */}
              <AnimatePresence>
                {showList && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="chat-scroll mt-3 max-h-44 overflow-y-auto"
                  >
                    {TRACKS.map((t, i) => (
                      <button
                        key={t.id}
                        onClick={() => setCurrentTrack(i)}
                        className={cn(
                          'mb-1.5 flex w-full items-center gap-3 border p-2.5 text-right transition',
                          CLIP_SM,
                          i === currentTrack ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-white/5 bg-white/5 hover:bg-white/10'
                        )}
                      >
                        <span className={cn('grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br text-base', t.accent, CLIP_SM)}>{t.cover}</span>
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

        {/* دکمه اصلی شناور — زاویه‌دار با حلقه کانیک */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpanded((v) => !v)}
          className={cn('group relative grid h-14 w-14 place-items-center bg-gradient-to-br text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.5)]', track.accent, CLIP_SM)}
        >
          {/* حلقه کانیک چرخان دور دکمه */}
          <span
            className="pointer-events-none absolute -inset-2 rounded-full opacity-70"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,.6) 60deg, transparent 120deg, transparent 180deg, rgba(232,121,249,.6) 240deg, transparent 300deg)',
              maskImage: 'radial-gradient(circle, transparent 55%, black 58%, black 70%, transparent 73%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 55%, black 58%, black 70%, transparent 73%)',
              animation: isPlaying ? 'mpSpin 4s linear infinite' : 'mpSpin 10s linear infinite',
            }}
          />
          {isPlaying ? (
            <span className="flex items-end gap-0.5">
              {[1, 2, 3].map((b) => (
                <motion.span
                  key={b}
                  animate={{ height: ['6px', '18px', '6px'] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: b * 0.2 }}
                  className="w-1 rounded-full bg-white"
                />
              ))}
            </span>
          ) : (
            <Music size={22} />
          )}
          {/* tooltip */}
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-950/95 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {isPlaying ? track.title : 'Play Music'}
          </span>
        </motion.button>
      </motion.div>
    </>
  );
}