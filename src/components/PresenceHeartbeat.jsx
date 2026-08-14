import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* ─────────── PresenceHeartbeat — نسخه‌ی ضد‌گلوله ───────────
   هر ۳۰ ثانیه: اول از دیتابیس می‌پرسد «بن هستم؟»
   - بن/بلاک → فقط last_seen (status دست‌نخورده می‌ماند)
   - عادی → status='active' + last_seen
   ✅ هرگز بن را باطل نمی‌کند
─────────────────────────────────────────────────────────── */
export default function PresenceHeartbeat() {
  const { user } = useAuth();
  const restrictedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    const beat = async () => {
      try {
        const { data: p } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', user.id)
          .single();
        const restricted = !!p && (p.status === 'banned' || p.status === 'blocked');
        restrictedRef.current = restricted;
        const payload = restricted
          ? { last_seen: new Date().toISOString() }
          : { status: 'active', last_seen: new Date().toISOString() };
        await supabase.from('profiles').update(payload).eq('id', user.id);
      } catch {}
    };

    const goOffline = () => {
      if (restrictedRef.current) return; // status بن را عوض نکن
      fetch(`${URL}/rest/v1/profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ status: 'offline' }),
      }).catch(() => {});
    };

    beat();
    const iv = setInterval(beat, 30000);

    const onVis = () => {
      if (document.visibilityState === 'hidden') goOffline();
      else beat();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', goOffline);

    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', goOffline);
    };
  }, [user?.id]);

  return null;
}