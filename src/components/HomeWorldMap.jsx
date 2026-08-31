import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as topojson from 'topojson-client';
import { Globe, Crown, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toFa } from '../data/countries';
import { cn } from '../utils/cn';

const CLIP = '[clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]';
const CLIP_SM = '[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]';

/* منابع تصویر ماهواره‌ای — با فال‌بک خودکار (مثل صفحه Claim) */
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

/* ─────────── HomeWorldMap — نقشه ماهواره‌ای تصرف جهانی (صفحه اول) ─────────── */
export default function HomeWorldMap() {
  const navigate = useNavigate();
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const geoRef = useRef(null);
  const claimedRef = useRef({});
  const [claimedCount, setClaimedCount] = useState(0);
  const [mapError, setMapError] = useState(false);

  /* استایل + تولتیپ کشورهای تصرف‌شده */
  const paintClaimed = () => {
    if (!geoRef.current) return;
    geoRef.current.eachLayer((layer) => {
      const key = String(layer.feature?.id);
      const info = claimedRef.current[key];
      if (info) {
        layer.setStyle({ color: 'rgba(239,68,68,0.85)', weight: 1.4, fillColor: '#ef4444', fillOpacity: 0.32 });
        try { layer.bringToFront(); } catch (e) {}
        layer.bindTooltip(
          `<div style="text-align:center;font-family:inherit"><b style="font-size:12px">${info.flag} ${info.name}</b><br/><span style="color:#fbbf24;font-size:10px">👑 ${info.owner}</span></div>`,
          { sticky: true, direction: 'top', className: 'hwm-tip', opacity: 1 }
        );
      }
    });
  };

  /* بارگذاری کشورهای تصرف‌شده */
  useEffect(() => {
    let alive = true;
    (async () => {
      const [cR, pR] = await Promise.all([
        supabase.from('player_countries').select('country_key, name_fa, name_en, flag, user_id'),
        supabase.from('profiles').select('id, username').limit(1000),
      ]);
      if (!alive) return;
      const un = {};
      (pR.data || []).forEach((p) => { un[p.id] = p.username; });
      const map = {};
      (cR.data || []).forEach((c) => {
        map[String(c.country_key)] = { name: c.name_fa || c.name_en, flag: c.flag || '🌐', owner: un[c.user_id] || 'فرمانده ناشناس' };
      });
      claimedRef.current = map;
      setClaimedCount(Object.keys(map).length);
      paintClaimed();
    })();
    return () => { alive = false; };
    // eslint-disable-next-line
  }, []);

  /* ساخت نقشه ماهواره‌ای (دقیقاً مثل Claim) */
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    let disposed = false;
    const map = L.map(mapElRef.current, { attributionControl: false, zoomControl: true, scrollWheelZoom: false, worldCopyJump: true }).setView([30, 40], 2);
    mapRef.current = map;
    let si = 0; let fails = 0;
    let tiles = L.tileLayer(TILE_SOURCES[0], { maxZoom: 10 }).addTo(map);
    tiles.on('tileerror', () => {
      fails++;
      if (!disposed && fails > 2 && si < TILE_SOURCES.length - 1) {
        si++; fails = 0;
        try { map.removeLayer(tiles); } catch (e) {}
        tiles = L.tileLayer(TILE_SOURCES[si], { maxZoom: 10 }).addTo(map);
      }
    });
    (async () => {
      let topo = null;
      const urls = [
        'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json',
        'https://unpkg.com/world-atlas@2.0.2/countries-110m.json',
      ];
      for (const u of urls) {
        try { const r = await fetch(u); if (r.ok) { topo = await r.json(); break; } } catch (e) {}
      }
      if (disposed) return;
      if (!topo) { setMapError(true); return; }
      const geo = topojson.feature(topo, topo.objects.countries);
      fixAntimeridian(geo);
      geoRef.current = L.geoJSON(geo, {
        style: (f) => claimedRef.current[String(f?.id)]
          ? { color: 'rgba(239,68,68,0.85)', weight: 1.4, fillColor: '#ef4444', fillOpacity: 0.32 }
          : { color: 'rgba(34,211,238,0.35)', weight: 0.7, fillColor: '#22d3ee', fillOpacity: 0.04 },
      }).addTo(map);
      paintClaimed();
    })();
    return () => { disposed = true; try { map.remove(); } catch (e) {} mapRef.current = null; geoRef.current = null; };
    // eslint-disable-next-line
  }, []);

  return (
    <section className="relative mt-16">
      <style>{`
        .hwm-tip { background: rgba(5,10,18,.95) !important; color: #fff !important; border: 1px solid rgba(239,68,68,.5) !important; border-radius: 8px !important; box-shadow: 0 0 20px rgba(239,68,68,.35) !important; padding: 6px 10px !important; }
        .hwm-tip::before { display: none; }
        .leaflet-container { background: #05070f !important; }
        @keyframes hwmScan { 0% { left: -10%; } 100% { left: 110%; } }
      `}</style>

      {/* تیتر */}
      <div className="mb-8 text-center">
        <p className="mb-2 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.4em] text-cyan-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" /> GLOBAL OCCUPATION // LIVE SATELLITE
        </p>
        <h2 className="font-display text-3xl font-black text-white md:text-5xl">
          نقشه <span className="text-gradient">تصرف جهانی</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-slate-400">
          کشورهای انتخاب‌شده توسط فرماندهان آرنا — قرمز یعنی تصرف‌شده، فیروزه‌ای یعنی منتظر تو!
        </p>
      </div>

      {/* نقشه */}
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className={cn('relative overflow-hidden border border-cyan-400/30 bg-black/60 shadow-[0_0_60px_rgba(34,211,238,0.12)]', CLIP)}>
        <span className="pointer-events-none absolute left-2 top-2 z-[500] h-5 w-5 border-l-2 border-t-2 border-cyan-400/60" />
        <span className="pointer-events-none absolute right-2 top-2 z-[500] h-5 w-5 border-r-2 border-t-2 border-cyan-400/60" />
        <span className="pointer-events-none absolute bottom-2 left-2 z-[500] h-5 w-5 border-b-2 border-l-2 border-cyan-400/60" />
        <span className="pointer-events-none absolute bottom-2 right-2 z-[500] h-5 w-5 border-b-2 border-r-2 border-fuchsia-400/60" />
        <div ref={mapElRef} className="h-[64vh] w-full" />
        {/* اسکن ماهواره‌ای */}
        <div className="pointer-events-none absolute bottom-0 top-0 z-[450] w-20 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" style={{ animation: 'hwmScan 7s linear infinite' }} />
        {/* راهنما */}
        <div className="absolute bottom-3 left-3 z-[500] flex gap-2">
          <span className={cn('border border-cyan-400/40 bg-black/70 px-2 py-1 text-[9px] font-bold text-cyan-300 backdrop-blur', CLIP_SM)}>فیروزه‌ای = آزاد</span>
          <span className={cn('border border-red-400/40 bg-black/70 px-2 py-1 text-[9px] font-bold text-red-400 backdrop-blur', CLIP_SM)}>قرمز = تصرف‌شده</span>
        </div>
        {/* آمار */}
        <div className={cn('absolute right-3 top-3 z-[500] flex items-center gap-2 border border-amber-400/40 bg-black/75 px-3 py-1.5 text-[10px] font-black text-amber-300 backdrop-blur', CLIP_SM)}>
          <Crown size={11} /> کشورهای تصرف‌شده: {toFa(claimedCount)}
        </div>
        {mapError && (
          <div className="absolute inset-0 z-[600] grid place-items-center bg-black/85">
            <p className="px-6 text-center text-sm text-red-400">🛰 بارگذاری نقشه ممکن نشد — اینترنت/فیلترشکن را بررسی کن و رفرش بزن</p>
          </div>
        )}
      </motion.div>

      {/* CTA */}
      <div className="mt-6 text-center">
        <button onClick={() => navigate('/claim')} className={cn('inline-flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-8 py-3.5 font-display text-xs font-black uppercase tracking-[0.25em] text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_50px_rgba(34,211,238,0.6)]', CLIP_SM)}>
          <MapPin size={14} /> کشور خودت را تصرف کن
        </button>
      </div>
    </section>
  );
}