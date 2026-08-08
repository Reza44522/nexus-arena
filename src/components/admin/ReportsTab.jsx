import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import NeonButton from '../ui/NeonButton';

const statusMap = {
  pending: { label: 'در انتظار', color: 'amber' },
  resolved: { label: 'رسیدگی شد', color: 'green' },
  dismissed: { label: 'رد شد', color: 'slate' },
};

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warnTarget, setWarnTarget] = useState(null);
  const [warnMessage, setWarnMessage] = useState('');
  const [busy, setBusy] = useState(null);

  // دریافت گزارش‌ها + اسم کاربرها (با fallback اگه join خطا داد)
  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*, reporter:reporter_id(id, username), reported:reported_id(id, username)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ reports join error:', error.message);
      const plain = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      const rows = plain.data || [];
      const ids = [...new Set(rows.flatMap((r) => [r.reporter_id, r.reported_id]).filter(Boolean))];
      const profMap = {};
      if (ids.length) {
        const { data: ps } = await supabase.from('profiles').select('id, username').in('id', ids);
        (ps || []).forEach((p) => (profMap[p.id] = p.username));
      }
      rows.forEach((r) => {
        r.reporter = { username: profMap[r.reporter_id] || '؟' };
        r.reported = { username: profMap[r.reported_id] || '؟' };
      });
      setReports(rows);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  }, []);

  // Realtime
  useEffect(() => {
    load();
    const ch = supabase
      .channel('admin-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  // تغییر وضعیت گزارش
  const setStatus = async (id, status) => {
    setBusy(id);
    const { error } = await supabase
      .from('reports')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) alert('❌ ' + error.message);
    setBusy(null);
  };

  // ارسال اخطار به کاربر گزارش‌شده
  const sendWarn = async () => {
    if (!warnTarget || !warnMessage.trim()) return;
    setBusy(warnTarget.id);
    const { data, error } = await supabase.rpc('admin_warn_user', {
      p_user_id: warnTarget.reported_id,
      p_message: warnMessage.trim(),
    });
    if (error) alert('❌ ' + error.message);
    else if (data && data.ok === false) alert('❌ ' + data.error);
    else alert('✅ اخطار ارسال شد و به اعلانات کاربر رفت');
    setWarnTarget(null);
    setWarnMessage('');
    setBusy(null);
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">
          🚨 گزارش‌های کاربران
        </h2>
        <NeonButton size="sm" variant="ghost" onClick={load}>🔄 تازه‌سازی</NeonButton>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center text-slate-400">هیچ گزارشی ثبت نشده است ✅</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Flag size={16} className="text-red-400" />
                <p className="text-sm text-white">
                  <span className="font-bold text-cyan-300">{r.reporter?.username || '؟'}</span>
                  {' → گزارش داد: '}
                  <span className="font-bold text-red-300">{r.reported?.username || '؟'}</span>
                </p>
                <span className="mr-auto">
                  <Badge color={statusMap[r.status]?.color || 'slate'}>
                    {statusMap[r.status]?.label || r.status}
                  </Badge>
                </span>
              </div>

              <div className="mt-3 rounded-lg bg-black/30 p-3 text-sm">
                <p className="text-amber-300">دلیل: {r.reason}</p>
                {r.details && <p className="mt-1 text-slate-300">توضیحات: {r.details}</p>}
              </div>

              <p className="mt-2 text-[10px] text-slate-500">
                {new Date(r.created_at).toLocaleString('fa-IR')}
              </p>

              {r.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <NeonButton size="sm" variant="ghost" disabled={busy === r.id} onClick={() => setWarnTarget(r)}>
                    <span className="flex items-center gap-1"><AlertTriangle size={13} /> اخطار به کاربر</span>
                  </NeonButton>
                  <NeonButton size="sm" disabled={busy === r.id} onClick={() => setStatus(r.id, 'resolved')}>
                    <span className="flex items-center gap-1"><CheckCircle size={13} /> رسیدگی شد</span>
                  </NeonButton>
                  <NeonButton size="sm" variant="ghost" disabled={busy === r.id} onClick={() => setStatus(r.id, 'dismissed')}>
                    <span className="flex items-center gap-1"><XCircle size={13} /> رد گزارش</span>
                  </NeonButton>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* مودال اخطار */}
      <AnimatePresence>
        {warnTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setWarnTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong w-full max-w-md rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold text-white">
                ⚠️ ارسال اخطار به: {warnTarget.reported?.username}
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                اخطار به اعلانات کاربر ارسال می‌شود و شمارنده‌ی اخطارهای او +۱ می‌شود.
              </p>
              <textarea
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                rows={3}
                placeholder="متن اخطار... مثلاً: رعایت قوانین الزامی است"
                className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white outline-none focus:border-amber-400/50"
              />
              <div className="mt-4 flex gap-3">
                <NeonButton className="flex-1" onClick={sendWarn}>ارسال اخطار</NeonButton>
                <NeonButton variant="ghost" className="flex-1" onClick={() => setWarnTarget(null)}>انصراف</NeonButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}