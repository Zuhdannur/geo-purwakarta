'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export default function Home() {
  return (
    <div className="h-[calc(100vh-56px)] w-full">
      <AllMapsViewer />
    </div>
  );
}

function AllMapsViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [maps, setMaps] = useState<Array<{ id: number; name: string; geojson: any }>>([]);
  const [visible, setVisible] = useState<Record<number, boolean>>({});
  const [colors, setColors] = useState<Record<number, { fill: string; outline: string; line: string; point: string }>>({});
  const markersRef = useRef<Record<number, any[]>>({});

  const randomColor = (seed: number) => {
    // deterministic HEX color derived from HSL for Mapbox compatibility
    const h = (seed * 47) % 360;
    const s = 70;
    const l = 55;
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const hslToHex = (hue: number, sat: number, lig: number) => {
      const s1 = sat / 100;
      const l1 = lig / 100;
      const c = (1 - Math.abs(2 * l1 - 1)) * s1;
      const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
      const m = l1 - c / 2;
      let r = 0, g = 0, b = 0;
      if (hue < 60) { r = c; g = x; b = 0; }
      else if (hue < 120) { r = x; g = c; b = 0; }
      else if (hue < 180) { r = 0; g = c; b = x; }
      else if (hue < 240) { r = 0; g = x; b = c; }
      else if (hue < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      const R = Math.round((r + m) * 255);
      const G = Math.round((g + m) * 255);
      const B = Math.round((b + m) * 255);
      return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
    };
    return hslToHex(h, s, l);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/maps', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load maps');
        const data = await res.json();
        setMaps(data);
        const v: Record<number, boolean> = {};
        const cs: Record<number, { fill: string; outline: string; line: string; point: string }> = {};
        data.forEach((m: any) => {
          v[m.id] = true;
          const base = randomColor(m.id);
          cs[m.id] = { fill: base, outline: base, line: base, point: base };
        });
        setVisible(v);
        setColors(cs);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      if (!containerRef.current) return;
      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [107.4439, -6.5569],
        zoom: 10,
        attributionControl: false
      });
      mapRef.current = map;
      map.on('load', () => {
        // util: rough center for features without async deps
        const getCenter = (f: any): [number, number] | null => {
          try {
            const g = f?.geometry; if (!g) return null;
            const t = g.type; const c = g.coordinates;
            const avg = (arr: number[][]) => {
              let sx = 0, sy = 0, n = 0; for (const [x,y] of arr) { sx += x; sy += y; n++; }
              return n ? ([sx/n, sy/n] as [number, number]) : null;
            };
            if (t === 'Point') return c as [number, number];
            if (t === 'MultiPoint') return avg(c);
            if (t === 'LineString') return avg(c);
            if (t === 'MultiLineString') { const flat: number[][] = []; for (const seg of c) flat.push(...seg); return avg(flat); }
            if (t === 'Polygon') { const ring = c?.[0] || []; return avg(ring); }
            if (t === 'MultiPolygon') { const ring = c?.[0]?.[0] || []; return avg(ring); }
          } catch {}
          return null;
        };
        // Add each map as a layer in order
        maps.forEach((m, idx) => {
          const sourceId = `maps-src-${m.id}`;
          try { if (map.getSource(sourceId)) map.removeSource(sourceId as any); } catch {}
          map.addSource(sourceId, { type: 'geojson', data: m.geojson });

          const hasPolygons = Array.isArray(m.geojson?.features) && m.geojson.features.some((f: any) => (f.geometry?.type || '').includes('Polygon'));
          const hasLines = Array.isArray(m.geojson?.features) && m.geojson.features.some((f: any) => (f.geometry?.type || '').includes('Line'));
          const hasPoints = Array.isArray(m.geojson?.features) && m.geojson.features.some((f: any) => ['Point','MultiPoint'].includes(f.geometry?.type));

          if (hasPolygons) {
            map.addLayer({ id: `maps-${m.id}-fill`, type: 'fill', source: sourceId, paint: { 'fill-color': colors[m.id]?.fill || '#3b82f6', 'fill-opacity': 0.25 } } as any);
            map.addLayer({ id: `maps-${m.id}-fill-hover`, type: 'fill', source: sourceId, paint: { 'fill-color': colors[m.id]?.fill || '#1d4ed8', 'fill-opacity': 0.5 }, filter: ['==', ['id'], null] } as any);
            map.addLayer({ id: `maps-${m.id}-outline`, type: 'line', source: sourceId, paint: { 'line-color': colors[m.id]?.outline || '#1d4ed8', 'line-width': 1.5 } } as any);
          }
          if (hasLines) {
            map.addLayer({ id: `maps-${m.id}-line`, type: 'line', source: sourceId, paint: { 'line-color': colors[m.id]?.line || '#16a34a', 'line-width': 2 } } as any);
          }
          if (hasPoints) {
            map.addLayer({ id: `maps-${m.id}-point`, type: 'circle', source: sourceId, paint: { 'circle-radius': 4, 'circle-color': colors[m.id]?.point || '#ef4444', 'circle-stroke-width': 1, 'circle-stroke-color': '#7f1d1d' } } as any);
          }

          // Apply initial visibility
          const baseVis = (visible[m.id] ?? true);
          const applyVis = (suffix: string, on: boolean) => {
            const lid = `maps-${m.id}-${suffix}`;
            if (map.getLayer(lid)) {
              try { map.setLayoutProperty(lid, 'visibility', baseVis && on ? 'visible' : 'none'); } catch {}
            }
          };
          applyVis('fill', true);
          applyVis('fill-hover', false);
          applyVis('outline', true);
          applyVis('line', true);
          applyVis('point', true);
          applyVis('labels', true);

          // Center labels for features using simple center calc
          try {
            const centers = { type: 'FeatureCollection', features: [] as any[] };
            (m.geojson?.features || []).forEach((f: any) => {
              const c = getCenter(f) || map.getCenter().toArray();
              centers.features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: { __label: m.name } });
            });
            const labelSrc = `${sourceId}-labels`;
            if (map.getSource(labelSrc)) map.removeSource(labelSrc as any);
            map.addSource(labelSrc, { type: 'geojson', data: centers as any });
            map.addLayer({ id: `maps-${m.id}-labels`, type: 'symbol', source: labelSrc, layout: { 'text-field': ['get','__label'], 'text-size': 12 }, paint: { 'text-color': '#111', 'text-halo-color': '#fff', 'text-halo-width': 1.5 } });
          } catch {}

          // Add DOM markers at feature centers
          try {
            const markers: any[] = [];
            (m.geojson?.features || []).forEach((f: any) => {
              const center = getCenter(f);
              if (!center) return;
              const el = document.createElement('div');
              el.style.width = '10px';
              el.style.height = '10px';
              el.style.borderRadius = '9999px';
              el.style.background = colors[m.id]?.point || '#ef4444';
              el.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.9)';
              const mk = new (mapboxgl as any).Marker({ element: el, anchor: 'center' }).setLngLat(center).addTo(map);
              markers.push(mk);
            });
            markersRef.current[m.id] = markers;
          } catch {}

          // Hover interaction (polygon fill)
          if (hasPolygons) {
            map.on('mousemove', `maps-${m.id}-fill`, (e: any) => {
              const fid = e?.features?.[0]?.id ?? null;
              map.setFilter(`maps-${m.id}-fill-hover`, ['==', ['id'], fid]);
            });
            map.on('mouseleave', `maps-${m.id}-fill`, () => {
              map.setFilter(`maps-${m.id}-fill-hover`, ['==', ['id'], null]);
            });
          }

          // Popup on click for any geometry
          const showPopup = (e: any) => {
            if (!e?.features?.[0]) return;
            const f = e.features[0];
            const coords = e.lngLat || (f.geometry.type === 'Point' ? f.geometry.coordinates : e.lngLat);
            const props = { ...(f.properties || {}) };
            const rows = Object.entries(props)
              .map(([k, v]) => `<tr><th style="text-align:left;padding:2px 6px;color:#374151;">${k}</th><td style="padding:2px 6px;color:#111827;">${String(v)}</td></tr>`) 
              .join('');
            const html = `<div style="max-width:320px"><table style="border-collapse:collapse;font-size:12px;">${rows}</table></div>`;
            new (mapboxgl as any).Popup({ closeButton: true, maxWidth: '320px' }).setLngLat(coords).setHTML(html).addTo(map);
          };
          if (hasPolygons) map.on('click', `maps-${m.id}-fill`, showPopup);
          if (hasLines) map.on('click', `maps-${m.id}-line`, showPopup);
          if (hasPoints) map.on('click', `maps-${m.id}-point`, showPopup);
        });
      });
      cleanup = () => { try { 
        // remove markers
        for (const key of Object.keys(markersRef.current)) {
          for (const mk of markersRef.current[Number(key)] || []) {
            try { mk.remove(); } catch {}
          }
        }
        markersRef.current = {};
        map.remove(); 
      } catch {} };
    })();
    return () => cleanup();
  }, [maps]);

  const toggleLayer = (id: number, checked: boolean | string) => {
    const vis = checked === true;
    setVisible(prev => ({ ...prev, [id]: vis }));
    const map = mapRef.current;
    if (!map) return;
    const display = vis ? 'visible' : 'none';
    ['fill','fill-hover','outline','line','point','labels'].forEach(sfx => {
      const lid = `maps-${id}-${sfx}`;
      if (map.getLayer(lid)) {
        try { map.setLayoutProperty(lid, 'visibility', display); } catch {}
      }
    });
    // toggle markers visibility
    for (const mk of markersRef.current[id] || []) {
      try { mk.getElement().style.display = vis ? 'block' : 'none'; } catch {}
    }
  };

  // removed per-sublayer toggles per request

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute top-4 left-4 z-[9999]">
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="text-xs font-medium text-gray-700">Layers</div>
            {maps.map(m => (
              <div key={m.id} className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={visible[m.id] ?? true} onCheckedChange={(c) => toggleLayer(m.id, c as boolean)} />
                  <span className="text-gray-800">{m.name}</span>
                </label>
            </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
