import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTickets(userId, isAdmin = false) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('tickets')
      .select('*, replies:ticket_replies(*)')
      .order('created_at', { ascending: false });
    
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }
    
    const { data } = await query;
    setTickets(data || []);
    setLoading(false);
  }, [userId, isAdmin]);

  useEffect(() => {
    if (!userId && !isAdmin) return;
    load();

    const channel = supabase
      .channel('tickets-' + (isAdmin ? 'admin' : userId))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets',
      }, () => load())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ticket_replies',
      }, () => load())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, isAdmin, load]);

  // ایجاد تیکت
  const createTicket = async ({ subject, message, category = 'general' }) => {
    const { data, error } = await supabase
      .from('tickets')
      .insert({ user_id: userId, subject, message, category })
      .select()
      .single();
    
    if (error) return { ok: false, error: error.message };
    return { ok: true, ticket: data };
  };

  // ارسال پاسخ
  const replyToTicket = async (ticketId, message, isAdminReply = false) => {
    const { data, error } = await supabase
      .from('ticket_replies')
      .insert({ ticket_id: ticketId, user_id: userId, message, is_admin: isAdminReply })
      .select()
      .single();
    
    if (error) return { ok: false, error: error.message };
    
    // آپدیت وضعیت تیکت
    const newStatus = isAdminReply ? 'admin_replied' : 'open';
    await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    
    return { ok: true, reply: data };
  };

  // تغییر وضعیت (فقط ادمین)
  const updateStatus = async (ticketId, status) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  return { tickets, loading, createTicket, replyToTicket, updateStatus, refresh: load };
}