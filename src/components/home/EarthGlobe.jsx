import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, RotateCw, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';

const CONTINENTS = [
  { name: 'آسیا', lat: 34, lng: 100, type: 'continent' },
  { name: 'اروپا', lat: 54, lng: 15, type: 'continent' },
  { name: 'آفریقا', lat: 8, lng: 20, type: 'continent' },
  { name: 'آمریکای شمالی', lat: 45, lng: -100, type: 'continent' },
  { name: 'آمریکای جنوبی', lat: -15, lng: -60, type: 'continent' },
  { name: 'اقیانوسیه', lat: -25, lng: 140, type: 'continent' },
  { name: 'جنوبگان', lat: -82, lng: 0, type: 'continent' },
];

const FALLBACK_COUNTRIES = [
  { name: 'Iran', lat: 32.4, lng: 53.7 }, { name: 'United States', lat: 39.8, lng: -98.6 },
  { name: 'China', lat: 35.9, lng: 104.2 }, { name: 'Russia', lat: 61.5, lng: 105.3 },
  { name: 'India', lat: 20.6, lng: 79 }, { name: 'Brazil', lat: -14.2, lng: -51.9 },
  { name: 'Germany', lat: 51.2, lng: 10.4 }, { name: 'France', lat: 46.2, lng: 2.2 },
  { name: 'United Kingdom', lat: 55.4, lng: -3.4 }, { name: 'Japan', lat: 36.2, lng: 138.3 },
  { name: 'Canada', lat: 56.1, lng: -106.3 }, { name: 'Australia', lat: -25.3, lng: 133.8 },
  { name: 'Turkey', lat: 39, lng: 35.2 }, { name: 'Saudi Arabia', lat: 23.9, lng: 45.1 },
  { name: 'Egypt', lat: 26.8, lng: 30.8 }, { name: 'South Korea', lat: 35.9, lng: 127.8 },
];

function centroidOf(geometry) {
  const pts = [];
  const walk = (c) => {
    if (typeof c[0] === 'number') pts.push(c);
    else c.forEach(walk);
  };
  if (geometry?.coordinates) walk(geometry.coordinates);
  if (!pts.length) return [NaN, NaN];
  const step = Math.max(1, Math.floor(pts.length / 40));
  let lat = 0, lng = 0, n = 0;
  for (let i = 0; i < pts.length; i += step) { lng += pts[i][0]; lat += pts[i][1]; n++; }
  return [lng / n, lat / n];
}

