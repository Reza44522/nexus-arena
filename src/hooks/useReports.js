import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useReports(isAdmin = false) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:reporter_id(username), reported:reported_id(username)')
      .order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    load();

    const channel = supabase.channel('reports-admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reports',
      }, () => load())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isAdmin, load]);

  // گزارش کاربر
  const reportUser = async (reportedId, reason, details = null) => {
    const { error } = await supabase.rpc('report_user', {
      p_reported_id: reportedId,
      p_reason: reason,
      p_details: details,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  // مدیریت گزارش (فقط ادمین)
  const updateReport = async (reportId, { status, admin_notes }) => {
    const updates = { status };
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (status !== 'pending') updates.resolved_at = new Date().toISOString();
    
    const { error } = await supabase.from('reports').update(updates).eq('id', reportId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  return { reports, loading, reportUser, updateReport, refresh: load };
}