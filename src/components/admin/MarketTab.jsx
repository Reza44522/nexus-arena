import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../utils/cn';

const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const inputCls = 'w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50';
const btnCls = 'rounded-md bg-gradient-to-r from-emerald-400 to-cyan-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110 disabled:opacity-40';
const ghostBtn = 'rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-slate-300 transition hover:bg-white/10';

export default function MarketTab() {
  const [assets, setAssets] = useState([]);
  const [settings, setSettings] = useState({ frozen: false, tax_pct: 1, vol_mult: 1 });
  const [trades, setTrades] = useState([]);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 4000); };

  const load = async () => {
    const [aR, sR, tR] = await Promise.all([
      supabase.from('market_assets').select('*').order('id'),
      supabase.from('market_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('market_trades').select('*').order('created_at', { ascending: false }).limit(15),
    ]);
    setAssets(aR.data || []);
    if (sR.data) setSettings(sR.data);
    setTrades(tR.data || []);
  };
  useEffect(() => { load(); }, []);

  const set = (id, f, v) => setAssets(assets.map((a) => (a.id === id ? { ...a, [f]: v } : a)));
  const saveAsset = async (a) => {
    setBusy(a.id);
    const { data, error } = await supabase.rpc('admin_market_set_asset', { p_id: a.id, p_base: Number(a.base_price), p_vol: Number(a.volatility), p_trend: Number(a.trend) });
    setBusy(null);
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ «' + a.name_fa + '» ذخیره شد');
  };
  const shock = async (id, pct) => {
    setBusy(id + pct);
    const { data, error } = await supabase.rpc('admin_market_shock', { p_id: id, p_pct: pct });
    setBusy(null);
    flash(error ? '❌ ' + error.message : `✅ شوک ${pct > 0 ? '+' : ''}${pct}٪ اعمال شد`);
    load();
  };
  const saveSettings = async () => {
    setBusy('set');
    const { data, error } = await supabase.rpc('admin_market_settings', { p_frozen: !!settings.frozen, p_tax: Number(settings.tax_pct), p_vol_mult: Number(settings.vol_mult) });
    setBusy(null);
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ تنظیمات بازار ذخیره شد');
  };

  return (
    <div className="space-y-6">
      {notice && <div className={cn('border border-emerald-400/40 bg-slate-950/95 px-4 py-2 text-xs text-white', CLIP_SM)}>{notice}</div>}
      <div className={cn('border border-emerald-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
        <p className="mb-3 text-sm font-black text-white">⚙️ تنظیمات کل بازار</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={!!settings.frozen} onChange={(e) => setSettings({ ...settings, frozen: e.target.checked })} /> 🥶 توقف بازار</label>
          <label className="text-xs text-slate-300">کارمزد ٪: <input type="number" value={settings.tax_pct} onChange={(e) => setSettings({ ...settings, tax_pct: e.target.value })} className={cn(inputCls, 'w-20')} /></label>
          <label className="text-xs text-slate-300">ضریب نوسان: <input type="number" step="0.1" value={settings.vol_mult} onChange={(e) => setSettings({ ...settings, vol_mult: e.target.value })} className={cn(inputCls, 'w-20')} /></label>
          <button onClick={saveSettings} disabled={busy === 'set'} className={btnCls}>ذخیره</button>
        </div>
      </div>
      <div className={cn('border border-amber-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
        <p className="mb-3 text-sm font-black text-white">📈 کنترل نمادها (قیمت پایه / نوسان / روند + شوک خبری)</p>
        <div className="grid gap-2 md:grid-cols-2">
          {assets.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-2 border border-white/10 bg-white/5 p-2">
              <span className="text-lg">{a.icon}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">{a.name_fa} <span className="text-emerald-300">@{a.price}</span></span>
              <input type="number" title="قیمت پایه" value={a.base_price} onChange={(e) => set(a.id, 'base_price', e.target.value)} className={cn(inputCls, 'w-16')} />
              <input type="number" title="نوسان" step="0.1" value={a.volatility} onChange={(e) => set(a.id, 'volatility', e.target.value)} className={cn(inputCls, 'w-14')} />
              <input type="number" title="روند" step="0.1" value={a.trend} onChange={(e) => set(a.id, 'trend', e.target.value)} className={cn(inputCls, 'w-14')} />
              <button onClick={() => saveAsset(a)} disabled={busy === a.id} className={btnCls}>ذخیره</button>
              <button onClick={() => shock(a.id, 5)} disabled={busy === a.id + 5} className={cn(ghostBtn, 'text-emerald-300')}>+۵٪</button>
              <button onClick={() => shock(a.id, -5)} disabled={busy === a.id + -5} className={cn(ghostBtn, 'text-red-400')}>−۵٪</button>
            </div>
          ))}
        </div>
      </div>
      <div className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
        <p className="mb-3 text-sm font-black text-white">🧾 آخرین معاملات بازار</p>
        {trades.length === 0 ? <p className="text-xs text-slate-600">معامله‌ای ثبت نشده</p> : trades.map((t) => (
          <p key={t.id} className="mb-1 text-[10px] text-slate-400">{t.side === 'buy' ? '📈 خرید' : '📉 فروش'} {t.asset_id} ×{t.qty} @ {t.price} — {new Date(t.created_at).toLocaleString('fa-IR')}</p>
        ))}
      </div>
    </div>
  );
}