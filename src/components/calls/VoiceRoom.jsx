import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ─────────── VoiceRoom — اتاق صدا با Jitsi ───────────
   بدون کارت بانکی، بدون TURN — سرورهای Jitsi خودش NAT را حل می‌کند
   → روی دیتای موبایل هم صدا برقرار است
─────────────────────────────────────────────────────── */
export default function VoiceRoom() {
  const { profile } = useAuth();
  const [room, setRoom] = useState(null); // {room, title}

  useEffect(() => {
    const onOpen = (e) => {
      const { room, title } = e.detail || {};
      if (room) setRoom({ room: String(room).replace(/[^a-zA-Z0-9-]/g, ''), title: title || 'اتاق صدا' });
    };
    window.addEventListener('nx-voice-room', onOpen);
    return () => window.removeEventListener('nx-voice-room', onOpen);
  }, []);

  const name = (profile?.username || 'کاربر آرنا').replace(/"/g, '');

  return (
    <AnimatePresence>
      {room && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[17000] flex flex-col bg-[#070b18]"
        >
          {/* نوار بالا */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#070b18]/95 px-4 py-3">
            <p className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
              <Headphones size={14} /> {room.title}
            </p>
            <button
              onClick={() => setRoom(null)}
              className={cn('grid h-9 w-9 place-items-center border border-red-400/40 bg-red-400/10 text-red-400 transition hover:bg-red-400/20', CLIP_SM)}
              title="خروج از اتاق"
            >
              <X size={16} />
            </button>
          </div>

          {/* اتاق Jitsi */}
          <iframe
            src={`https://meet.jit.si/${room.room}#userInfo.displayName="${name}"&config.prejoinConfig.enabled=false&config.disableDeepLinking=true&config.startWithAudioMuted=false`}
            className="w-full flex-1"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            allowFullScreen
            title={room.title}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}