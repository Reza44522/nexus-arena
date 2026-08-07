import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useFriends(userId) {
  const [friends, setFriends] = useState([]);       // دوستی‌های accepted
  const [requests, setRequests] = useState([]);     // درخواست‌های ورودی pending
  const [sentRequests, setSentRequests] = useState([]); // درخواست‌های ارسالی
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!userId) return;

    // دوستی‌های accepted (دو طرفه)
    const { data: acceptedData } = await supabase.rpc('get_accepted_friendships', { p_user_id: userId });
    
    // اگر RPC وجود نداشت، مستقیم select می‌کنیم
    let accepted = acceptedData;
    if (!accepted) {
      const { data } = await supabase
        .from('friendships')
        .select('*, profile:user_id(id, username, avatar_url), friend_profile:friend_id(id, username, avatar_url)')
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
      accepted = data || [];
    }

    // درخواست‌های ورودی
    const { data: reqIn } = await supabase
      .from('friendships')
      .select('*, profile:user_id(id, username, avatar_url)')
      .eq('friend_id', userId)
      .eq('status', 'pending');

    // درخواست‌های ارسالی
    const { data: reqOut } = await supabase
      .from('friendships')
      .select('*, profile:friend_id(id, username, avatar_url)')
      .eq('user_id', userId)
      .eq('status', 'pending');

    setFriends(accepted || []);
    setRequests(reqIn || []);
    setSentRequests(reqOut || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAll();
    if (!userId) return;

    const channel = supabase
      .channel('friendships-' + userId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
      }, () => loadAll())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, loadAll]);

  // ارسال درخواست دوستی
  const sendRequest = async (friendId) => {
    const { error } = await supabase.rpc('send_friend_request', { p_friend_id: friendId });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  // پاسخ به درخواست (accept/reject/block)
  const respondRequest = async (friendshipId, action) => {
    const { error } = await supabase.rpc('respond_friend_request', {
      p_friendship_id: friendshipId,
      p_action: action,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  // حذف دوست
  const removeFriend = async (friendshipId) => {
    const { error } = await supabase.rpc('remove_friend', { p_friendship_id: friendshipId });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  return {
    friends, requests, sentRequests, loading,
    sendRequest, respondRequest, removeFriend,
    refresh: loadAll,
  };
}