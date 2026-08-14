import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* ─────────── PresenceHeartbeat ───────────
   هر ۳۰ ثانیه last_seen را تازه می‌کند (status=active)
   و هنگام بستن/مخفی‌شدن تب، کاربر را آفلاین می‌کند
─────────────────────────────────────────── */
export default function PresenceHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    /* من آنلاین هستم */
    const beat = () => {
      supabase
        .from('profiles')
        .update({ status: 'active', last_seen: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => {});
    };

    /* هنگام بستن تب — با keepalive تا حتماً برسد */
    const goOffline = () => {
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