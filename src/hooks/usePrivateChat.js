import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function usePrivateChat(userId, friendId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !friendId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .or(
        `and(from_user_id.eq.${userId},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) console.error('❌ load messages:', error.message);
    setMessages(data || []);

    // پیام‌های دریافتی رو خوانده‌شده علامت بزن
    if (data?.length > 0) {
      const unreadIds = data
        .filter((m) => m.to_user_id === userId && !m.is_read)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('private_messages').update({ is_read: true }).in('id', unreadIds);
      }
    }
    setLoading(false);
  }, [userId, friendId]);

  useEffect(() => { load(); }, [load]);

  // Realtime پیام‌های جدید
  useEffect(() => {
    if (!userId || !friendId) return;
    const channel = supabase
      .channel('pm-' + userId + '-' + friendId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const m = payload.new;
        const isRelevant =
          (m.from_user_id === userId && m.to_user_id === friendId) ||
          (m.from_user_id === friendId && m.to_user_id === userId);
        if (isRelevant) {
          setMessages((prev) => [...prev, m]);
          if (m.to_user_id === userId) {
            supabase.from('private_messages').update({ is_read: true }).eq('id', m.id);
          }
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, friendId]);

  // ✅ ارسال پیام + برگردوندن خطا (دیگه هیچ‌وقت بی‌صدا نمی‌مونه)
  const sendMessage = async (text) => {
    if (!text.trim()) return { ok: false, error: 'پیام خالی است' };
    const { data, error } = await supabase.rpc('send_private_message', {
      p_to_user: friendId,
      p_message: text.trim(),
    });
    if (error) return { ok: false, error: error.message };
    if (data && typeof data === 'object' && data.ok === false) {
      return { ok: false, error: data.error };
    }
    return { ok: true };
  };

  return { messages, loading, sendMessage };
}