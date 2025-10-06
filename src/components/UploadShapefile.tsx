'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface UploadShapefileProps {
  onLoaded: (layer: { id: string; name: string; data: any }) => void;
}

export default function UploadShapefile({ onLoaded }: UploadShapefileProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<Array<{ year: string; name: string; path: string }>>([]);
  const [showPrepared, setShowPrepared] = useState(false);
  const [loadingPrepared, setLoadingPrepared] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || `Upload failed (${res.status})`);
      }

      const json = await res.json();
      const geojson = json?.geojson;
      if (!geojson) {
        throw new Error('No GeoJSON returned');
      }

      const baseName = file.name.replace(/\.(zip|shp)$/i, '');
      const id = `uploaded-${baseName}-${Date.now()}`;
      onLoaded({ id, name: baseName, data: geojson });
      setFile(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to upload');
    } finally {
      setLoading(false);
    }
  };

  const loadPreparedList = async () => {
    setLoadingPrepared(true);
    setError(null);
    try {
      const res = await fetch('/api/prepared/list');
      if (!res.ok) throw new Error(`List failed (${res.status})`);
      const json = await res.json();
      setPrepared(json?.items || []);
      setShowPrepared(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load prepared list');
    } finally {
      setLoadingPrepared(false);
    }
  };

  const loadPreparedZip = async (item: { year: string; name: string; path: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/prepared/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path })
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || `Convert failed (${res.status})`);
      }
      const json = await res.json();
      const geojson = json?.geojson;
      if (!geojson) throw new Error('No GeoJSON returned');

      const safeName = item.name.replace(/\s+/g, '_');
      const id = `prepared-${safeName}-${Date.now()}`;
      onLoaded({ id, name: item.name, data: geojson });
    } catch (e: any) {
      setError(e?.message || 'Failed to convert prepared zip');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (p: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const combineSelected = async () => {
    if (selectedPaths.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/prepared/combine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: Array.from(selectedPaths) })
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || `Combine failed (${res.status})`);
      }
      const json = await res.json();
      const geojson = json?.geojson;
      if (!geojson) throw new Error('No GeoJSON returned');

      const baseName = `combined_${selectedPaths.size}_datasets`;
      const id = `combined-${Date.now()}`;
      onLoaded({ id, name: baseName, data: geojson });
      setSelectedPaths(new Set());
    } catch (e: any) {
      setError(e?.message || 'Failed to combine');
    } finally {
      setLoading(false);
    }
  };

  const combineAndSave = async () => {
    if (selectedPaths.size === 0) return;
    setLoading(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/prepared/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: Array.from(selectedPaths), filename: 'rumah_komersil.geojson' })
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || `Save failed (${res.status})`);
      }
      const json = await res.json();
      setSaveMsg(`Saved to ${json?.path || '/new data/rumah_komersil.geojson'}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Upload Shapefile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Uploading...' : 'Upload .zip'}
          </Button>
          <Button variant="outline" onClick={loadPreparedList} disabled={loadingPrepared}>
            {loadingPrepared ? 'Loading…' : 'Browse prepared'}
          </Button>
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
        {saveMsg && <span className="text-xs text-green-700">{saveMsg}</span>}
        {showPrepared && (
          <div className="max-h-64 overflow-auto border-t pt-2">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="text-xs text-gray-700">{selectedPaths.size} selected</div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={combineSelected} disabled={selectedPaths.size === 0 || loading}>
                  Combine & Load
                </Button>
                <Button size="sm" onClick={combineAndSave} disabled={selectedPaths.size === 0 || loading}>
                  Combine & Save
                </Button>
              </div>
            </div>
            {prepared.length === 0 && (
              <div className="text-xs text-gray-500">No prepared zip files found.</div>
            )}
            {prepared.map((item, idx) => (
              <div key={`${item.path}-${idx}`} className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedPaths.has(item.path)}
                    onChange={() => toggleSelect(item.path)}
                  />
                  <div className="text-xs text-gray-700 truncate" title={item.path}>
                    <span className="font-semibold">{item.year}</span> – {item.name}
                  </div>
                </label>
                <Button size="sm" onClick={() => loadPreparedZip(item)}>
                  Load
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


