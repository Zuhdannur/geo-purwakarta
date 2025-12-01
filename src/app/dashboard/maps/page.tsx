"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, GripVertical } from 'lucide-react';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

type MapRow = { id: number; name: string; color: string; warna?: string; createdAt: string; updatedAt: string };

export default function MapsPage() {
  const [rows, setRows] = useState<MapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3388ff');
  const [warna, setWarna] = useState('');
  const [geojsonFile, setGeojsonFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewName, setPreviewName] = useState('');
  const [previewColor, setPreviewColor] = useState('#3388ff');
  const [previewWarna, setPreviewWarna] = useState('');
  const [previewGeojson, setPreviewGeojson] = useState<any>(null);

  const isEditing = editingId !== null;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/maps', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRows(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setColor('#3388ff');
    setWarna('');
    setGeojsonFile(null);
    setIsFormOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/maps/${id}`);
      if (!res.ok) throw new Error('Failed to fetch map');
      const m = await res.json();
      setEditingId(id);
      setName(m.name);
      setColor(m.color || '#3388ff');
      setWarna(m.warna || '');
      setGeojsonFile(null);
      setIsFormOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to open');
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!isEditing && !geojsonFile) {
        throw new Error('GeoJSON file is required');
      }
      
      // Validate file if provided
      if (geojsonFile) {
        const text = await geojsonFile.text();
        try {
          const parsed = JSON.parse(text);
          // Validate it's a GeoJSON
          if (parsed.type !== 'FeatureCollection' && parsed.type !== 'Feature' && parsed.type !== 'GeometryCollection') {
            throw new Error('Invalid GeoJSON format');
          }
        } catch (e: any) {
          if (e.message === 'Invalid GeoJSON format') {
            throw e;
          }
          throw new Error('Invalid JSON file');
        }
      }

      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('name', name);
      formData.append('color', color);
      if (warna) formData.append('warna', warna);
      if (geojsonFile) {
        formData.append('file', geojsonFile);
      }

      if (isEditing) {
        const res = await fetch(`/api/maps/${editingId}`, { 
          method: 'PATCH', 
          body: formData 
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to update' }));
          throw new Error(errorData.error || 'Failed to update');
        }
      } else {
        const res = await fetch('/api/maps', { 
          method: 'POST', 
          body: formData 
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to create' }));
          throw new Error(errorData.error || 'Failed to create');
        }
      }
      setIsFormOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const deleteRow = async (id: number) => {
    if (!confirm('Delete this map?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/maps/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const openPreview = async (id: number) => {
    try {
      const res = await fetch(`/api/maps/${id}`);
      if (!res.ok) throw new Error('Failed to load map');
      const m = await res.json();
      setPreviewName(m.name);
      setPreviewColor(m.color || '#3388ff');
      setPreviewWarna(m.warna || '');
      setPreviewGeojson(m.geojson ?? null);
      setIsPreviewOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to preview');
    }
  };


  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDndEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex(r => String(r.id) === String(active.id));
    const newIndex = rows.findIndex(r => String(r.id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const updated = arrayMove(rows, oldIndex, newIndex);
    setRows(updated);
    const order = updated.map((r, idx) => ({ id: r.id, sortOrder: (idx + 1) * 10 }));
    try {
      const res = await fetch('/api/maps/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) });
      if (!res.ok) throw new Error('Failed to save order');
      toast.success('Order saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save order');
    }
  };

  function SortableRow({ row, children }: { row: MapRow; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
      cursor: 'grab'
    };
    return (
      <tr ref={setNodeRef} style={style} {...attributes} {...listeners} className="hover:bg-gray-50">
        {children}
      </tr>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Maps</h1>
        <Button onClick={openCreate}>Add Map</Button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saved Maps</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border-b">Name</th>
                    <th className="text-left px-3 py-2 border-b">Color</th>
                    <th className="text-left px-3 py-2 border-b">Warna Property</th>
                    <th className="text-left px-3 py-2 border-b">Created</th>
                    <th className="text-right px-3 py-2 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-3 border-t"><div className="h-4 w-40 bg-gray-200 rounded" /></td>
                      <td className="px-3 py-3 border-t"><div className="h-6 w-20 bg-gray-200 rounded" /></td>
                      <td className="px-3 py-3 border-t"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                      <td className="px-3 py-3 border-t"><div className="h-4 w-56 bg-gray-200 rounded" /></td>
                      <td className="px-3 py-3 border-t">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-8 w-20 bg-gray-200 rounded" />
                          <div className="h-8 w-16 bg-gray-200 rounded" />
                          <div className="h-8 w-20 bg-gray-200 rounded" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-gray-600">No maps yet</div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} onDragEnd={onDndEnd}>
                <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="w-8 px-2 py-2 border-b"></th>
                        <th className="text-left px-3 py-2 border-b">Name</th>
                        <th className="text-left px-3 py-2 border-b">Color</th>
                        <th className="text-left px-3 py-2 border-b">Warna Property</th>
                        <th className="text-left px-3 py-2 border-b">Created</th>
                        <th className="text-right px-3 py-2 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <SortableRow key={row.id} row={row}>
                          <td className="w-8 px-2 py-2 border-t align-middle text-gray-400">
                            <GripVertical className="h-4 w-4 cursor-grab" />
                          </td>
                          <td className="px-3 py-2 border-t">{row.name}</td>
                          <td className="px-3 py-2 border-t">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-10 h-6 rounded border border-gray-300" 
                                style={{ backgroundColor: row.color }}
                                title={row.color}
                              />
                              <span className="text-xs text-gray-500">{row.color}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 border-t">
                            <span className="text-xs text-gray-500">
                              {row.warna ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {row.warna}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-t">{new Date(row.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2 border-t">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" onClick={() => openPreview(row.id)} disabled={deletingId === row.id}>Preview</Button>
                              <Button variant="secondary" onClick={() => openEdit(row.id)} disabled={deletingId === row.id}>Edit</Button>
                              <Button variant="destructive" onClick={() => deleteRow(row.id)} disabled={deletingId === row.id}>
                                {deletingId === row.id ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
                                ) : (
                                  'Delete'
                                )}
                              </Button>
                            </div>
                          </td>
                        </SortableRow>
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Map' : 'Create Map'}</DialogTitle>
            <DialogDescription>Provide a name and upload a valid GeoJSON (.json) file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <label className="text-sm">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Map name" disabled={busy} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Layer Color</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="color" 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                  disabled={busy}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input 
                  type="text" 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                  placeholder="#3388ff" 
                  disabled={busy}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Warna Property <span className="text-xs text-gray-500">(optional)</span></label>
              <Input 
                type="text" 
                value={warna} 
                onChange={e => setWarna(e.target.value)} 
                placeholder="warna" 
                disabled={busy}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Property name in GeoJSON features for feature-specific colors. Leave empty to use default layer color.
              </p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm">GeoJSON file {isEditing ? <span className="text-xs text-gray-500">(optional on update)</span> : <span className="text-xs text-gray-500">(required)</span>}</label>
              <Input type="file" accept=".json,application/geo+json,application/json" onChange={e => setGeojsonFile(e.target.files?.[0] || null)} disabled={busy} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditing ? 'Updating…' : 'Creating…'}</>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewName}</DialogTitle>
            <DialogDescription>GeoJSON rendered on an interactive map.</DialogDescription>
          </DialogHeader>
          <div className="h-[480px] w-full">
            {previewGeojson ? <MapPreview geojson={previewGeojson} color={previewColor} warna={previewWarna} /> : <div className="text-sm text-gray-600">No data</div>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MapPreview({ geojson, color = '#3388ff', warna }: { geojson: any; color?: string; warna?: string }) {
  const [mounted, setMounted] = useState(false);
  const containerId = 'map-preview-' + Math.random().toString(36).slice(2);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    let mapRef: any;
    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxgl.accessToken = 'pk.eyJ1Ijoic2F3YmVyc2luYXJtYXMiLCJhIjoiY2pzanZwaDFzMHo3djN5b2wwZ3h6dTE4NiJ9.i0GRqgAEzyvbT5h1d2NyUQ';
      const map = new mapboxgl.Map({ container: containerId, style: 'mapbox://styles/mapbox/light-v11', center: [107.4439, -6.5569], zoom: 10, attributionControl: false });
      mapRef = map;
      map.on('load', async () => {
        const sourceId = 'preview-source';
        try { if (map.getSource(sourceId)) map.removeSource(sourceId as any); } catch {}
        map.addSource(sourceId, { type: 'geojson', data: geojson });
        const features = Array.isArray(geojson?.features) ? geojson.features : [];
        const hasPolygons = features.some((f: any) => (f.geometry?.type || '').includes('Polygon'));
        const hasLines = features.some((f: any) => (f.geometry?.type || '').includes('Line'));
        const hasPoints = features.some((f: any) => ['Point','MultiPoint'].includes(f.geometry?.type));
        
        // Helper function to lighten color for fill
        const lightenColor = (hex: string, percent: number) => {
          const num = parseInt(hex.replace('#', ''), 16);
          const amt = Math.round(2.55 * percent);
          const R = Math.min(255, ((num >> 16) & 0xFF) + amt);
          const G = Math.min(255, ((num >> 8) & 0xFF) + amt);
          const B = Math.min(255, (num & 0xFF) + amt);
          return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
        };
        
        if (hasPolygons) {
          map.addLayer({ 
            id: 'preview-fill', 
            type: 'fill', 
            source: sourceId, 
            paint: { 
              'fill-color': [
                'case',
                ['has', warna || 'warna'],
                ['get', warna || 'warna'],
                color
              ],
              'fill-opacity': 0.3 
            } 
          });
          map.addLayer({ 
            id: 'preview-outline', 
            type: 'line', 
            source: sourceId, 
            paint: { 
              'line-color': [
                'case',
                ['has', warna || 'warna'],
                ['get', warna || 'warna'],
                color
              ],
              'line-width': 2 
            } 
          });
        }
        if (hasLines) map.addLayer({ 
          id: 'preview-line', 
          type: 'line', 
          source: sourceId, 
          paint: { 
            'line-color': [
              'case',
              ['has', warna || 'warna'],
              ['get', warna || 'warna'],
              color
            ],
            'line-width': 3 
          } 
        });
        if (hasPoints) map.addLayer({ 
          id: 'preview-point', 
          type: 'circle', 
          source: sourceId, 
          paint: { 
            'circle-radius': 6, 
            'circle-color': [
              'case',
              ['has', warna || 'warna'],
              ['get', warna || 'warna'],
              color
            ],
            'circle-stroke-width': 2, 
            'circle-stroke-color': [
              'case',
              ['has', warna || 'warna'],
              ['get', warna || 'warna'],
              lightenColor(color, -30)
            ]
          } 
        });
        try {
          const mod = await import('@turf/bbox');
          const turfBbox = (mod as any).default ? (mod as any).default(geojson) : (mod as any)(geojson);
          if (Array.isArray(turfBbox) && turfBbox.length === 4) {
            map.fitBounds([[turfBbox[0], turfBbox[1]],[turfBbox[2], turfBbox[3]]], { padding: 30, duration: 800 });
          }
        } catch {}
      });
    })();
    return () => { try { mapRef && mapRef.remove(); } catch {} };
  }, [mounted, containerId, geojson, color, warna]);
  return <div id={containerId} className="h-full w-full" />;
}

