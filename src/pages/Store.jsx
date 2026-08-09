import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins, ShoppingBag, Backpack, Check } from 'lucide-react';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import NeonButton from '../components/ui/NeonButton';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const TYPE_LABEL = {
  frame: { label: 'قاب آواتار', color: 'cyan' },
  title: { label: 'تایتل', color: 'magenta' },
  badge: { label: 'بج', color: 'amber' },
  theme: { label: 'تم چت', color: 'green' },
};

export default function Store() {
  const { user } = useAuth();
  const [tab, setTab] = useState('shop');
  const [coins, setCoins] = useState(0);
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');

  const flash = (m) => {
    setNotice(m);
    setTimeout(() => setNotice(''), 3000);
  };

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [profRes, itemsRes, invRes] = await Promise.all([
      supabase.from('profiles').select('coins').eq('id', user.id).single(),
      supabase.from('store_items').select('*').eq('active', true).order('price', { ascending: true }),
      supabase.from('user_inventory').select('*, item:store_items(*)').eq('user_id', user.id),
    ]);
    setCoins(profRes.data?.coins ?? 0);
    setItems(itemsRes.data || []);
    setInventory(invRes.data || []);
    setLoading(false);
  }, [user?.id]);

  // آپدیت زنده سکه و کوله
  useEffect(() => {
    load();
    const ch = supabase
      .channel('store-' + user?.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_inventory', filter: `user_id=eq.${user?.id}` }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load, user?.id]);

  const ownedIds = new Set(inventory.map((v) => v.item_id));

  const buy = async (item) => {
    setBusy(item.id);
    const { data, error } = await supabase.rpc('buy_item', { p_item_id: item.id });
    if (error) flash('❌ ' + error.message);
    else if (data && data.ok === false) flash('❌ ' + data.error);
    else flash(`✅ «${item.name}» خریداری شد! 🎉`);
    setBusy(null);
    load();
  };

  const equip = async (item) => {
    setBusy(item.id);
    const { data, error } = await supabase.rpc('equip_item', { p_item_id: item.id });
    if (error) flash('❌ ' + error.message);
    else if (data && data.ok === false) flash('❌ ' + data.error);
    else flash(`✅ «${item.name}» فعال شد!`);
    setBusy(null);
    load();
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          tag="Store"
          title="فروشگاه NexusArena"
          subtitle="با برد در مسابقه‌ها سکه بگیر و آیتم‌های خاص بخر!"
        />

        {/* پیام */}
        {notice && (
          <div className="glass-strong mb-6 rounded-xl border border-cyan-400/30 px-5 py-2.5 text-center text-sm text-white shadow-glow-cyan">
            {notice}
          </div>
        )}

        {/* موجودی سکه */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-amber-400/30 p-5 shadow-[0_0_30px_rgba(251,191,36,0.15)]"
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-600 text-2xl shadow-lg">
            🪙
          </div>
          <div className="flex-1">
            <p className="font-display text-2xl font-black text-amber-300">{coins} سکه</p>
            <p className="text-xs text-slate-400">برد = ۲۰ 🪙 • مساوی = ۸ 🪙 • باخت = ۵ 🪙</p>
          </div>
          <NeonButton size="sm" variant="ghost" onClick={() => (window.location.href = '/dashboard')}>
            🎮 برو مسابقه بده!
          </NeonButton>
        </motion.div>

        {/* تب‌ها */}
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setTab('shop')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-bold transition-all',
              tab === 'shop' ? 'border border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'glass text-slate-400 hover:text-white'
            )}
          >
            <ShoppingBag size={16} /> فروشگاه
          </button>
          <button
            onClick={() => setTab('inv')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-bold transition-all',
              tab === 'inv' ? 'border border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300' : 'glass text-slate-400 hover:text-white'
            )}
          >
            <Backpack size={16} /> کوله‌پشتی من
            {inventory.length > 0 && (
              <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs font-bold text-fuchsia-300">
                {inventory.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        ) : tab === 'shop' ? (
          /* ─────────── فروشگاه ─────────── */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => {
              const owned = ownedIds.has(item.id);
              const canBuy = coins >= item.price;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="glass-strong flex flex-col rounded-2xl border border-white/10 p-5 text-center"
                >
                  <div className={cn('mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-lg', item.accent)}>
                    {item.icon}
                  </div>
                  <p className="mt-3 font-display text-sm font-bold text-white">{item.name}</p>
                  <p className="mt-1 flex-1 text-[11px] text-slate-400">{item.description}</p>
                  <div className="mt-2">
                    <Badge color={TYPE_LABEL[item.type]?.color || 'slate'}>
                      {TYPE_LABEL[item.type]?.label || item.type}
                    </Badge>
                  </div>
                  <p className="mt-3 font-display text-lg font-black text-amber-300">🪙 {item.price}</p>
                  <div className="mt-3">
                    {owned ? (
                      <NeonButton size="sm" variant="ghost" className="w-full" onClick={() => setTab('inv')}>
                        <Check size={14} className="ml-1 inline" /> خریداری شد
                      </NeonButton>
                    ) : (
                      <NeonButton
                        size="sm"
                        className="w-full"
                        disabled={busy === item.id || !canBuy}
                        onClick={() => buy(item)}
                      >
                        {canBuy ? '🛒 خرید' : '🔒 سکه کافی نیست'}
                      </NeonButton>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ─────────── کوله‌پشتی ─────────── */
          inventory.length === 0 ? (
            <GlassCard className="p-12 text-center text-slate-400">
              🎒 کوله‌ات خالیه! از فروشگاه خرید کن.
            </GlassCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {inventory.map((v) => {
                const item = v.item;
                if (!item) return null;
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      'glass-strong flex flex-col rounded-2xl border p-5 text-center',
                      v.is_equipped ? 'border-green-400/50 shadow-[0_0_30px_rgba(74,222,128,0.2)]' : 'border-white/10'
                    )}
                  >
                    <div className={cn('mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-lg', item.accent)}>
                      {item.icon}
                    </div>
                    <p className="mt-3 font-display text-sm font-bold text-white">{item.name}</p>
                    <Badge color={TYPE_LABEL[item.type]?.color || 'slate'}>
                      {TYPE_LABEL[item.type]?.label || item.type}
                    </Badge>
                    <div className="mt-3">
                      {v.is_equipped ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-green-400/40 bg-green-500/10 px-4 py-2 text-xs font-bold text-green-300">
                          <Check size={14} /> فعال
                        </span>
                      ) : (
                        <NeonButton size="sm" className="w-full" disabled={busy === item.id} onClick={() => equip(item)}>
                          فعال‌سازی
                        </NeonButton>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>
    </PageWrapper>
  );
}