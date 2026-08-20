import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function getActiveRestriction(profile) {
  if (!profile || profile.deleted_at) return 'deleted';
  if (profile.status === 'active') return null;
  if (profile.status === 'banned' || profile.status === 'blocked') {
    if (profile.restrict_until && new Date(profile.restrict_until) < new Date()) return null;
    return profile.status;
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();
    if (!error && data) {
      if (data.status !== 'active' && data.restrict_until) {
        if (new Date(data.restrict_until) < new Date()) {
          const { data: updated } = await supabase
            .from('profiles')
            .update({ status: 'active', restrict_until: null, restrict_reason: null })
            .eq('id', userId)
            .select()
            .single();
          if (updated) { setProfile(updated); return updated; }
        }
      }
      setProfile(data);
    }
    return data;
  };

  useEffect(() => {
        const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setLoading(false);             // ✅ سایت فوراً باز شود
          loadProfile(session.user.id);  // پروفایل در پس‌زمینه
          return;
        }
      } catch (e) {
        console.error('❌ initAuth (شبکه در دسترس نیست):', e);
      }
      setLoading(false);
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ✅ NEW — Realtime زنده‌ی پروفایل:
     بن/آنبلاک/ارتقا/آزادسازی همان لحظه روی کلاینت اعمال شود */
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel('profile-live-' + user.id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        async (payload) => {
          const p = payload.new;
          if (!p) return;
          // اگر زمان بن منقضی شده، همان لحظه آزاد کن
          if (p.status !== 'active' && p.restrict_until && new Date(p.restrict_until) < new Date()) {
            const { data: updated } = await supabase
              .from('profiles')
              .update({ status: 'active', restrict_until: null, restrict_reason: null })
              .eq('id', user.id)
              .select()
              .single();
            if (updated) setProfile(updated);
            return;
          }
          setProfile(p);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user?.id]);

  const register = async ({ name, email, password }) => {
    if (name.trim().length < 3) return { ok: false, error: 'نام کاربری باید حداقل ۳ کاراکتر باشد' };
    if (password.length < 6) return { ok: false, error: 'رمز باید حداقل ۶ کاراکتر باشد' };
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    const isFirstUser = count === 0;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          username: name.trim(),
          full_name: name.trim(),
          role: isFirstUser ? 'admin' : 'user',
          is_owner: isFirstUser,
        },
      },
    });
    if (error) {
      if (error.message.includes('already registered')) return { ok: false, error: 'این ایمیل قبلاً ثبت شده است' };
      return { ok: false, error: error.message };
    }
    return { ok: true, user: data.user };
  };

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, error: 'ایمیل یا رمز اشتباه است' };
    return { ok: true, user: data.user };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return { ok: false, error: 'لاگین نیستید' };
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
    if (error) return { ok: false, error: error.message };
    setProfile(data);
    return { ok: true };
  };

  const getAllUsers = async () => {
    if (profile?.role !== 'admin') return [];
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    return data || [];
  };

  const deleteUser = async (userId) => {
    if (profile?.role !== 'admin') return { ok: false, error: 'دسترسی ندارید' };
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('is_owner, role, username')
      .eq('id', userId)
      .single();
    if (!targetUser) return { ok: false, error: 'کاربر یافت نشد' };
    if (targetUser.is_owner) return { ok: false, error: 'مالک سیستم قابل حذف نیست' };
    if (userId === user.id) return { ok: false, error: 'نمی‌توانید حساب خودتان را حذف کنید' };
    if (targetUser.role === 'admin' && !profile?.is_owner) {
      return { ok: false, error: 'فقط مالک می‌تواند ادمین‌ها را حذف کند' };
    }
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString(), status: 'deleted' })
      .eq('id', userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const promoteUser = async (userId) => {
    if (profile?.role !== 'admin') return { ok: false, error: 'دسترسی ندارید' };
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const moderateUser = async (userId, { status, hours = 0, reason = null }) => {
    if (profile?.role !== 'admin') return { ok: false, error: 'دسترسی ندارید' };
    const { data: targetUser } = await supabase.from('profiles').select('is_owner').eq('id', userId).single();
    if (targetUser?.is_owner && !profile?.is_owner) {
      return { ok: false, error: 'فقط مالک می‌تواند مالک را مدیریت کند' };
    }
    if (userId === user.id) return { ok: false, error: 'نمی‌توانید خودتان را محدود کنید' };
    const updates = { status, restrict_reason: reason };
    updates.restrict_until = hours > 0 ? new Date(Date.now() + hours * 3600000).toISOString() : null;
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const sendNotification = async ({ userId, title, message, type }) => {
    if (profile?.role !== 'admin') return { ok: false, error: 'دسترسی ندارید' };
    const { error } = await supabase.from('notifications').insert({
      user_id: type === 'private' ? userId : null,
      title, message, type,
      sender_name: profile?.username || 'Admin',
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const sendFriendRequest = async (friendId) => {
    const { error } = await supabase.rpc('send_friend_request', { p_friend_id: friendId });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };
  const respondFriendRequest = async (friendshipId, action) => {
    const { error } = await supabase.rpc('respond_friend_request', {
      p_friendship_id: friendshipId,
      p_action: action,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };
  const removeFriend = async (friendshipId) => {
    const { error } = await supabase.rpc('remove_friend', { p_friendship_id: friendshipId });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };
  const sendPrivateMessage = async (toUserId, message) => {
    const { error } = await supabase.rpc('send_private_message', {
      p_to_user: toUserId,
      p_message: message,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };
  const reportUser = async (reportedId, reason, details = null) => {
    const { error } = await supabase.rpc('report_user', {
      p_reported_id: reportedId,
      p_reason: reason,
      p_details: details,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const value = useMemo(
    () => ({
      user, profile, loading,
      login, register, logout, updateProfile,
      getAllUsers, deleteUser, promoteUser,
      moderateUser, sendNotification,
      sendFriendRequest, respondFriendRequest, removeFriend,
      sendPrivateMessage, reportUser,
      isAdmin: profile?.role === 'admin',
      isOwner: profile?.is_owner === true,
    }),
    [user, profile, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}