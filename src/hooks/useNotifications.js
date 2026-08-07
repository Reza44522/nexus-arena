import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!userId) { setLoading(false); return; }
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId);

    const readIds = new Set((reads || []).map((r) => r.notification_id));
    setNotifications((notifs || []).map((n) => ({ ...n, is_read: readIds.has(n.id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!userId) return undefined;

    // Real-Time: اعلان جدید فوراً می‌رسد
    const channel = supabase
      .channel('notifications-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload.new;
        if (n.user_id === null || n.user_id === userId) {
          setNotifications((prev) => [{ ...n, is_read: false }, ...prev]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notification_reads').upsert(
      { notification_id: id, user_id: userId },
      { onConflict: 'notification_id,user_id' }
    );
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notification_reads').upsert(
      unread.map((n) => ({ notification_id: n.id, user_id: userId })),
      { onConflict: 'notification_id,user_id' }
    );
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, markRead, markAllRead, unreadCount };
}