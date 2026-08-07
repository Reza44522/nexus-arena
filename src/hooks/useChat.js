import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useChat(limit = 100) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // لود پیام‌های اخیر از دیتابیس
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      setMessages(data?.reverse() || []);
      setLoading(false);
    };

    loadMessages();

    // ✅ اشتراک Real-Time: پیام جدید فوراً می‌رسد
    const channel = supabase
      .channel('chat-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) => [...prev.slice(-99), payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  // ✅ ارسال پیام واقعی به دیتابیس
  const sendMessage = async (message, user, profile) => {
    if (!user || !message.trim()) return { ok: false };

    const { error } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      username: profile?.username || user.email?.split('@')[0] || 'Player',
      message: message.trim(),
      role: profile?.role || 'user',
    });

    if (error) {
      console.error('خطای ارسال پیام:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  return { messages, loading, sendMessage };
}