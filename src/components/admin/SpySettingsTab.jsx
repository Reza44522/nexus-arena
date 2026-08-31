import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../utils/cn';

const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const inputCls = 'w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-purple-400/50';
const btnCls = 'rounded-md bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 disabled:opacity-40';

export default function SpySettingsTab() {
  const [settings, setSettings] = useState({ base_cost: 100, base_success: 70, counter_bonus: 150 });
  const [ops, setOps] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const [sR, oR] = await Promise.all([
      supabase.from('spy_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('spy_ops').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    if (sR.data) setSettings(sR.data);
    setOps(oR.data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('admin_set_spy_settings', {
      p_cost: Number(settings.base_cost),
      p_success: Number(settings.base_success),
      p_bonus: Number(settings.counter_bonus),
    });
    setBusy(false);
    setNotice(error ? '❌ ' + error.message : '✅ تنظیمات ذخیره شد');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="space-y-6">
      {notice && <div className={cn('border border-purple-400/40 bg-slate-950/95 px-4 py-2 text-xs text-white', CLIP_SM)}>{notice}</div>}
      <div className={cn('border border-purple-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
        <p className="mb-3 text-sm font-black text-white">🕵️ تنظیمات شبکه جاسوسی</p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs text-slate-300">هزینه پایه (WD):
            <input type="number" value={settings.base_cost} onChange={(e) => setSettings({ ...settings, base_cost: e.target.value })} className={cn(inputCls, 'mt-1')} />
          </label>
          <label className="text-xs text-slate-300">درصد موفقیت پایه (٪):
            <input type="number" value={settings.base_success} onChange={(e) => setSettings({ ...settings, base_success: e.target.value })} className={cn(inputCls, 'mt-1')} />
          </label>
          <label className="text-xs text-slate-300">جایزه ضدجاسوسی (WD):
            <input type="number" value={settings.counter_bonus} onChange={(e) => setSettings({ ...settings, counter_bonus: e.target.value })} className={cn(inputCls, 'mt-1')} />
          </label>
        </div>
        <button onClick={save} disabled={busy} className={cn(btnCls, 'mt-4')}>ذخیره تنظیمات</button>
      </div>
      <div className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
        <p className="mb-3 text-sm font-black text-white">📋 لاگ جاسوسی جهان</p>
        {ops.length === 0 ? <p className="text-xs text-slate-600">عملیاتی ثبت نشده</p> : ops.map((op) => (
          <p key={op.id} className="mb-1 text-[10px] text-slate-400">
            {op.success ? '✅' : '❌'} جاسوسی {op.spy_country} → {op.target_country}
            {op.counter_detected && ' (شناسایی!)'} — {new Date(op.created_at).toLocaleString('fa-IR')}
          </p>
        ))}
      </div>
    </div>
  );
}