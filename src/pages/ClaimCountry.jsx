import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as topojson from 'topojson-client';
import { Globe2, CheckCircle2, Landmark, Users, Ruler, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getCountryInfo, CABINET_ROLES, fmtNum, flagFromNumeric } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* منابع تصویر نقشه — با فال‌بک خودکار */
const TILE_SOURCES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
];

/* ✅ رفع باگ خط ۱۸۰ درجه (روسیه، فیجی و...) */
function fixAntimeridian(geo) {
  const fixRing = (ring) => {
    let east = false, west = false;
    for (const pt of ring) {
      if (pt[0] > 140) east = true;
      if (pt[0] < -140) west = true;
    }
    if (!(east && west)) return ring;
    return ring.map((pt) => [pt[0] < 0 ? pt[0] + 360 : pt[0], pt[1]]);
  };
  const fixPoly = (poly) => poly.map(fixRing);
  (geo.features || []).forEach((f) => {
    const g = f.geometry;
    if (!g) return;
    if (g.type === 'Polygon') g.coordinates = fixPoly(g.coordinates);
    else if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map(fixPoly);
  });
  return geo;
}

/* ─────────── ClaimCountry — انتخاب کشور روی نقشه ماهواره‌ای ─────────── */
export default function ClaimCountry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const geoRef = useRef(null);
  const selectedLayerRef = useRef(null);
  const claimedRef = useRef(new Set());
  const [step, setStep] = useState('map');
  const [selected, setSelected] = useState(null);
  const [claimed, setClaimed] = useState(new Set());
  const [cabinet, setCabinet] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [mapError, setMapError] = useState(false);

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

  useEffect(() => { claimedRef.current = claimed; }, [claimed]);

  /* اگر قبلاً کشور گرفته → داشبورد */
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('player_countries').select('id').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) navigate('/country', { replace: true });
    });
    supabase.from('player_countries').select('country_key').then(({ data }) => {
      setClaimed(new Set((data || []).map((r) => String(r.country_key))));
    });
  }, [user?.id, navigate]);

  /* رنگ کشورهای تصرف‌شده */
  useEffect(() => {
    if (!geoRef.current) return;
    geoRef.current.eachLayer((layer) => {
      const key = String(layer.feature?.id);
      if (claimed.has(key)) {
        layer.setStyle({ color: 'rgba(239,68,68,0.7)', weight: 1, fillColor: '#ef4444', fillOpacity: 0.25 });
      }
    });
  }, [claimed]);

  /* ساخت نقشه + فال‌بک تصویر + محافظ StrictMode */
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    let disposed = false;

    const map = L.map(mapElRef.current, { attributionControl: false, zoomControl: true, worldCopyJump: true }).setView([32, 53], 4);
    mapRef.current = map;

    /* لایه تصویر با فال‌بک خودکار */
    let si = 0;
    let fails = 0;
    let tiles = L.tileLayer(TILE_SOURCES[0], { maxZoom: 12 }).addTo(map);
    tiles.on('tileerror', () => {
      fails++;
      if (!disposed && fails > 2 && si < TILE_SOURCES.length - 1) {
        si++;
        fails = 0;
        try { map.removeLayer(tiles); } catch {}
        tiles = L.tileLayer(TILE_SOURCES[si], { maxZoom: 12 }).addTo(map);
      }
    });

    /* مرزهای کشورها */
    (async () => {
      let topo = null;
      const urls = [
        'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json',
        'https://unpkg.com/world-atlas@2.0.2/countries-110m.json',
      ];
      for (const u of urls) {
        try { const r = await fetch(u); if (r.ok) { topo = await r.json(); break; } } catch {}
      }
      if (disposed) return; // ✅ نقشه حذف شده — ادامه نده
      if (!topo) { setMapError(true); return; }
      const geo = topojson.feature(topo, topo.objects.countries);
      fixAntimeridian(geo); // ✅ بدون خط‌های افقی دور کره
      geoRef.current = L.geoJSON(geo, {
        style: () => ({ color: 'rgba(34,211,238,0.35)', weight: 0.7, fillColor: '#22d3ee', fillOpacity: 0.04 }),
        onEachFeature: (feature, layer) => {
          layer.on('click', () => {
            const key = String(feature.id);
            if (claimedRef.current.has(key)) { flash('❌ این کشور قبلاً توسط بازیکن دیگری تصرف شده است'); return; }
            const info = getCountryInfo(feature.properties.name);
            setSelected({
              key,
              nameEn: feature.properties.name,
              info,
              flag: info?.flag || flagFromNumeric(feature.id) || '🌐',
            });
            if (selectedLayerRef.current) geoRef.current.resetStyle(selectedLayerRef.current);
            selectedLayerRef.current = layer;
            layer.setStyle({ color: '#22d3ee', weight: 2.5, fillColor: '#22d3ee', fillOpacity: 0.28 });
            try { layer.bringToFront(); } catch {}
          });
        },
      }).addTo(map);
    })();

    return () => {
      disposed = true;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* تأیید نهایی: تصرف کشور + کابینه */
  const confirmClaim = async () => {
    if (!selected) return;
    setBusy(true);
    const cab = Object.entries(cabinet).filter(([, n]) => n?.trim()).map(([role, name]) => ({ role, name: name.trim() }));
    const meta = {
      fa: selected.info?.fa || null,
      capital: selected.info?.capital || null,
      pop: selected.info?.pop ? String(selected.info.pop) : null,
      area: selected.info?.area ? String(selected.info.area) : null,
      flag: selected.flag || null,
    };
    const { data, error } = await supabase.rpc('claim_country', {
      p_country_key: selected.key,
      p_name_en: selected.nameEn,
      p_meta: meta,
      p_cabinet: cab,
    });
    setBusy(false);
    if (error) return flash('❌ ' + error.message);
    if (data && data.ok === false) return flash('❌ ' + data.error);
    flash('✅ کشور تو ثبت شد!');
    navigate('/country');
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-24">
      <style>{`
        @keyframes gridFloor { to { background-position: 0 44px; } }
        @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes glitch {
          0%, 91%, 100% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
          92% { text-shadow: -2px 0 #e879f9, 2px 0 #22d3ee; transform: translateX(1px); }
          94% { text-shadow: 2px 0 #e879f9, -2px 0 #22d3ee; transform: translateX(-1px); }
          96% { text-shadow: 0 0 26px rgba(34,211,238,.45); transform: none; }
        }
        .leaflet-container { background: #05070f !important; }
      `}</style>

      {/* صحنه */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-x-0 bottom-0 h-[42vh]"
          style={{ maskImage: 'linear-gradient(to top, black 15%, transparent 92%)', WebkitMaskImage: 'linear-gradient(to top, black 15%, transparent 92%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: 'linear-gradient(rgba(34,211,238,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.5) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(700px) rotateX(56deg) scale(1.25)',
              transformOrigin: 'bottom',
              animation: 'gridFloor 2.2s linear infinite',
            }}
          />
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {notice && (
          <div className="pointer-events-none fixed left-0 right-0 top-24 z-[70] flex justify-center px-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={cn('border bg-slate-950/95 px-5 py-2.5 text-sm text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]', CLIP_SM)}>
              {notice}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-7xl">
        {/* هدر HUD */}
        <div className="mb-6 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[9px] uppercase tracking-[0.35em] text-cyan-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" style={{ animation: 'blinkDot 1.6s infinite' }} />
            World Domination // Step {step === 'map' ? '۱' : '۲'}
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-white md:text-5xl" style={{ animation: 'glitch 4s infinite' }}>
            {step === 'map' ? (
              <>کشورت را <span className="text-gradient">تصرف کن</span></>
            ) : (
              <>کابینه‌ات را <span className="text-gradient">بچین</span></>
            )}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {step === 'map' ? 'روی نقشه ماهواره‌ای کلیک کن و کشورت را انتخاب کن — هر کشور فقط یک بار!' : 'وزرای دولتت را معرفی کن (اختیاری) و وارد داشبورد شو'}
          </p>
        </div>

        {step === 'map' ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* نقشه */}
            <div className={cn('relative overflow-hidden border border-cyan-400/30 bg-black/60 lg:col-span-2', CLIP)}>
              <span className="pointer-events-none absolute left-2 top-2 z-[500] h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
              <span className="pointer-events-none absolute bottom-2 right-2 z-[500] h-4 w-4 border-b-2 border-r-2 border-fuchsia-400/60" />
              <div ref={mapElRef} className="h-[62vh] w-full" />
              {mapError && (
                <div className="absolute inset-0 z-[600] grid place-items-center bg-black/80">
                  <p className="text-sm text-red-400">🛰 بارگذاری نقشه ممکن نشد — اینترنت/فیلترشکن را بررسی کن و رفرش بزن</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-[500] flex gap-2">
                <span className={cn('border border-cyan-400/40 bg-black/70 px-2 py-1 text-[9px] font-bold text-cyan-300 backdrop-blur', CLIP_SM)}>آزاد</span>
                <span className={cn('border border-red-400/40 bg-black/70 px-2 py-1 text-[9px] font-bold text-red-400 backdrop-blur', CLIP_SM)}>تصرف‌شده</span>
              </div>
            </div>

            {/* پنل مشخصات کشور */}
            <div>
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div key={selected.key} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={cn('relative border border-cyan-400/30 bg-[#070b18]/90 p-6 backdrop-blur-xl', CLIP)}>
                    <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-cyan-400/60" />
                    <p className="text-4xl">{selected.flag || '🌐'}</p>
                    <h2 className="mt-2 font-display text-2xl font-black text-white">{selected.info?.fa || selected.nameEn}</h2>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{selected.nameEn}</p>

                    <div className="mt-4 space-y-2.5">
                      <p className={cn('flex items-center gap-2 border border-white/5 bg-white/5 p-2.5 text-xs text-slate-300', CLIP_SM)}>
                        <Landmark size={13} className="text-cyan-300" /> پایتخت: {selected.info?.capital || '—'}
                      </p>
                      <p className={cn('flex items-center gap-2 border border-white/5 bg-white/5 p-2.5 text-xs text-slate-300', CLIP_SM)}>
                        <Users size={13} className="text-fuchsia-300" /> جمعیت: {selected.info ? fmtNum(selected.info.pop) : '—'}
                      </p>
                      <p className={cn('flex items-center gap-2 border border-white/5 bg-white/5 p-2.5 text-xs text-slate-300', CLIP_SM)}>
                        <Ruler size={13} className="text-amber-300" /> مساحت: {selected.info ? fmtNum(selected.info.area) + ' km²' : '—'}
                      </p>
                      <p className={cn('flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 p-2.5 text-xs font-bold text-emerald-300', CLIP_SM)}>
                        <ShieldCheck size={13} /> وضعیت: آزاد و قابل تصرف
                      </p>
                    </div>

                    <button
                      onClick={() => setStep('cabinet')}
                      className={cn('mt-5 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]', CLIP_SM)}
                    >
                      <MapPin size={14} /> انتخاب این کشور
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('grid h-full min-h-[300px] place-items-center border border-white/10 bg-[#070b18]/80 p-8 text-center backdrop-blur-xl', CLIP)}>
                    <div>
                      <Globe2 className="mx-auto h-12 w-12 text-cyan-400/60" />
                      <p className="mt-3 text-sm text-slate-400">روی یک کشور کلیک کن تا مشخصاتش را ببینی</p>
                      <p className="mt-1 text-[10px] text-slate-600">قرمز = تصرف‌شده • فیروزه‌ای = آزاد</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* ─────────── مرحله ۲: کابینه ─────────── */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
            <div className={cn('relative border border-fuchsia-400/30 bg-[#070b18]/90 p-6 backdrop-blur-xl', CLIP)}>
              <span className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-fuchsia-400/60" />
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
                <p className="flex items-center gap-2 font-display text-sm font-black text-white">
                  {selected?.flag || '🌐'} کشور {selected?.info?.fa || selected?.nameEn}
                </p>
                <button onClick={() => setStep('map')} className={cn('flex items-center gap-1 border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-400 transition hover:text-white', CLIP_SM)}>
                  <ArrowRight size={11} /> بازگشت به نقشه
                </button>
              </div>

              <p className="mb-4 text-xs text-slate-500">اعضای کابینه‌ات را معرفی کن (اختیاری — بعداً هم می‌توانی تغییر دهی):</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {CABINET_ROLES.map((role) => (
                  <div key={role}>
                    <label className="mb-1 block font-display text-[9px] uppercase tracking-[0.25em] text-slate-500">{role}</label>
                    <input
                      value={cabinet[role] || ''}
                      onChange={(e) => setCabinet({ ...cabinet, [role]: e.target.value })}
                      placeholder="نام وزیر..."
                      className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-fuchsia-400/50"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={confirmClaim}
                disabled={busy}
                className={cn('mt-6 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-400 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_26px_rgba(232,121,249,0.4)] transition-all hover:shadow-[0_0_40px_rgba(232,121,249,0.6)] disabled:opacity-50', CLIP_SM)}
              >
                {busy ? '⏳ در حال تصرف کشور...' : (<><CheckCircle2 size={14} /> تأیید و ورود به داشبورد کشور</>)}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}