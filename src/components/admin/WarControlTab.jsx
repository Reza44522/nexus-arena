import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { pingAI } from '../../lib/warAI';
import { cn } from '../../utils/cn';

const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';
const inputCls = 'w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50';
const btnCls = 'rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110 disabled:opacity-40';
const ghostBtn = 'rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-slate-300 transition hover:bg-white/10';

/* ─────────── WarControlTab — کنترل جنگ و اقتصاد (نسخه تمیز) ─────────── */
export default function WarControlTab() {
  const [settings, setSettings] = useState(null);
  const [ai, setAi] = useState({ provider: 'local', api_key: '', model: '' });
  const [days, setDays] = useState(3);
  const [catalog, setCatalog] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [users, setUsers] = useState([]);
  const [grantUser, setGrantUser] = useState('');
  const [grantAmt, setGrantAmt] = useState('500');
  const [newItem, setNewItem] = useState({ key: '', name: '', category: 'سلاح و تجهیزات', icon: '🎖', power: 20, cost_wd: 100 });
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 4000); };

  const load = async () => {
    const [s, a, c, st, sa, u] = await Promise.all([
      supabase.from('war_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('ai_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('military_catalog').select('*').order('cost_wd'),
      supabase.from('store_items').select('*').order('price_wd'),
      supabase.from('sanctions').select('*, def:player_countries!sanctions_defender_country_fkey(name_fa, flag)').order('created_at', { ascending: false }).limit(15),
      supabase.from('profiles').select('id, username').is('deleted_at', null).limit(300),
    ]);
    setSettings(s.data);
    if (s.data) setDays(s.data.tournament_interval_days);
    if (a.data) setAi({ provider: a.data.provider, api_key: a.data.api_key || '', model: a.data.model || '' });
    setCatalog(c.data || []);
    setStoreItems(st.data || []);
    setSanctions(sa.data || []);
    setUsers(u.data || []);
  };

  useEffect(() => { load(); }, []);
  const run = async (key, fn) => { setBusy(key); await fn(); setBusy(null); };

  const saveSettings = () => run('set', async () => {
    const { data, error } = await supabase.rpc('admin_set_war_settings', { p_days: Number(days) || 3, p_next_at: new Date(Date.now() + (Number(days) || 3) * 86400000).toISOString() });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ تنظیمات جنگ ذخیره شد');
    load();
  });

  const startCup = () => run('cup', async () => {
    if (!window.confirm('جام بزرگ جنگ شروع شود؟')) return;
    const { data, error } = await supabase.rpc('admin_start_tournament');
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : `🏆 جام شروع شد (${data.countries} کشور)`);
    load();
  });

  const saveAI = () => run('ai', async () => {
    const { data, error } = await supabase.rpc('admin_set_ai_settings', { p_provider: ai.provider, p_api_key: ai.api_key, p_model: ai.model });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ تنظیمات AI ذخیره شد');
  });

  const testAI = () => run('aitest', async () => {
    flash('🧪 در حال تست اتصال AI...');
    const r = await pingAI();
    flash(r.ok ? '✅ AI متصل است! — ' + (r.pub || '').slice(0, 80) : '❌ خطای دقیق: ' + (r.detail || 'نامشخص'));
  });

  const grant = () => run('grant', async () => {
    if (!grantUser) return flash('❌ کاربر را انتخاب کن');
    const { data, error } = await supabase.rpc('admin_grant_wd', { p_user: grantUser, p_amount: Number(grantAmt) || 0 });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ WD اعطا شد');
  });

  const saveCat = (row) => run('cat' + row.key, async () => {
    const { data, error } = await supabase.rpc('admin_upsert_catalog', { p_key: row.key, p_category: row.category, p_name: row.name, p_icon: row.icon, p_power: Number(row.power), p_cost_wd: Number(row.cost_wd), p_costs: row.costs, p_descr: row.descr });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ «' + row.name + '» ذخیره شد');
    load();
  });

  const addCat = () => run('catnew', async () => {
    if (!newItem.key || !newItem.name) return flash('❌ کلید و نام الزامی است');
    const { data, error } = await supabase.rpc('admin_upsert_catalog', { p_key: newItem.key, p_category: newItem.category, p_name: newItem.name, p_icon: newItem.icon, p_power: Number(newItem.power), p_cost_wd: Number(newItem.cost_wd), p_costs: {}, p_descr: '' });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ آیتم جدید اضافه شد');
    setNewItem({ key: '', name: '', category: 'سلاح و تجهیزات', icon: '🎖', power: 20, cost_wd: 100 });
    load();
  });

  const delCat = (key) => run('catdel' + key, async () => {
    if (!window.confirm('حذف «' + key + '»؟')) return;
    await supabase.rpc('admin_delete_catalog', { p_key: key });
    flash('✅ حذف شد');
    load();
  });

  const saveStore = (row) => run('st' + row.id, async () => {
    const { data, error } = await supabase.rpc('admin_update_store_item', { p_id: row.id, p_price_wd: Number(row.price_wd), p_active: row.active });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ آیتم فروشگاه ذخیره شد');
    load();
  });

  const clearSan = (cid) => run('san' + cid, async () => {
    const { data, error } = await supabase.rpc('admin_clear_sanctions', { p_country: cid });
    flash(error ? '❌ ' + error.message : data?.ok === false ? '❌ ' + data.error : '✅ تحریم‌ها لغو شد');
    load();
  });

  const setCat = (key, field, val) => setCatalog(catalog.map((r) => (r.key === key ? { ...r, [field]: val } : r)));
  const setSt = (id, field, val) => setStoreItems(storeItems.map((r) => (r.id === id ? { ...r, [field]: val } : r)));

  return (
    <div className="space-y-6">
      {notice && <div className={cn('border border-cyan-400/40 bg-slate-950/95 px-4 py-2 text-xs text-white', CLIP_SM)}>{notice}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* تنظیمات جنگ */}
        <div className={cn('border border-red-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
          <p className="mb-3 text-sm font-black text-white">⚔️ تنظیمات جنگ و تورنومنت</p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} className={cn(inputCls, 'w-20')} />
            <span className="text-[10px] text-slate-500">روز بین جام‌ها</span>
            <button onClick={saveSettings} disabled={busy === 'set'} className={btnCls}>ذخیره + زمان‌بندی</button>
            <button onClick={startCup} disabled={busy === 'cup'} className={cn(ghostBtn, 'border-red-400/40 bg-red-400/10 text-red-300')}>🏆 شروع فوری جام</button>
          </div>
          {settings?.next_tournament_at && <p className="mt-2 text-[10px] text-slate-500">جام بعدی: {new Date(settings.next_tournament_at).toLocaleString('fa-IR')}</p>}
        </div>

        {/* AI — نسخه تمیز */}
        <div className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
          <p className="mb-3 text-sm font-black text-white">🤖 هوش مصنوعی تحلیل جنگ</p>
          <div className="space-y-2">
            <select value={ai.provider} onChange={(e) => setAi({ ...ai, provider: e.target.value })} className={inputCls} style={{ colorScheme: 'dark' }}>
              <option value="local">⚙️ موتور داخلی (بدون کلید — همیشه کار می‌کند)</option>
                            <option value="deepseek">🐋 DeepSeek (ارزان)</option>
                            <option value="zai">ⓩ Z.AI / GLM (رایگان ✅)</option>
                            <option value="bazaarlink">🛒 BazaarLink (ایران + بدون فیلتر ✅)</option>
              <option value="grok">🚀 Grok / xAI</option>
              <option value="openai">💬 ChatGPT / OpenAI (نیاز به شارژ)</option>
              <option value="gemini">💎 Gemini (نیاز به فیلترشکن)</option>
              <option value="qwen">🌀 Qwen (کلید معتبر DashScope)</option>
            </select>
            <input type="password" value={ai.api_key} onChange={(e) => setAi({ ...ai, api_key: e.target.value })} placeholder="API Key (برای موتور داخلی خالی بماند)" className={inputCls} />
            <input value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} placeholder="مدل (اختیاری — خالی = پیش‌فرض)" className={inputCls} />
            <div className="flex flex-wrap gap-2">
              <button onClick={saveAI} disabled={busy === 'ai'} className={btnCls}>ذخیره AI</button>
              <button onClick={testAI} disabled={busy === 'aitest'} className={ghostBtn}>🧪 تست اتصال AI</button>
            </div>
            <p className="text-[9px] leading-4 text-slate-500">اگر AI وصل نشود، بازی خودکار با موتور داخلی ادامه می‌دهد — هیچ‌وقت نمی‌ایستد.</p>
          </div>
        </div>

        {/* اعطای WD */}
        <div className={cn('border border-emerald-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
          <p className="mb-3 text-sm font-black text-white">💵 اعطای بودجه جنگی (WD)</p>
          <div className="flex flex-wrap gap-2">
            <select value={grantUser} onChange={(e) => setGrantUser(e.target.value)} className={cn(inputCls, 'flex-1')} style={{ colorScheme: 'dark' }}>
              <option value="">انتخاب کاربر...</option>
              {users.map((u) => (<option key={u.id} value={u.id}>{u.username}</option>))}
            </select>
            <input type="number" value={grantAmt} onChange={(e) => setGrantAmt(e.target.value)} className={cn(inputCls, 'w-24')} />
            <button onClick={grant} disabled={busy === 'grant'} className={btnCls}>اعطا</button>
          </div>
        </div>

        {/* تحریم‌ها */}
        <div className={cn('border border-cyan-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
          <p className="mb-3 text-sm font-black text-white">🥶 تحریم‌های فعال</p>
          {sanctions.length === 0 ? <p className="text-xs text-slate-600">تحریمی ثبت نشده</p> : sanctions.map((s) => (
            <div key={s.id} className="mb-2 flex items-center gap-2 text-xs text-slate-300">
              <span>{s.def?.flag} {s.def?.name_fa}</span>
              <span className="text-[9px] text-slate-500">({s.type})</span>
              <button onClick={() => clearSan(s.defender_country)} disabled={busy === 'san' + s.defender_country} className={cn(ghostBtn, 'mr-auto')}>لغو تحریم</button>
            </div>
          ))}
        </div>
      </div>

      {/* کاتالوگ نظامی */}
      <div className={cn('border border-amber-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
        <p className="mb-3 text-sm font-black text-white">🎖 کاتالوگ تجهیزات نظامی (ویرایش قیمت/قدرت)</p>
        <div className="grid gap-2 md:grid-cols-2">
          {catalog.map((r) => (
            <div key={r.key} className="flex flex-wrap items-center gap-2 border border-white/10 bg-white/5 p-2">
              <span className="text-lg">{r.icon}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">{r.name}</span>
              <input type="number" value={r.power} onChange={(e) => setCat(r.key, 'power', e.target.value)} title="قدرت" className={cn(inputCls, 'w-16')} />
              <input type="number" value={r.cost_wd} onChange={(e) => setCat(r.key, 'cost_wd', e.target.value)} title="قیمت WD" className={cn(inputCls, 'w-20')} />
              <button onClick={() => saveCat(r)} disabled={busy === 'cat' + r.key} className={btnCls}>ذخیره</button>
              <button onClick={() => delCat(r.key)} disabled={busy === 'catdel' + r.key} className={cn(ghostBtn, 'text-red-400')}>🗑</button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <input value={newItem.key} onChange={(e) => setNewItem({ ...newItem, key: e.target.value })} placeholder="کلید (انگلیسی)" className={cn(inputCls, 'w-24')} />
          <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="نام" className={cn(inputCls, 'w-32')} />
          <input value={newItem.icon} onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })} placeholder="ایموجی" className={cn(inputCls, 'w-16')} />
          <input type="number" value={newItem.power} onChange={(e) => setNewItem({ ...newItem, power: e.target.value })} className={cn(inputCls, 'w-16')} />
          <input type="number" value={newItem.cost_wd} onChange={(e) => setNewItem({ ...newItem, cost_wd: e.target.value })} className={cn(inputCls, 'w-20')} />
          <button onClick={addCat} disabled={busy === 'catnew'} className={btnCls}>+ افزودن تجهیز</button>
        </div>
      </div>

      {/* فروشگاه */}
      <div className={cn('border border-fuchsia-400/30 bg-[#0a0c08]/85 p-5', CLIP_SM)}>
        <p className="mb-3 text-sm font-black text-white">🛒 فروشگاه (قیمت WD + فعال/غیرفعال)</p>
        <div className="grid gap-2 md:grid-cols-2">
          {storeItems.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 border border-white/10 bg-white/5 p-2">
              <span className="text-lg">{r.icon}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">{r.name}</span>
              <input type="number" value={r.price_wd ?? 0} onChange={(e) => setSt(r.id, 'price_wd', e.target.value)} className={cn(inputCls, 'w-20')} />
              <label className="flex items-center gap-1 text-[9px] text-slate-400">
                <input type="checkbox" checked={!!r.active} onChange={(e) => setSt(r.id, 'active', e.target.checked)} /> فعال
              </label>
              <button onClick={() => saveStore(r)} disabled={busy === 'st' + r.id} className={btnCls}>ذخیره</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}