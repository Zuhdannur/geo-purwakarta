'use client';

import React, { useState } from 'react';

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
    <div className="flex flex-col gap-2 bg-white/95 border border-gray-200 rounded-md px-3 py-2 shadow-md">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".zip"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`text-sm px-3 py-1 rounded-md text-white ${loading || !file ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Uploading...' : 'Upload .zip'}
        </button>
        <button
          onClick={loadPreparedList}
          disabled={loadingPrepared}
          className={`text-sm px-3 py-1 rounded-md border ${loadingPrepared ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}`}
        >
          {loadingPrepared ? 'Loading…' : 'Browse prepared'}
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {saveMsg && <span className="text-xs text-green-700">{saveMsg}</span>}
      {showPrepared && (
        <div className="max-h-64 overflow-auto border-t pt-2">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="text-xs text-gray-700">{selectedPaths.size} selected</div>
            <div className="flex items-center gap-2">
              <button
                onClick={combineSelected}
                disabled={selectedPaths.size === 0 || loading}
                className={`text-xs px-2 py-1 rounded ${selectedPaths.size === 0 || loading ? 'bg-gray-300 text-gray-600' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                Combine & Load
              </button>
              <button
                onClick={combineAndSave}
                disabled={selectedPaths.size === 0 || loading}
                className={`text-xs px-2 py-1 rounded ${selectedPaths.size === 0 || loading ? 'bg-gray-300 text-gray-600' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
              >
                Combine & Save
              </button>
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
              <button
                onClick={() => loadPreparedZip(item)}
                className="text-xs px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Load
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


