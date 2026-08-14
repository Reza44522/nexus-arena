import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins, ShoppingBag, Backpack, Check, Gamepad2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

/* گوشه‌های بریده‌شده سایبری */
const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

const TYPE_LABEL = {
  frame: { label: 'قاب آواتار', cls: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' },
  title: { label: 'تایتل', cls: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300' },
  badge: { label: 'بج', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  theme: { label: 'تم چت', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
};

/* ─────────── Store v7 — NEXUS ARMORY ─────────── */
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

  /* آپدیت زنده سکه و کوله */
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
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scanY { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(251,191,36,.45); transform: none; }
          92% { text-shadow: -2px 0 #22d3ee, 2px 0 #fbbf24; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #22d3ee, -2px 0 #fbbf24; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(251,191,36,.45); transform: none; }
        }
      `}</style>

      {/* ─────────── صحنه ─────────── */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-x-0 bottom-0 h-[42vh]"
          style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: 'linear-gradient(rgba(251,191,36,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
        </div>
        <div className="absolute -top-40 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[130px]" />
      </div>

      {/* Toast */}
      {notice && (
        <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(251,191,36,0.3)]', CLIP_SM)}
          >
            {notice}
          </motion.div>
        </div>
      )}

      <div className="relative mx-auto max-w-6xl">
        {/* ─────────── هدر HUD ─────────── */}
        <div className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-amber-400/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            Store // Armory
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            NEXUS <span className="text-gradient-gold">ARMORY</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500">با برد در مسابقه‌ها سکه بگیر و آیتم‌های خاص بخر!</p>
        </div>

        {/* ─────────── موجودی سکه ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('relative mb-8 flex flex-wrap items-center gap-4 border border-amber-400/30 bg-[#070b18]/85 p-5 backdrop-blur-xl', CLIP)}
        >
          <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-amber-400/60" />
          <span className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400/60" />
          <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" style={{ animation: 'scanY 5s linear infinite' }} />

          <div className="relative">
            <span className="absolute inset-0 rounded-xl bg-amber-400/30 blur-[10px]" />
            <div className={cn('relative grid h-14 w-14 place-items-center bg-gradient-to-br from-amber-300 to-yellow-600 text-2xl shadow-lg', CLIP_SM)}>
              🪙
            </div>
          </div>
          <div className="flex-1">
            <p className="font-display text-2xl font-black text-amber-300">{Number(coins).toLocaleString('fa-IR')} سکه</p>
            <p className="text-xs text-slate-400">برد = ۲۰ 🪙 • مساوی = ۸ 🪙 • باخت = ۵ 🪙</p>
          </div>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className={cn('flex items-center gap-2 border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20 hover:shadow-[0_0_18px_rgba(34,211,238,0.35)]', CLIP_SM)}
          >
            <Gamepad2 size={14} /> برو مسابقه بده!
          </button>
        </motion.div>

        {/* ─────────── تب‌ها ─────────── */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setTab('shop')}
            className={cn(
              'flex items-center gap-2 border px-6 py-3 font-display text-xs font-bold uppercase tracking-wider transition-all',
              CLIP_SM,
              tab === 'shop'
                ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
            )}
          >
            <ShoppingBag size={14} /> فروشگاه
          </button>
          <button
            onClick={() => setTab('inv')}
            className={cn(
              'flex items-center gap-2 border px-6 py-3 font-display text-xs font-bold uppercase tracking-wider transition-all',
              CLIP_SM,
              tab === 'inv'
                ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_20px_rgba(232,121,249,0.3)]'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white'
            )}
          >
            <Backpack size={14} /> کوله‌پشتی من
            {inventory.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-fuchsia-500/20 px-1.5 text-[10px] font-bold text-fuchsia-300">
                {inventory.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative h-56 overflow-hidden rounded-md bg-white/5">
                <span className="absolute inset-0" style={{ animation: 'shimmer 1.4s infinite', background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.12), transparent)' }} />
              </div>
            ))}
          </div>
        ) : tab === 'shop' ? (
          /* ─────────── فروشگاه ─────────── */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => {
              const owned = ownedIds.has(item.id);
              const canBuy = coins >= item.price;
              const t = TYPE_LABEL[item.type] || TYPE_LABEL.badge;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  className={cn('group relative flex flex-col border border-white/10 bg-[#070b18]/85 p-5 text-center backdrop-blur-xl transition-colors hover:border-amber-400/40 hover:shadow-[0_0_35px_rgba(251,191,36,0.15)]', CLIP)}
                >
                  <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-amber-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-cyan-400/40 opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative mx-auto">
                    <span className="absolute inset-0 rounded-xl bg-white/10 blur-[12px]" />
                    <div className={cn('relative grid h-16 w-16 place-items-center bg-gradient-to-br text-3xl shadow-lg', item.accent, CLIP_SM)}>
                      {item.icon}
                    </div>
                  </div>
                  <p className="mt-3 font-display text-sm font-bold text-white">{item.name}</p>
                  <p className="mt-1 flex-1 text-[11px] leading-5 text-slate-400">{item.description}</p>
                  <div className="mt-2">
                    <span className={cn('border px-2 py-0.5 text-[9px] font-bold', CLIP_SM, t.cls)}>{t.label}</span>
                  </div>
                  <p className="mt-3 font-display text-lg font-black text-amber-300">🪙 {Number(item.price).toLocaleString('fa-IR')}</p>
                  <div className="mt-3">
                    {owned ? (
                      <button
                        onClick={() => setTab('inv')}
                        className={cn('flex w-full items-center justify-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20', CLIP_SM)}
                      >
                        <Check size={13} /> خریداری شد
                      </button>
                    ) : (
                      <button
                        disabled={busy === item.id || !canBuy}
                        onClick={() => buy(item)}
                        className={cn(
                          'w-full py-2 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40',
                          CLIP_SM,
                          canBuy
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.35)] hover:shadow-[0_0_28px_rgba(251,191,36,0.55)]'
                            : 'border border-white/10 bg-white/5 text-slate-500'
                        )}
                      >
                        {busy === item.id ? '⏳ ...' : canBuy ? '🛒 خرید' : '🔒 سکه کافی نیست'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : /* ─────────── کوله‌پشتی ─────────── */
        inventory.length === 0 ? (
          <div className={cn('border border-white/10 bg-[#070b18]/80 p-14 text-center text-slate-400', CLIP)}>
            🎒 کوله‌ات خالیه! از فروشگاه خرید کن.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {inventory.map((v, i) => {
              const item = v.item;
              if (!item) return null;
              const t = TYPE_LABEL[item.type] || TYPE_LABEL.badge;
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  className={cn(
                    'relative flex flex-col border bg-[#070b18]/85 p-5 text-center backdrop-blur-xl',
                    CLIP,
                    v.is_equipped ? 'border-emerald-400/50 shadow-[0_0_35px_rgba(74,222,128,0.2)]' : 'border-white/10'
                  )}
                >
                  {v.is_equipped && (
                    <span className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
                  )}
                  <div className={cn('mx-auto grid h-16 w-16 place-items-center bg-gradient-to-br text-3xl shadow-lg', item.accent, CLIP_SM)}>
                    {item.icon}
                  </div>
                  <p className="mt-3 font-display text-sm font-bold text-white">{item.name}</p>
                  <div className="mt-2">
                    <span className={cn('border px-2 py-0.5 text-[9px] font-bold', CLIP_SM, t.cls)}>{t.label}</span>
                  </div>
                  <div className="mt-3">
                    {v.is_equipped ? (
                      <span className={cn('inline-flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300', CLIP_SM)}>
                        <Check size={13} /> فعال
                      </span>
                    ) : (
                      <button
                        disabled={busy === item.id}
                        onClick={() => equip(item)}
                        className={cn('w-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.35)] transition-all hover:shadow-[0_0_28px_rgba(34,211,238,0.55)] disabled:opacity-40', CLIP_SM)}
                      >
                        فعال‌سازی
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}