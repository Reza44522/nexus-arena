import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/* ─────────── useGroups — منطق کامل گروه‌ها ───────────
   ✅ اسم کانال‌های Realtime یکتاست تا چند نمونه‌ی هم‌زمان
   (Friends + GroupChatModal) با هم تداخل نکنند
────────────────────────────────────────────────────── */
export function useGroups(userId) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  /* لیست گروه‌های من */
  const loadGroups = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('group_members')
      .select('role, group:groups(id, name, description, owner_id, created_at)')
      .eq('user_id', userId);
    if (error) console.error('❌ groups:', error.message);
    setGroups(
      (data || [])
        .filter((m) => m.group)
        .map((m) => ({ ...m.group, my_role: m.role }))
    );
    setLoading(false);
  }, [userId]);

  /* Realtime: عضویت‌ها و گروه‌ها — ✅ کانال یکتا */
  useEffect(() => {
    loadGroups();
    if (!userId) return;
    const ch = supabase
      .channel('groups-' + userId + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${userId}` }, () => loadGroups())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => loadGroups())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId, loadGroups]);

  /* ➕ ساخت گروه */
  const createGroup = async (name, description, memberIds) => {
    const { data, error } = await supabase.rpc('create_group', {
      p_name: name,
      p_description: description,
      p_member_ids: memberIds,
    });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    await loadGroups();
    return { ok: true, id: data.id };
  };

  /* 👥 اعضا */
  const loadMembers = async (groupId) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, profile:profiles(id, username, avatar_url, status)')
      .eq('group_id', groupId)
      .order('joined_at');
    if (error) console.error('❌ members:', error.message);
    return data || [];
  };

  const addMember = async (groupId, targetId) => {
    const { data, error } = await supabase.rpc('add_group_member', { p_group_id: groupId, p_user_id: targetId });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    return { ok: true };
  };

  const removeMember = async (groupId, targetId) => {
    const { data, error } = await supabase.rpc('remove_group_member', { p_group_id: groupId, p_user_id: targetId });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    return { ok: true };
  };

  /* 👑 انحلال گروه (مالک/ادمین) */
  const dissolve = async (groupId) => {
    const { data, error } = await supabase.rpc('dissolve_group', { p_group_id: groupId });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    await loadGroups();
    return { ok: true };
  };

  /* 🚪 ترک گروه */
  const leave = async (groupId) => removeMember(groupId, userId);

  /* ─────────── پیام‌ها ─────────── */
  const loadMessages = async (groupId) => {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, sender:profiles(id, username), poll:group_polls(*, options:group_poll_options(*), votes:group_poll_votes(*))')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) console.error('❌ group messages:', error.message);
    return (data || []).reverse();
  };

  const sendText = async (groupId, content) => {
    const { error } = await supabase.from('group_messages').insert({
      group_id: groupId,
      sender_id: userId,
      type: 'text',
      content: content.trim(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  /* 📎 آپلود مدیا (عکس/فایل/ویس) + ارسال */
  const uploadAndSend = async (groupId, fileOrBlob, kind, caption = '') => {
    const name = fileOrBlob.name || (kind === 'voice' ? 'voice.webm' : 'file');
    const ext = name.includes('.') ? name.split('.').pop() : 'webm';
    const path = `groups/${groupId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('group-media').upload(path, fileOrBlob);
    if (upErr) return { ok: false, error: upErr.message };
    const mediaUrl = supabase.storage.from('group-media').getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from('group_messages').insert({
      group_id: groupId,
      sender_id: userId,
      type: kind,
      content: caption || null,
      media_url: mediaUrl,
      media_name: kind === 'voice' ? 'پیام صوتی' : name,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  /* 📰 اشتراک پست خبری در گروه */
  const sharePost = async (groupId, postId, caption = '') => {
    const { error } = await supabase.from('group_messages').insert({
      group_id: groupId,
      sender_id: userId,
      type: 'post',
      content: caption || null,
      post_id: postId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  /* ─────────── نظرسنجی ─────────── */
  const createPoll = async (groupId, question, options, multiple) => {
    const { data, error } = await supabase.rpc('create_poll', {
      p_group_id: groupId,
      p_question: question,
      p_options: options,
      p_multiple: multiple,
    });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    return { ok: true };
  };

  const votePoll = async (pollId, optionId) => {
    const { data, error } = await supabase.rpc('vote_poll', { p_poll_id: pollId, p_option_id: optionId });
    if (error) return { ok: false, error: error.message };
    if (data && data.ok === false) return { ok: false, error: data.error };
    return { ok: true };
  };

  const closePoll = async (pollId) => {
    const { data, error } = await supabase.rpc('close_poll', { p_poll_id: pollId });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  return {
    groups, loading, refresh: loadGroups,
    createGroup, loadMembers, addMember, removeMember, dissolve, leave,
    loadMessages, sendText, uploadAndSend, sharePost,
    createPoll, votePoll, closePoll,
  };
}