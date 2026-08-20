import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, PhoneIncoming } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function freshChannel(topic) {
  const existing = supabase.getChannels().find((c) => c.topic === 'realtime:' + topic);
  if (existing) supabase.removeChannel(existing);
  return supabase.channel(topic);
}

/* ─────────── PrivateCallOverlay — تماس صوتی ۱به۱ (WebRTC) ─────────── */
export default function PrivateCallOverlay() {
  const { user, profile } = useAuth();
  const [call, setCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState('');
  const callRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const sessionRef = useRef(null);
  const audioRef = useRef(null);
  callRef.current = call;

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3000); };

  useEffect(() => {
    if (call?.status !== 'active') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [call?.status]);

  /* ✅ ارسال به همان کانالی که گیرنده گوش می‌دهد + فقط بعد از SUBSCRIBED */
  const ping = (topic, payload) => {
    try {
      const dup = supabase.getChannels().find((c) => c.topic === 'realtime:' + topic);
      if (dup) supabase.removeChannel(dup);
      const ch = supabase.channel(topic);
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          ch.send({ type: 'broadcast', event: 'msg', payload });
          setTimeout(() => supabase.removeChannel(ch), 600);
        }
      });
    } catch (e) {
      console.error('❌ ping:', e);
    }
  };

  const cleanup = () => {
    try { localRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try { pcRef.current?.close(); } catch {}
    try { sessionRef.current && supabase.removeChannel(sessionRef.current); } catch {}
    localRef.current = null;
    pcRef.current = null;
    sessionRef.current = null;
    setMuted(false);
    setSeconds(0);
    setCall(null);
  };

  const endCall = () => {
    const c = callRef.current;
    if (c) {
      ping('nx-call-' + c.peerId, { type: 'end', callId: c.callId });
      try { sessionRef.current?.send({ type: 'broadcast', event: 'msg', payload: { type: 'end', callId: c.callId } }); } catch {}
    }
    cleanup();
  };

  const ensurePC = async (asCaller, ch) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    localRef.current = stream;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    stream.getAudioTracks().forEach((tr) => pc.addTrack(tr, stream));
    pc.ontrack = (e) => { if (audioRef.current) audioRef.current.srcObject = e.streams[0]; };
    pc.onicecandidate = (e) => {
      if (e.candidate) ch.send({ type: 'broadcast', event: 'msg', payload: { type: 'ice', candidate: e.candidate } });
    };
    if (asCaller) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ch.send({ type: 'broadcast', event: 'msg', payload: { type: 'offer', sdp: offer } });
    }
  };

  const openSession = (callId, asCaller) => {
    const ch = freshChannel('nx-session-' + callId);
    sessionRef.current = ch;
    ch.on('broadcast', { event: 'msg' }, async ({ payload }) => {
      try {
        if (payload.type === 'offer') {
          await ensurePC(false, ch);
          await pcRef.current.setRemoteDescription(payload.sdp);
          const ans = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(ans);
          ch.send({ type: 'broadcast', event: 'msg', payload: { type: 'answer', sdp: ans } });
        }
        if (payload.type === 'answer' && pcRef.current) {
          await pcRef.current.setRemoteDescription(payload.sdp);
        }
        if (payload.type === 'ice' && pcRef.current) {
          try { await pcRef.current.addIceCandidate(payload.candidate); } catch {}
        }
        if (payload.type === 'end') cleanup();
      } catch (e) { console.error('❌ RTC:', e); }
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED' && asCaller) ensurePC(true, ch);
    });
  };

  /* 📥 صندوق دریافت */
  useEffect(() => {
    if (!user?.id) return;
    const ch = freshChannel('nx-call-' + user.id);
    ch.on('broadcast', { event: 'msg' }, async ({ payload }) => {
      const c = callRef.current;
      if (payload.type === 'invite') {
        if (c) return ping('nx-call-' + payload.from, { type: 'busy', callId: payload.callId });
        setCall({ role: 'callee', peerId: payload.from, peerName: payload.fromName, callId: payload.callId, status: 'incoming' });
        try {
          const a = new Audio('/audio/notification.mp3');
          a.loop = true;
          a.play().catch(() => {});
          window.__nxRing = a;
        } catch {}
      }
      if (payload.type === 'accept' && c?.role === 'caller' && payload.callId === c.callId) {
        try { window.__nxRing?.pause(); } catch {}
        setCall({ ...c, status: 'active' });
        openSession(c.callId, true);
      }
      if ((payload.type === 'reject' || payload.type === 'busy') && c?.role === 'caller' && payload.callId === c.callId) {
        flash(payload.type === 'busy' ? '❌ طرف مقابل در تماس دیگری است' : '❌ تماس رد شد');
        cleanup();
      }
      if (payload.type === 'end' && c && payload.callId === c.callId) cleanup();
    }).subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line
  }, [user?.id]);

  /* 📤 شروع تماس از دکمه چت */
  useEffect(() => {
    const onStart = (e) => {
      const { friendId, friendName } = e.detail || {};
      if (!friendId || !user?.id || callRef.current) return;
      const callId = (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()));
      setCall({ role: 'caller', peerId: friendId, peerName: friendName || 'کاربر', callId, status: 'outgoing' });
      ping('nx-call-' + friendId, { type: 'invite', callId, from: user.id, fromName: profile?.username || 'کاربر' });
      setTimeout(() => {
        setCall((cur) => {
          if (cur && cur.callId === callId && cur.status === 'outgoing') {
            flash('❌ پاسخی دریافت نشد');
            cleanup();
            return null;
          }
          return cur;
        });
      }, 30000);
    };
    window.addEventListener('nx-start-call', onStart);
    return () => window.removeEventListener('nx-start-call', onStart);
    // eslint-disable-next-line
  }, [user?.id, profile?.username]);

  const accept = async () => {
    const c = callRef.current;
    if (!c) return;
    try { window.__nxRing?.pause(); } catch {}
    setCall({ ...c, status: 'active' });
    ping('nx-call-' + c.peerId, { type: 'accept', callId: c.callId });
    openSession(c.callId, false);
  };

  const reject = async () => {
    const c = callRef.current;
    if (!c) return;
    try { window.__nxRing?.pause(); } catch {}
    ping('nx-call-' + c.peerId, { type: 'reject', callId: c.callId });
    cleanup();
  };

  const toggleMute = () => {
    const tr = localRef.current?.getAudioTracks?.()[0];
    if (tr) tr.enabled = !tr.enabled;
    setMuted((m) => !m);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      <audio ref={audioRef} autoPlay playsInline />
      <AnimatePresence>
        {call && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[16000] grid place-items-center bg-black/70 backdrop-blur-[4px] px-4"
          >
            <style>{`@keyframes pcoBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }`}</style>
            <motion.div
              initial={{ opacity: 0, rotateX: -70, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
              className={cn('relative w-full max-w-sm border border-emerald-400/40 bg-[#070b18]/95 p-6 text-center shadow-[0_0_70px_rgba(52,211,153,0.3)] backdrop-blur-2xl', CLIP)}
            >
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-emerald-400/60" />
              <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />

              {notice && <p className="mb-3 text-xs font-bold text-red-400">{notice}</p>}

              <div className="relative mx-auto w-fit">
                <span className="absolute inset-0 rounded-xl bg-emerald-400/25 blur-[12px]" />
                <div className={cn('relative grid h-20 w-20 place-items-center bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-black text-slate-950', CLIP_SM)}>
                  {(call.peerName || '?').slice(0, 2).toUpperCase()}
                </div>
              </div>
              <p className="mt-3 font-display text-lg font-black text-white">{call.peerName}</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-xs text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'pcoBlink 1.2s infinite' }} />
                {call.status === 'incoming' && <><PhoneIncoming size={12} /> تماس صوتی ورودی...</>}
                {call.status === 'outgoing' && 'در حال تماس...'}
                {call.status === 'active' && `در حال گفتگو • ${fmt(seconds)}`}
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                {call.status === 'incoming' ? (
                  <>
                    <button onClick={reject} className={cn('grid h-12 w-12 place-items-center border border-red-400/40 bg-red-400/15 text-red-400 transition hover:bg-red-400/25', CLIP_SM)} title="رد">
                      <PhoneOff size={18} />
                    </button>
                    <button onClick={accept} className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.5)] transition hover:shadow-[0_0_38px_rgba(52,211,153,0.7)]', CLIP_SM)} title="پذیرش">
                      📞
                    </button>
                  </>
                ) : (
                  <>
                    {call.status === 'active' && (
                      <button onClick={toggleMute} className={cn('grid h-12 w-12 place-items-center border text-slate-200 transition', CLIP_SM, muted ? 'border-red-400/50 bg-red-400/15 text-red-400' : 'border-white/10 bg-white/5 hover:bg-white/10')} title="بی‌صدا">
                        {muted ? <MicOff size={17} /> : <Mic size={17} />}
                      </button>
                    )}
                    <button onClick={endCall} className={cn('grid h-12 w-12 place-items-center border border-red-400/40 bg-red-400/15 text-red-400 transition hover:bg-red-400/25', CLIP_SM)} title="پایان تماس">
                      <PhoneOff size={18} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}