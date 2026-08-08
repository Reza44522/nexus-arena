import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useFriends(userId) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [acceptedRes, reqInRes, reqOutRes, blockedRes, blockedByRes] = await Promise.all([
        supabase
          .from('friendships')
          .select('*, profile:user_id(id, username, avatar_url, status, level), friend_profile:friend_id(id, username, avatar_url, status, level)')
          .eq('status', 'accepted')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
        supabase
          .from('friendships')
          .select('*, profile:user_id(id, username, avatar_url, status)')
          .eq('friend_id', userId)
          .eq('status', 'pending'),
        supabase
          .from('friendships')
          .select('*, profile:friend_id(id, username, avatar_url, status)')
          .eq('user_id', userId)
          .eq('status', 'pending'),
        supabase
          .from('blocks')
          .select('*, blocked_profile:blocked_id(id, username, avatar_url, status)')
          .eq('blocker_id', userId),
        supabase
          .from('blocks')
          .select('blocker_id')
          .eq('blocked_id', userId),
      ]);

      // ✅ اگه هر کوئری خطا داشت، توی کنسول نشون بده
      [acceptedRes, reqInRes, reqOutRes, blockedRes, blockedByRes].forEach((r, i) => {
        if (r.error) console.error('❌ friends query #' + i + ':', r.error.message);
      });

      setFriends(acceptedRes.data || []);
      setRequests(reqInRes.data || []);
      setSentRequests(reqOutRes.data || []);
      setBlocked(blockedRes.data || []);
      setBlockedBy((blockedByRes.data || []).map((b) => b.blocker_id));
    } catch (err) {
      console.error('❌ loadAll:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Realtime روی دوستی‌ها و بلاک‌ها
  useEffect(() => {
    loadAll();
    if (!userId) return;
    const channel = supabase
      .channel('social-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, () => loadAll())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, loadAll]);

  // جستجوی کاربر با اسم
  const searchUsers = async (query) => {
    const q = (query || '').trim();
    if (q.length < 2) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, status, level')
      .neq('id', userId)
      .ilike('username', `%${q}%`)
      .limit(20);
    if (error) { console.error('❌ search:', error.message); return []; }
    return data || [];
  };

  // کاربرهای آنلاین
  const getOnlineUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, status, level')
      .neq('id', userId)
      .eq('status', 'active')
      .limit(20);
    if (error) { console.error('❌ online:', error.message); return []; }
    return data || [];
  };

  // ارسال درخواست دوستی
  const sendRequest = async (friendId) => {
    const { data, error } = await supabase.rpc('send_friend_request', { p_friend_id: friendId });
    if (error) return { ok: false, error: error.message };
    if (data && typeof data === 'object' && data.ok === false) return { ok: false, error: data.error };
    await loadAll();
    return { ok: true };
  };

  // پاسخ به درخواست (accept / reject / block)
  const respondRequest = async (friendshipId, action) => {
    const { data, error } = await supabase.rpc('respond_friend_request', { p_friendship_id: friendshipId, p_action: action });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    await loadAll();
    return { ok: true };
  };

  // حذف دوست / لغو درخواست
  const removeFriend = async (friendshipId) => {
    const { data, error } = await supabase.rpc('remove_friend', { p_friendship_id: friendshipId });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    await loadAll();
    return { ok: true };
  };

  // بلاک / آنبلاک
  const blockUser = async (targetId) => {
    const { data, error } = await supabase.rpc('block_user', { p_blocked_id: targetId });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    await loadAll();
    return { ok: true };
  };

  const unblockUser = async (targetId) => {
    const { data, error } = await supabase.rpc('unblock_user', { p_blocked_id: targetId });
    if (error) return { ok: false, error: error.message };
    await loadAll();
    return { ok: true };
  };

  return {
    friends, requests, sentRequests, blocked, blockedBy, loading,
    sendRequest, respondRequest, removeFriend, blockUser, unblockUser,
    searchUsers, getOnlineUsers, refresh: loadAll,
  };
}