export default function EarthGlobe() {
  const globeRef = useRef(null);
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 560 });
  const [ready, setReady] = useState(false);
  const [rotate, setRotate] = useState(true);
  const [labels, setLabels] = useState([...CONTINENTS]);
  const [GlobeComponent, setGlobeComponent] = useState(null);
  const [loadError, setLoadError] = useState(false);

  // لود کردن پویای react-globe.gl (اگه نصب نباشه، کرش نکنه)
  useEffect(() => {
    let cancelled = false;
    import('react-globe.gl')
      .then((mod) => {
        if (!cancelled) setGlobeComponent(() => mod.default);
      })
      .catch((err) => {
        console.error('❌ Globe load error:', err);
        if (!cancelled) setLoadError(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = [...CONTINENTS];
      try {
        const [countries, cities] = await Promise.all([
  fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
    .then((r) => r.ok ? r.json() : null).catch(() => null),
  fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_populated_places_simple.geojson')
    .then((r) => r.ok ? r.json() : null).catch(() => null),
]);
        if (countries?.features?.length) {
          countries.features.forEach((f) => {
            const name = f.properties?.ADMIN || f.properties?.NAME;
            const [lng, lat] = centroidOf(f.geometry);
            if (name && isFinite(lat)) all.push({ name, lat, lng, type: 'country' });
          });
        } else {
          FALLBACK_COUNTRIES.forEach((c) => all.push({ ...c, type: 'country' }));
        }
        if (cities?.features?.length) {
          cities.features
            .filter((f) => (f.properties?.pop_max || 0) >= 2000000)
            .forEach((f) => {
              const [lng, lat] = f.geometry?.coordinates || [];
              if (f.properties?.name && isFinite(lat)) {
                all.push({ name: f.properties.name, lat, lng, type: 'city' });
              }
            });
        }
      } catch {
        FALLBACK_COUNTRIES.forEach((c) => all.push({ ...c, type: 'country' }));
      }
      if (!cancelled) setLabels(all);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !ready) return;
    const controls = globe.controls();
    controls.autoRotate = rotate;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 130;
    controls.maxDistance = 380;
  }, [rotate, ready]);

  const zoom = (factor) => {
    const globe = globeRef.current;
    if (!globe) return;
    const pov = globe.pointOfView();
    globe.pointOfView({ altitude: Math.min(2.6, Math.max(0.35, pov.altitude * factor)) }, 300);
  };

  const goIran = () => {
    globeRef.current?.pointOfView({ lat: 32.4, lng: 53.7, altitude: 1.1 }, 1200);
  };

  // اگه پکیج نصب نشده یا کرش کرد
  if (loadError || !GlobeComponent) {
    return (
      <div className="glass-strong relative grid h-[420px] w-full place-items-center rounded-2xl border border-cyan-500/20 md:h-[560px]">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-3xl">
            🌍
          </div>
          <p className="font-display text-lg font-bold text-white">
            {loadError ? 'کره زمین در حال بارگذاری...' : 'آماده‌سازی کره'}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {loadError
              ? 'npm install react-globe.gl را اجرا کنید'
              : 'لطفاً چند لحظه صبر کنید'}
          </p>
        </div>
      </div>
    );
  }

  const Globe = GlobeComponent;

  return (
    <div
      ref={wrapRef}
      className="glass-strong relative h-[420px] w-full overflow-hidden rounded-2xl border border-cyan-500/20 md:h-[560px]"
    >
      {!ready && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#05050e]">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            <p className="mt-3 text-xs text-slate-400">در حال بارگذاری کره زمین... 🌍</p>
          </div>
        </div>
      )}

      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.18}
        backgroundColor="rgba(0,0,0,0)"
        labelsData={labels}
        labelLat="lat"
        labelLng="lng"
        labelText="name"
        labelAltitude={0.02}
        labelSize={(d) => (d.type === 'continent' ? 2.1 : d.type === 'country' ? 1.3 : 0.8)}
        labelDotRadius={(d) => (d.type === 'continent' ? 0.35 : d.type === 'country' ? 0.25 : 0.12)}
        labelColor={(d) =>
          d.type === 'continent'
            ? 'rgba(232,121,249,0.95)'
            : d.type === 'country'
            ? 'rgba(34,211,238,0.9)'
            : 'rgba(74,222,128,0.8)'
        }
        labelResolution={2}
        onGlobeReady={() => {
          setReady(true);
          globeRef.current?.pointOfView({ lat: 32.4, lng: 53.7, altitude: 2.0 });
        }}
      />

      {/* دکمه‌های کنترل */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
        <button onClick={() => zoom(0.7)} title="زوم +" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/50 text-cyan-300 backdrop-blur transition hover:bg-cyan-400/20">
          <Plus size={16} />
        </button>
        <button onClick={() => zoom(1.4)} title="زوم -" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/50 text-cyan-300 backdrop-blur transition hover:bg-cyan-400/20">
          <Minus size={16} />
        </button>
        <button
          onClick={() => setRotate((v) => !v)}
          title="چرخش خودکار"
          className={cn(
            'grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/50 backdrop-blur transition',
            rotate ? 'text-fuchsia-300 hover:bg-fuchsia-400/20' : 'text-slate-400 hover:bg-white/10'
          )}
        >
          <RotateCw size={16} />
        </button>
        <button onClick={goIran} title="نمای ایران" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/50 text-green-300 backdrop-blur transition hover:bg-green-400/20">
          <MapPin size={16} />
        </button>
      </div>

      {/* راهنما */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-[10px] text-slate-300 backdrop-blur">
        🖱 بکش تا بچرخونی • اسکرول = زوم • {labels.length} برچسب فعال
      </div>
    </div>
  );
}