import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useStreamSettings } from '../../hooks/useStreamSettings';
import { getAparatEmbedUrl, streamConfig } from '../../config/stream';
import { formatNumber } from '../../utils/format';
import Badge from '../ui/Badge';
import NeonButton from '../ui/NeonButton';

// ✅ استخراج URL خالص از هر چیزی که کاربر paste کنه (HTML، لینک و...)
function extractAparatUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // ۱) اگه URL تمیز بود
  if (/^https?:\/\/[^\s<>"']+$/i.test(trimmed)) return trimmed;

  // ۲) اگه HTML بود، URL داخل src یا src= رو بیرون بکش
  const srcMatch = trimmed.match(/src\s*=\s*["']?([^"'\s<>]+)["']?/i);
  if (srcMatch && /aparat\.com/i.test(srcMatch[1])) return srcMatch[1];

  // ۳) اگه لینک آپارات داخل متن بود
  const urlMatch = trimmed.match(/https?:\/\/[^\s<>"']*aparat\.com[^\s<>"']*/i);
  if (urlMatch) return urlMatch[0];

  return null;
}

// تبدیل لینک معمولی /v/... به embed
function toEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('/embed/')) return url;
  const m = url.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/);
  if (m) return `https://www.aparat.com/embed/${m[1]}`;
  return url;
}

function LivePlayer({ embedUrl }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        title="Aparat Live Stream"
        className="absolute inset-0 h-full w-full"
        scrolling="no"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      />
    </div>
  );
}

function OfflineScreen({ notified, onNotify, channelName }) {
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-[#070714] px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.12),transparent_60%)]" />
      <div className="relative text-center">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 text-3xl"
        >
          🌙
        </motion.div>
        <h3 className="mt-4 font-display text-lg font-bold text-white">استریم آفلاین است</h3>
        <p className="mt-1 text-sm text-slate-400">{channelName} الان لایو نیست. بعداً سر بزن!</p>
        <NeonButton size="sm" variant={notified ? 'ghost' : 'primary'} className="mt-5" onClick={onNotify}>
          {notified ? '✓ فعال شد' : '🔔 اطلاع بده'}
        </NeonButton>
      </div>
    </div>
  );
}

export default function AparatStream() {
  const { user } = useAuth();
  const { settings } = useStreamSettings();
  const [viewers, setViewers] = useState(0);
  const [following, setFollowing] = useState(false);
  const [notified, setNotified] = useState(false);

  const isOnline = settings?.is_live === true;
  const title = settings?.title || streamConfig.streamTitle;
  const channelName = settings?.streamer_name || streamConfig.channelName;

  // ✅ استخراج URL امن
  const rawUrl = extractAparatUrl(settings?.aparat_url);
  const embedUrl = toEmbedUrl(rawUrl) || getAparatEmbedUrl(streamConfig.aparatUsername);

  // بینندگان واقعی با Realtime Presence
  useEffect(() => {
    const key = user?.id || 'guest-' + Math.random().toString(36).slice(2, 8);
    const channel = supabase.channel('stream-viewers', {
      config: { presence: { key } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setViewers(Object.values(state).flat().length);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user?.id || null });
      }
    });

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  return (
    <div className="space-y-4">
      <div className="glass-strong overflow-hidden rounded-2xl">
        {/* هدر */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            {isOnline ? <Badge color="red" pulse>LIVE</Badge> : <Badge color="slate">OFFLINE</Badge>}
            <div>
              <h3 className="font-display text-sm font-bold tracking-wider text-white">{title}</h3>
              <p className="text-xs text-slate-400">aparat.com • {streamConfig.streamCategory}</p>
            </div>
          </div>
          {isOnline && (
            <span className="flex items-center gap-1.5 text-xs text-slate-300">
              👁 <b className="text-cyan-300">{formatNumber(viewers)}</b> بیننده واقعی
            </span>
          )}
        </div>

        {/* پلیر */}
        <div className="relative aspect-video w-full bg-black">
          <AnimatePresence mode="wait">
            {isOnline ? (
              <motion.div key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                <LivePlayer embedUrl={embedUrl} />
              </motion.div>
            ) : (
              <motion.div key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                <OfflineScreen notified={notified} onNotify={() => setNotified(true)} channelName={channelName} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* نوار استریمر */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 font-display font-black text-white shadow-glow-magenta">
              MG
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-display text-sm font-bold text-white">
                {channelName} <span className="text-rose-400">✔</span>
              </p>
              <p className="text-xs text-slate-400">استریمر رسمی NexusArena</p>
            </div>
          </div>
          <div className="flex gap-2">
            <NeonButton size="sm" variant={following ? 'ghost' : 'primary'} onClick={() => setFollowing((v) => !v)}>
              {following ? '✓ دنبال شد' : '+ دنبال کن'}
            </NeonButton>
            <NeonButton size="sm" variant="ghost">اشتراک</NeonButton>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl px-4 py-3 text-center text-xs text-slate-400">
        ✅ وضعیت پخش توسط ادمین کنترل می‌شود • در فیلد لینک فقط URL خالص وارد کنید
      </div>
    </div>
  );
}