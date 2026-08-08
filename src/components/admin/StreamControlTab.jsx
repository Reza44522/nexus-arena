import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useStreamSettings } from '../../hooks/useStreamSettings';
import { formatNumber } from '../../utils/format';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import NeonButton from '../ui/NeonButton';

export default function StreamControlTab() {
  const { user } = useAuth();
  const { settings, loading, updateSettings } = useStreamSettings();
  const [form, setForm] = useState({ title: '', streamer_name: '', aparat_url: '' });
  const [viewers, setViewers] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // اگه ردیف تنظیمات وجود نداره، بسازش
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('stream_settings').select('id').eq('id', 1).maybeSingle();
      if (!data) {
        await supabase.from('stream_settings').insert({
          id: 1, is_live: false, title: 'NexusArena Live', streamer_name: 'MafiaGANG', aparat_url: '',
        });
      }
    })();
  }, []);

  // سینک فرم با تنظیمات
  useEffect(() => {
    if (settings) {
      setForm({
        title: settings.title || '',
        streamer_name: settings.streamer_name || '',
        aparat_url: settings.aparat_url || '',
      });
    }
  }, [settings]);

  // بینندگان واقعی (همون کانال Presence صفحه استریم)
  useEffect(() => {
    const channel = supabase.channel('stream-viewers', {
      config: { presence: { key: 'admin-' + user?.id } },
    });
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setViewers(Object.values(state).flat().length);
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ role: 'admin' });
    });
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const toggleLive = async (isLive) => {
    setBusy(true);
    const res = await updateSettings({ is_live: isLive, updated_by: user?.id });
    flash(res.ok ? (isLive ? '✅ استریم برای همه آنلاین شد' : '⏻ استریم برای همه آفلاین شد') : '❌ ' + res.error);
    setBusy(false);
  };

  const saveSettings = async () => {
    setBusy(true);
    const res = await updateSettings({ ...form, updated_by: user?.id });
    flash(res.ok ? '✅ تنظیمات ذخیره شد' : '❌ ' + res.error);
    setBusy(false);
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white">🎛 کنترل استریم</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          👁 <b className="text-cyan-300">{formatNumber(viewers)}</b> بیننده واقعی الان
        </span>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* وضعیت پخش */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Badge color={settings?.is_live ? 'red' : 'slate'}>{settings?.is_live ? 'LIVE' : 'OFFLINE'}</Badge>
            <p className="text-sm text-slate-300">
              {settings?.is_live ? 'استریم الان برای همه کاربران در حال پخش است' : 'استریم الان برای همه کاربران آفلاین است'}
            </p>
            <div className="mr-auto flex gap-2">
              <NeonButton size="sm" disabled={busy || settings?.is_live === true} onClick={() => toggleLive(true)}>
                ▶ آنلاین کن
              </NeonButton>
              <NeonButton size="sm" variant="ghost" disabled={busy || settings?.is_live === false} onClick={() => toggleLive(false)}>
                ⏻ آفلاین کن
              </NeonButton>
            </div>
          </div>

          {/* تنظیمات */}
          <div>
            <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">عنوان استریم</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">نام استریمر</label>
            <input
              value={form.streamer_name}
              onChange={(e) => setForm({ ...form, streamer_name: e.target.value })}
              className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">
              لینک پخش آپارات (embed یا لینک معمولی /v/...)
            </label>
            <input
              value={form.aparat_url}
              onChange={(e) => setForm({ ...form, aparat_url: e.target.value })}
              placeholder="https://www.aparat.com/embed/..."
              className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>

          <NeonButton className="w-full" disabled={busy} onClick={saveSettings}>💾 ذخیره تنظیمات</NeonButton>

          {msg && <p className="text-center text-sm text-cyan-300">{msg}</p>}
        </div>
      )}
    </GlassCard>
  );
}