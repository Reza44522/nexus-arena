import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneIncoming, Minimize2, Maximize2, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* ✅ STUN + TURN (برای عبور از NAT سخت موبایل/اینترنت‌های متفاوت) */
const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 2,
};

const REACTIONS = ['❤️', '🔥', '😂'];

function freshChannel(topic) {
  const existing = supabase.getChannels().find((c) => c.topic === 'realtime:' + topic);
  if (existing) supabase.removeChannel(existing);
  return supabase.channel(topic);
}

/* ─────────── PrivateCallOverlay — تماس صوتی/تصویری پریمیوم ─────────── */
export default function PrivateCallOverlay() {
  const { user, profile } = useAuth();
  const [call, setCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState('');
  const [quality, setQuality] = useState('عالی');
  const [minimized, setMinimized] = useState(false);
  const [bars, setBars] = useState(Array(16).fill(10));
  const [reactions, setReactions] = useState([]);
  const callRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const sessionRef = useRef(null);
  const audioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  callRef.current = call;

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3000); };

  useEffect(() => {
    if (call?.status !== 'active') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [call?.status]);

  /* ویژوالایزر */
  useEffect(() => {
    if (call?.status !== 'active') { setBars(Array(16).fill(10)); return; }
    const iv = setInterval(() => {
      const an = analyserRef.current;
      if (!an) return;
      const data = new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(data);
      setBars(Array.from(data.slice(0, 16)).map((v) => Math.max(8, (v / 255) * 100)));
    }, 110);
    return () => clearInterval(iv);
  }, [call?.status]);

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
    } catch (e) { console.error('❌ ping:', e); }
  };

  const burst = (emoji) => {
    const id = Math.random().toString(36).slice(2);
    setReactions((r) => [...r, { id, emoji, x: Math.random() * 60 - 30 }]);
    setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2400);
  };

  const startVisualizer = (stream) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      src.connect(an);
      analyserRef.current = an;
      audioCtxRef.current = ctx;
    } catch {}
  };

  const cleanup = () => {
    try { localRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try { pcRef.current?.close(); } catch {}
    try { sessionRef.current && supabase.removeChannel(sessionRef.current); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    localRef.current = null; pcRef.current = null; sessionRef.current = null; analyserRef.current = null;
    setMuted(false); setCamOff(false); setSeconds(0); setMinimized(false); setCall(null); setQuality('عالی');
  };

  const endCall = () => {
    const c = callRef.current;
    if (c) {
      ping('nx-call-' + c.peerId, { type: 'end', callId: c.callId });
      try { sessionRef.current?.send({ type: 'broadcast', event: 'msg', payload: { type: 'end', callId: c.callId } }); } catch {}
    }
    cleanup();
  };

  /* ✅ صف candidateها — هیچ بسته ICE گم نمی‌شود */
  const flushCandidates = async (pc) => {
    while (pc.__candQueue?.length) {
      const c = pc.__candQueue.shift();
      try { await pc.addIceCandidate(c); } catch {}
    }
  };

  const ensurePC = async (asCaller, ch) => {
    const wantVideo = !!callRef.current?.video;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: wantVideo });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setCall((c) => (c ? { ...c, video: false } : c));
    }
    localRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    startVisualizer(stream);
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.__candQueue = [];
    pcRef.current = pc;
    stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));
    pc.ontrack = (e) => {
      if (e.streams[0]) {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        if (audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
          audioRef.current.play().catch(() => {}); // ✅ پخش اجباری (گوشی‌ها)
        }
      }
    };
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      console.log('🧊 ICE:', s);
      setQuality(s === 'connected' || s === 'completed' ? 'عالی' : s === 'checking' ? 'متوسط' : 'ضعیف');
    };
    pc.onconnectionstatechange = () => console.log('🔗 PC:', pc.connectionState);
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
          await flushCandidates(pcRef.current);
          const ans = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(ans);
          ch.send({ type: 'broadcast', event: 'msg', payload: { type: 'answer', sdp: ans } });
        }
        if (payload.type === 'answer' && pcRef.current) {
          await pcRef.current.setRemoteDescription(payload.sdp);
          await flushCandidates(pcRef.current);
        }
        if (payload.type === 'ice' && pcRef.current) {
          const pc = pcRef.current;
          if (pc.remoteDescription) { try { await pc.addIceCandidate(payload.candidate); } catch {} }
          else pc.__candQueue.push(payload.candidate); // ✅ در صف بمان
        }
        if (payload.type === 'react') burst(payload.emoji);
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
        setCall({ role: 'callee', peerId: payload.from, peerName: payload.fromName, callId: payload.callId, status: 'incoming', video: !!payload.video });
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

  /* 📤 شروع تماس */
  useEffect(() => {
    const onStart = (e) => {
      const { friendId, friendName, video } = e.detail || {};
      if (!friendId || !user?.id || callRef.current) return;
      const callId = (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()));
      setCall({ role: 'caller', peerId: friendId, peerName: friendName || 'کاربر', callId, status: 'outgoing', video: !!video });
      ping('nx-call-' + friendId, { type: 'invite', callId, from: user.id, fromName: profile?.username || 'کاربر', video: !!video });
      setTimeout(() => {
        setCall((cur) => {
          if (cur && cur.callId === callId && cur.status === 'outgoing') { flash('❌ پاسخی دریافت نشد'); cleanup(); return null; }
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
    try { audioRef.current?.play().catch(() => {}); } catch {} // ✅ آنلاک صدای گوشی
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
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted((m) => !m);
  };
  const toggleCam = () => {
    localRef.current?.getVideoTracks().forEach((t) => (t.enabled = camOff));
    setCamOff((v) => !v);
  };
  const sendReact = (emoji) => {
    burst(emoji);
    try { sessionRef.current?.send({ type: 'broadcast', event: 'msg', payload: { type: 'react', emoji } }); } catch {}
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const QualityIcon = quality === 'عالی' ? SignalHigh : quality === 'متوسط' ? SignalMedium : SignalLow;
  const qualityCls = quality === 'عالی' ? 'text-emerald-300' : quality === 'متوسط' ? 'text-amber-300' : 'text-red-400';
  const ctrlBtn = 'grid h-11 w-11 place-items-center border transition-all ' + CLIP_SM;

  return (
    <>
      <audio ref={audioRef} autoPlay playsInline />
      <video ref={remoteVideoRef} autoPlay playsInline className={cn('hidden', call?.video && call?.status === 'active' && 'block')} />
      <AnimatePresence>
        {call && !minimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[16000] grid place-items-center bg-black/75 backdrop-blur-[5px] px-4"
          >
            <style>{`
              @keyframes pcoBlink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
              @keyframes pcoSpin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="relative w-full max-w-md overflow-hidden p-[1.5px]">
              {call.status === 'active' && (
                <div className="absolute inset-[-200%]" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, #34d399 70deg, transparent 140deg, #22d3ee 220deg, transparent 300deg)', animation: 'pcoSpin 6s linear infinite' }} />
              )}
              <motion.div
                initial={{ opacity: 0, rotateX: -70, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
                className={cn('relative bg-[#070b18]/95 p-6 text-center backdrop-blur-2xl', CLIP, call.status !== 'active' && 'border border-emerald-400/40 shadow-[0_0_70px_rgba(52,211,153,0.3)]')}
              >
                <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-emerald-400/60" />
                <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />

                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <AnimatePresence>
                    {reactions.map((r) => (
                      <motion.span
                        key={r.id}
                        initial={{ y: 40, opacity: 0, x: r.x, scale: 0.6 }}
                        animate={{ y: -220, opacity: [0, 1, 0], scale: 1.3, x: r.x * 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.2, ease: 'easeOut' }}
                        className="absolute bottom-16 left-1/2 text-3xl"
                      >
                        {r.emoji}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>

                {notice && <p className="mb-3 text-xs font-bold text-red-400">{notice}</p>}

                {call.video && call.status === 'active' ? (
                  <div className={cn('relative mx-auto h-56 w-full overflow-hidden border border-emerald-400/30 bg-black/60', CLIP_SM)}>
                    <RemoteVideoView remoteVideoRef={remoteVideoRef} peerName={call.peerName} />
                    <div className={cn('absolute bottom-2 left-2 h-24 w-16 overflow-hidden border border-cyan-400/40 bg-black/80 shadow-lg', CLIP_SM)}>
                      {camOff ? (
                        <div className="grid h-full w-full place-items-center text-2xl">🙈</div>
                      ) : (
                        <LocalVideoView localVideoRef={localVideoRef} />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative mx-auto w-fit">
                    {call.status !== 'active' && (
                      <>
                        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
                        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/10" style={{ animationDelay: '0.4s' }} />
                      </>
                    )}
                    <span className="absolute inset-0 rounded-xl bg-emerald-400/25 blur-[12px]" />
                    <motion.div
                      animate={call.status === 'active' ? { scale: [1, 1.04, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={cn('relative grid h-20 w-20 place-items-center bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-black text-slate-950', CLIP_SM)}
                    >
                      {(call.peerName || '?').slice(0, 2).toUpperCase()}
                    </motion.div>
                  </div>
                )}

                <p className="mt-3 font-display text-lg font-black text-white">{call.peerName}</p>
                <p className="mt-1 flex items-center justify-center gap-2 text-xs text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'pcoBlink 1.2s infinite' }} />
                  {call.status === 'incoming' && <><PhoneIncoming size={12} /> {call.video ? 'تماس تصویری' : 'تماس صوتی'} ورودی...</>}
                  {call.status === 'outgoing' && (call.video ? 'در حال تماس تصویری...' : 'در حال تماس...')}
                  {call.status === 'active' && (
                    <>
                      در حال گفتگو • {fmt(seconds)}
                      <QualityIcon size={13} className={qualityCls} />
                    </>
                  )}
                </p>

                {call.status === 'active' && (
                  <div className="mx-auto mt-3 flex h-8 max-w-[220px] items-end justify-center gap-[3px]">
                    {bars.map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.11 }}
                        className="w-[4px] rounded-full bg-gradient-to-t from-emerald-500 to-cyan-400"
                        style={{ boxShadow: '0 0 6px rgba(52,211,153,0.5)' }}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-center gap-2.5">
                  {call.status === 'incoming' ? (
                    <>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={reject} className={cn(ctrlBtn, 'border-red-400/40 bg-red-400/15 text-red-400 hover:bg-red-400/25')} title="رد">
                        <PhoneOff size={18} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={accept} className={cn('grid h-12 w-12 place-items-center bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.5)]', CLIP_SM)} title="پذیرش">
                        📞
                      </motion.button>
                    </>
                  ) : (
                    <>
                      {call.status === 'active' && (
                        <>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleMute} className={cn(ctrlBtn, muted ? 'border-red-400/50 bg-red-400/15 text-red-400' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10')} title="میکروفون">
                            {muted ? <MicOff size={16} /> : <Mic size={16} />}
                          </motion.button>
                          {call.video && (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleCam} className={cn(ctrlBtn, camOff ? 'border-red-400/50 bg-red-400/15 text-red-400' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10')} title="دوربین">
                              {camOff ? <VideoOff size={16} /> : <Video size={16} />}
                            </motion.button>
                          )}
                          <div className="flex gap-1">
                            {REACTIONS.map((em) => (
                              <motion.button key={em} whileHover={{ scale: 1.25, rotate: 10 }} whileTap={{ scale: 0.85 }} onClick={() => sendReact(em)} className="text-lg">
                                {em}
                              </motion.button>
                            ))}
                          </div>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMinimized(true)} className={cn(ctrlBtn, 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10')} title="کوچک‌سازی">
                            <Minimize2 size={15} />
                          </motion.button>
                        </>
                      )}
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={endCall} className={cn(ctrlBtn, 'border-red-400/40 bg-red-400/15 text-red-400 hover:bg-red-400/25')} title="پایان">
                        <PhoneOff size={18} />
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Pill */}
      <AnimatePresence>
        {call && call.status === 'active' && minimized && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={cn('fixed bottom-4 right-4 z-[16000] flex items-center gap-3 border border-emerald-400/40 bg-[#070b18]/95 px-4 py-2.5 shadow-[0_0_30px_rgba(52,211,153,0.35)] backdrop-blur-2xl', CLIP_SM)}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'pcoBlink 1.2s infinite' }} />
            <span className="text-xs font-bold text-white">{call.peerName}</span>
            <span className="font-display text-xs tabular-nums text-emerald-300">{fmt(seconds)}</span>
            <div className="flex h-4 items-end gap-[2px]">
              {bars.slice(0, 6).map((h, i) => (
                <motion.div key={i} animate={{ height: `${h}%` }} transition={{ duration: 0.11 }} className="w-[3px] rounded-full bg-emerald-400" />
              ))}
            </div>
            <button onClick={() => setMinimized(false)} className="grid h-7 w-7 place-items-center text-cyan-300 transition hover:bg-white/10" title="بازکردن">
              <Maximize2 size={13} />
            </button>
            <button onClick={endCall} className="grid h-7 w-7 place-items-center text-red-400 transition hover:bg-red-400/10" title="پایان">
              <PhoneOff size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function RemoteVideoView({ remoteVideoRef, peerName }) {
  const holderRef = useRef(null);
  useEffect(() => {
    const el = remoteVideoRef?.current;
    if (el && holderRef.current) {
      el.className = 'h-full w-full object-cover';
      holderRef.current.appendChild(el);
    }
  }, []);
  return <div ref={holderRef} className="h-full w-full" title={peerName} />;
}

function LocalVideoView({ localVideoRef }) {
  const holderRef = useRef(null);
  useEffect(() => {
    const el = localVideoRef?.current;
    if (el && holderRef.current) {
      el.className = 'h-full w-full -scale-x-100 object-cover';
      el.muted = true;
      holderRef.current.appendChild(el);
    }
  }, []);
  return <div ref={holderRef} className="h-full w-full" />;
}