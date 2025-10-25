'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Combobox } from '@/components/ui/combobox';
import type { ComboboxOption } from '@/components/ui/combobox';
import CommercialHouseModal from '@/components/CommercialHouseModal';
import PropertyPopup from '@/components/PropertyPopup';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2F3YmVyc2luYXJtYXMiLCJhIjoiY2pzanZwaDFzMHo3djN5b2wwZ3h6dTE4NiJ9.i0GRqgAEzyvbT5h1d2NyUQ';

interface MapLayer {
  id: number;
  name: string;
  geojson: any;
  color: string;
  warna?: string; // Feature-specific color property
  sortOrder: number;
}

export default function HomePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());

  // Filter states
  const [kecamatanOptions, setKecamatanOptions] = useState<ComboboxOption[]>([]);
  const [desaOptions, setDesaOptions] = useState<ComboboxOption[]>([]);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [selectedDesa, setSelectedDesa] = useState<string>('');

  // Debug mode - can be enabled via environment variable or localStorage
  const [debugMode, setDebugMode] = useState(false);

  // Initialize debug mode
  useEffect(() => {
    const isDebugMode = process.env.NODE_ENV === 'development' || 
                       localStorage.getItem('map-debug') === 'true' ||
                       window.location.search.includes('debug=true');
    setDebugMode(isDebugMode);
  }, []);

  // Hover state
  const hoveredFeatureRef = useRef<{ layerId: string; featureId: any } | null>(null);

  // Registered commercial houses state
  const [registeredHouses, setRegisteredHouses] = useState<any>(null);

  // Commercial house modal state
  const [commercialHouseModal, setCommercialHouseModal] = useState<{
    isOpen: boolean;
    data: any;
    loading: boolean;
  }>({
    isOpen: false,
    data: null,
    loading: false
  });

  // Recap dialog state
  const [recapOpen, setRecapOpen] = useState(false);
  const [recapData, setRecapData] = useState<any[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);

  // Fetch Kecamatan list
  useEffect(() => {
    const fetchKecamatan = async () => {
      try {
        const response = await fetch('/api/maps/kecamatan');
        const data = await response.json();

        const options: ComboboxOption[] = [
          { value: '', label: '-- Select Kecamatan --' },
          ...(data.kecamatan || []).map((k: string) => ({
            value: k,
            label: k
          }))
        ];

        setKecamatanOptions(options);
      } catch (error) {
        console.error('Error fetching kecamatan:', error);
      }
    };

    fetchKecamatan();
  }, []);

  // Fetch Desa list based on selected Kecamatan
  useEffect(() => {
    const fetchDesa = async () => {
      // Only fetch Desa options if a Kecamatan is selected
      if (!selectedKecamatan) {
        setDesaOptions([{ value: '', label: '-- Select Kecamatan first --' }]);
        setSelectedDesa('');
        return;
      }

      try {
        const url = `/api/maps/desa?kecamatan=${encodeURIComponent(selectedKecamatan)}`;

        const response = await fetch(url);
        const data = await response.json();

        const options: ComboboxOption[] = [
          { value: '', label: '-- Select Desa --' },
          ...(data.desa || []).map((d: string) => ({
            value: d,
            label: d
          }))
        ];

        setDesaOptions(options);

        // Reset desa selection when kecamatan changes
        setSelectedDesa('');
      } catch (error) {
        console.error('Error fetching desa:', error);
        setDesaOptions([{ value: '', label: '-- Error loading Desa --' }]);
      }
    };

    fetchDesa();
  }, [selectedKecamatan]);

  // Fetch all map layers
  useEffect(() => {
    const fetchLayers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/maps');
        const data = await response.json();
        setLayers(data);

        // Initialize all layers as visible
        const allLayerIds = data.map((layer: MapLayer) => `map-layer-${layer.id}`);
        setVisibleLayers(new Set(allLayerIds));
      } catch (error) {
        console.error('Error fetching layers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayers();
  }, []);

  // Fetch registered commercial houses
  useEffect(() => {
    const fetchRegisteredHouses = async () => {
      try {
        const response = await fetch('/api/commercial-houses?limit=10000');
        const data = await response.json();

        // Convert to GeoJSON
        const features = data.data
          .filter((house: any) => house.geometry)
          .map((house: any) => ({
            type: 'Feature',
            geometry: house.geometry,
            properties: {
              id: house.id,
              idSrk: house.idSrk,
              namaPerumahan: house.namaPerumahan,
              alamat: house.alamat,
              kecamatan: house.kecamatan,
              kelurahanDesa: house.kelurahanDesa,
              namaPengembangan: house.namaPengembangan,
              noIzin: house.noIzin,
              koordinat: house.koordinat,
              _featureId: house.id
            }
          }));

        const geojson = {
          type: 'FeatureCollection',
          features: features
        };

        setRegisteredHouses(geojson);
      } catch (error) {
        console.error('Error fetching registered commercial houses:', error);
      }
    };

    fetchRegisteredHouses();
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [107.4439, -6.5569], // Purwakarta center
      zoom: 10,
      attributionControl: false
    });

    map.current.on('load', () => {
      setMapReady(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load layers when map is ready
  useEffect(() => {
    if (!mapReady || !map.current || layers.length === 0) return;

    // Remove existing layers and sources
    const style = map.current.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        if (layer.id.startsWith('map-layer-')) {
          if (map.current!.getLayer(layer.id)) {
            map.current!.removeLayer(layer.id);
          }
        }
      });
    }

    if (style && style.sources) {
      Object.keys(style.sources).forEach((sourceId) => {
        if (sourceId.startsWith('map-source-')) {
          if (map.current!.getSource(sourceId)) {
            map.current!.removeSource(sourceId);
          }
        }
      });
    }

    // Add layers in order (sorted by sortOrder from API)
    layers.forEach((layer, index) => {
      const sourceId = `map-source-${layer.id}`;
      const layerId = `map-layer-${layer.id}`;
      const outlineLayerId = `map-layer-${layer.id}-outline`;

      try {
        // Add source
        if (!map.current!.getSource(sourceId)) {
          map.current!.addSource(sourceId, {
            type: 'geojson',
            data: layer.geojson
          });
        }

        // Determine geometry type
        const features = layer.geojson.features || [];
        const hasPolygons = features.some((f: any) =>
          f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
        );
        const hasLines = features.some((f: any) =>
          f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
        );
        const hasPoints = features.some((f: any) =>
          f.geometry?.type === 'Point' || f.geometry?.type === 'MultiPoint'
        );

        // Use color from database or fallback to default
        const color = layer.color || '#3388ff';
        const outlineColor = darkenColor(color, 0.3);

        // Add polygon layers
        if (hasPolygons) {
          // Ensure features have unique IDs for filtering
          const geojsonWithIds = {
            ...layer.geojson,
            features: layer.geojson.features.map((f: any, idx: number) => ({
              ...f,
              properties: {
                ...f.properties,
                _featureId: f.properties?._featureId || f.properties?.OBJECTID || f.properties?.id || idx
              }
            }))
          };

          // Update source with IDs
          const source = map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource;
          if (source && typeof source.setData === 'function') {
            source.setData(geojsonWithIds);
          }

          if (!map.current!.getLayer(layerId)) {
            map.current!.addLayer({
              id: layerId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use warna from feature
                  color // Fallback to default layer color
                ],
                'fill-opacity': 0.3
              },
              filter: createFilter()
            });
          }

          if (!map.current!.getLayer(outlineLayerId)) {
            map.current!.addLayer({
              id: outlineLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use warna from feature
                  outlineColor // Fallback to default outline color
                ],
                'line-width': 1
              },
              filter: createFilter()
            });
          }

          // Add hover layer (darker fill)
          const hoverLayerId = `map-layer-${layer.id}-hover`;
          if (!map.current!.getLayer(hoverLayerId)) {
            map.current!.addLayer({
              id: hoverLayerId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use the same warna color for hover
                  darkenColor(color, 0.5) // Fallback to darkened default color
                ],
                'fill-opacity': 0.6
              },
              filter: ['==', ['get', '_featureId'], '']
            });
          }

          // Add hover outline layer (thicker and darker)
          const hoverOutlineLayerId = `map-layer-${layer.id}-hover-outline`;
          if (!map.current!.getLayer(hoverOutlineLayerId)) {
            map.current!.addLayer({
              id: hoverOutlineLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use the same warna color for hover outline
                  darkenColor(outlineColor, 0.3) // Fallback to darkened default outline color
                ],
                'line-width': 2
              },
              filter: ['==', ['get', '_featureId'], '']
            });
          }

          // Add desa label layer for Peta Administrasi
          if (layer.name === 'Peta Administrasi' && hasPolygons) {
            
            const labelLayerId = `map-layer-${layer.id}-labels`;

            // Add label layer
            if (!map.current!.getLayer(labelLayerId)) {
              console.log('labelData', labelLayerId);

              try {
                map.current!.addLayer({
                  id: labelLayerId,
                  type: 'symbol',
                  source: sourceId,
                  layout: {
                    'text-field': ['get', 'nama_desa'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 15,
                    'text-offset': [0, 0.5],
                  },
                  paint: {
                    'text-color': '#000000',
                  },
                });
              } catch (e) {
                console.error('Error adding label layer:', e);
              }
            }
          }
        }

        // Add line layers
        if (hasLines && !hasPolygons) {
          // Ensure features have unique IDs
          const geojsonWithIds = {
            ...layer.geojson,
            features: layer.geojson.features.map((f: any, idx: number) => ({
              ...f,
              properties: {
                ...f.properties,
                _featureId: f.properties?._featureId || f.properties?.OBJECTID || f.properties?.id || idx
              }
            }))
          };

          const source = map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource;
          if (source && typeof source.setData === 'function') {
            source.setData(geojsonWithIds);
          }

          if (!map.current!.getLayer(layerId)) {
            map.current!.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use warna from feature
                  color // Fallback to default layer color
                ],
                'line-width': 2
              },
              filter: createFilter()
            });
          }

          // Add hover layer for lines
          const hoverLayerId = `map-layer-${layer.id}-hover`;
          if (!map.current!.getLayer(hoverLayerId)) {
            map.current!.addLayer({
              id: hoverLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use the same warna color for hover
                  darkenColor(color, 0.5) // Fallback to darkened default color
                ],
                'line-width': 4
              },
              filter: ['==', ['get', '_featureId'], '']
            });
          }
        }

        // Add point layers
        if (hasPoints && !hasPolygons && !hasLines) {
          // Ensure features have unique IDs
          const geojsonWithIds = {
            ...layer.geojson,
            features: layer.geojson.features.map((f: any, idx: number) => ({
              ...f,
              properties: {
                ...f.properties,
                _featureId: f.properties?._featureId || f.properties?.OBJECTID || f.properties?.id || idx
              }
            }))
          };

          const source = map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource;
          if (source && typeof source.setData === 'function') {
            source.setData(geojsonWithIds);
          }

          if (!map.current!.getLayer(layerId)) {
            map.current!.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 6,
                'circle-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use warna from feature
                  color // Fallback to default layer color
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use warna from feature
                  outlineColor // Fallback to default outline color
                ]
              },
              filter: createFilter()
            });
          }

          // Add hover layer for points
          const hoverLayerId = `map-layer-${layer.id}-hover`;
          if (!map.current!.getLayer(hoverLayerId)) {
            map.current!.addLayer({
              id: hoverLayerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 8,
                'circle-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use the same warna color for hover
                  darkenColor(color, 0.5) // Fallback to darkened default color
                ],
                'circle-stroke-width': 3,
                'circle-stroke-color': [
                  'case',
                  ['has', layer.warna || 'warna'], // Check if feature has warna property
                  ['get', layer.warna || 'warna'], // Use the same warna color for hover outline
                  darkenColor(outlineColor, 0.3) // Fallback to darkened default outline color
                ]
              },
              filter: ['==', ['get', '_featureId'], '']
            });
          }
        }

        // Add click handler for feature info
        map.current!.on('click', layerId, async (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const properties = feature.properties || {};

            // Check if this is the "Sebaran Rumah Komersil" layer
            const isCommercialLayer = layer.name.toLowerCase().includes('rumah komersil') ||
              layer.name.toLowerCase().includes('sebaran rumah');

            if (isCommercialLayer && feature.geometry) {
              // Open modal and fetch commercial house data
              setCommercialHouseModal({
                isOpen: true,
                data: null,
                loading: true
              });

              try {
                const response = await fetch('/api/commercial-houses/by-geometry', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    geometry: feature.geometry
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  setCommercialHouseModal({
                    isOpen: true,
                    data: data,
                    loading: false
                  });
                } else {
                  // If no match found, show error
                  setCommercialHouseModal({
                    isOpen: true,
                    data: null,
                    loading: false
                  });
                  // console.error('No matching commercial house found');
                }
              } catch (error) {
                console.error('Error fetching commercial house data:', error);
                setCommercialHouseModal({
                  isOpen: true,
                  data: null,
                  loading: false
                });
              }
            } else {
              // For other layers, show regular popup with table
              const popupElement = document.createElement('div');
              const root = createRoot(popupElement);

              root.render(
                <PropertyPopup
                  layerName={layer.name}
                  properties={properties}
                />
              );

              new mapboxgl.Popup({
                maxWidth: 'none',
                className: 'custom-popup',
                closeButton: true,
                closeOnClick: false,
                closeOnMove: false
              })
                .setLngLat(e.lngLat)
                .setDOMContent(popupElement)
                .addTo(map.current!);
            }
          }
        });

        // Change cursor on hover
        map.current!.on('mouseenter', layerId, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current!.on('mouseleave', layerId, () => {
          map.current!.getCanvas().style.cursor = '';
        });

      } catch (error) {
        console.error(`Error loading layer ${layer.name}:`, error);
      }
    });

    // Set up global hover effect handler
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      // Get all visible layer IDs
      const visibleLayerIds = layers
        .map(l => `map-layer-${l.id}`)
        .filter(id => map.current!.getLayer(id));

      if (visibleLayerIds.length === 0) {
        clearHover();
        return;
      }

      // Query features at the mouse position
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: visibleLayerIds
      });

      if (features.length > 0) {
        const feature = features[0];
        if (!feature.layer) return;

        const layerId = feature.layer.id;
        const featureId = feature.properties?._featureId || feature.properties?.OBJECTID || feature.properties?.id || feature.id;

        // Only update if hovering over a different feature
        if (!hoveredFeatureRef.current ||
          hoveredFeatureRef.current.layerId !== layerId ||
          hoveredFeatureRef.current.featureId !== featureId) {

          // Clear previous hover
          clearHover();

          // Set new hover
          const hoverLayerId = `${layerId}-hover`;
          const hoverOutlineLayerId = `${layerId}-hover-outline`;

          if (map.current.getLayer(hoverLayerId)) {
            map.current.setFilter(hoverLayerId, ['==', ['get', '_featureId'], featureId]);
          }

          if (map.current.getLayer(hoverOutlineLayerId)) {
            map.current.setFilter(hoverOutlineLayerId, ['==', ['get', '_featureId'], featureId]);
          }

          hoveredFeatureRef.current = { layerId, featureId };
        }

        map.current.getCanvas().style.cursor = 'pointer';
      } else {
        clearHover();
        map.current.getCanvas().style.cursor = '';
      }
    };

    const clearHover = () => {
      if (!map.current || !hoveredFeatureRef.current) return;

      const { layerId } = hoveredFeatureRef.current;
      const hoverLayerId = `${layerId}-hover`;
      const hoverOutlineLayerId = `${layerId}-hover-outline`;

      if (map.current.getLayer(hoverLayerId)) {
        map.current.setFilter(hoverLayerId, ['==', ['get', '_featureId'], '']);
      }

      if (map.current.getLayer(hoverOutlineLayerId)) {
        map.current.setFilter(hoverOutlineLayerId, ['==', ['get', '_featureId'], '']);
      }

      hoveredFeatureRef.current = null;
    };

    // Add mousemove listener
    map.current.on('mousemove', handleMouseMove);

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.off('mousemove', handleMouseMove);
      }
    };

  }, [mapReady, layers, selectedKecamatan, selectedDesa]);

  // Helper function to get the center of a polygon
  const getPolygonCenter = (coordinates: any): [number, number] | null => {
    if (!coordinates || coordinates.length === 0) return null;

    let ring = null;
    if (coordinates[0] && Array.isArray(coordinates[0])) {
      if (coordinates[0][0] && Array.isArray(coordinates[0][0]) && coordinates[0][0].length > 0) {
        if (Array.isArray(coordinates[0][0][0]) && coordinates[0][0][0].length >= 2) {
          ring = coordinates[0][0];
        } else {
          ring = coordinates[0];
        }
      } else {
        ring = coordinates[0];
      }
    }

    if (!ring || ring.length < 3) return null;

    // Calculate centroid using shoelace formula
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < ring.length - 1; i++) {
      const coord1 = ring[i];
      const coord2 = ring[i + 1];

      const x1 = coord1[0];
      const y1 = coord1[1];
      const x2 = coord2[0];
      const y2 = coord2[1];

      if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) ||
        !isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
        continue;
      }

      const cross = x1 * y2 - x2 * y1;
      area += cross;
      centroidX += (x1 + x2) * cross;
      centroidY += (y1 + y2) * cross;
    }

    if (Math.abs(area) > 1e-10) {
      area /= 2;
      centroidX /= (6 * area);
      centroidY /= (6 * area);

      return [centroidX, centroidY];
    }

    // Fallback to bounding box center
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let validCoords = 0;

    for (const coord of ring) {
      if (Array.isArray(coord) && coord.length >= 2) {
        const x = coord[0];
        const y = coord[1];

        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          validCoords++;
        }
      }
    }

    if (validCoords > 0 && isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY)) {
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;

      if (!isNaN(centerX) && !isNaN(centerY) && isFinite(centerX) && isFinite(centerY)) {
        return [centerX, centerY];
      }
    }

    return null;
  };

  // Load registered commercial houses layer (always on top)
  useEffect(() => {
    if (!mapReady || !map.current || !registeredHouses || registeredHouses.features.length === 0) return;

    const sourceId = 'registered-houses-source';
    const layerId = 'registered-houses-layer';
    const outlineLayerId = 'registered-houses-outline';
    const hoverLayerId = 'registered-houses-hover';
    const hoverOutlineLayerId = 'registered-houses-hover-outline';
    const labelSourceId = 'registered-houses-labels-source';
    const labelLayerId = 'registered-houses-labels';

    try {
      // Remove existing layers if they exist
      if (map.current.getLayer(labelLayerId)) map.current.removeLayer(labelLayerId);
      if (map.current.getLayer(hoverOutlineLayerId)) map.current.removeLayer(hoverOutlineLayerId);
      if (map.current.getLayer(hoverLayerId)) map.current.removeLayer(hoverLayerId);
      if (map.current.getLayer(outlineLayerId)) map.current.removeLayer(outlineLayerId);
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(labelSourceId)) map.current.removeSource(labelSourceId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: registeredHouses
      });

      // Add fill layer with extremely bright green color
      map.current.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#00ff00', // Neon lime green - brightest possible
          'fill-opacity': 0.85 // High opacity to be visible even when behind other layers
        }
      });

      // Add outline layer
      map.current.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#00dd00', // Bright lime green
          'line-width': 3 // Thicker outline
        }
      });

      // Add hover fill layer
      map.current.addLayer({
        id: hoverLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#1a8f4f',
          'fill-opacity': 0.7
        },
        filter: ['==', ['get', '_featureId'], '']
      });

      // Add hover outline layer
      map.current.addLayer({
        id: hoverOutlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#0d5e34',
          'line-width': 3
        },
        filter: ['==', ['get', '_featureId'], '']
      });

      // Create labels for registered houses showing developer name
      const labelData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: registeredHouses.features.map((feature: any) => {
          const center = getPolygonCenter(feature.geometry.coordinates);
          if (center) {
            const namaPengembangan = feature.properties.namaPengembangan || 'Unknown Developer';
            const namaPerumahan = feature.properties.namaPerumahan || '';
            // Show developer name prominently
            const combinedLabel = namaPerumahan ? `${namaPengembangan}\n${namaPerumahan}` : namaPengembangan;

            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: center
              },
              properties: {
                label: combinedLabel,
                featureId: feature.properties.id || feature.properties._featureId
              }
            };
          }
          return null;
        }).filter(Boolean)
      };

      // Add label source
      map.current.addSource(labelSourceId, {
        type: 'geojson',
        data: labelData
      });

      // Add label layer - positioned at the top of all layers
      map.current.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: labelSourceId,
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Bold'],
          'text-size': 13,
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#00aa00', // Bright green text
          'text-halo-color': '#ffffff',
          'text-halo-width': 2.5
        }
      });

      // Ensure labels are on top by moving to the top of the layer stack
      setTimeout(() => {
        if (map.current && map.current.getLayer(labelLayerId)) {
          map.current.moveLayer(labelLayerId);
        }
      }, 100);


      // Add click handler
      map.current.on('click', layerId, async (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const houseId = feature.properties?.id;

          if (houseId) {
            // Open modal with loading state
            setCommercialHouseModal({
              isOpen: true,
              data: null,
              loading: true
            });

            try {
              // Fetch full commercial house data
              const response = await fetch(`/api/commercial-houses/${houseId}`);
              if (response.ok) {
                const houseData = await response.json();
                setCommercialHouseModal({
                  isOpen: true,
                  data: houseData,
                  loading: false
                });
              } else {
                console.error('Failed to fetch commercial house data');
                setCommercialHouseModal({
                  isOpen: true,
                  data: null,
                  loading: false
                });
              }
            } catch (error) {
              console.error('Error fetching commercial house data:', error);
              setCommercialHouseModal({
                isOpen: true,
                data: null,
                loading: false
              });
            }
          }
        }
      });

      // Add hover handlers
      map.current.on('mouseenter', layerId, (e) => {
        map.current!.getCanvas().style.cursor = 'pointer';

        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const featureId = feature.properties?._featureId;

          if (featureId) {
            map.current!.setFilter(hoverLayerId, ['==', ['get', '_featureId'], featureId]);
            map.current!.setFilter(hoverOutlineLayerId, ['==', ['get', '_featureId'], featureId]);
          }
        }
      });

      map.current.on('mouseleave', layerId, () => {
        map.current!.getCanvas().style.cursor = '';
        map.current!.setFilter(hoverLayerId, ['==', ['get', '_featureId'], '']);
        map.current!.setFilter(hoverOutlineLayerId, ['==', ['get', '_featureId'], '']);
      });

    } catch (error) {
      console.error('Error loading registered commercial houses layer:', error);
    }

    return () => {
      // Cleanup on unmount
      if (map.current) {
        if (map.current.getLayer(labelLayerId)) map.current.removeLayer(labelLayerId);
        if (map.current.getLayer(hoverOutlineLayerId)) map.current.removeLayer(hoverOutlineLayerId);
        if (map.current.getLayer(hoverLayerId)) map.current.removeLayer(hoverLayerId);
        if (map.current.getLayer(outlineLayerId)) map.current.removeLayer(outlineLayerId);
        if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
        if (map.current.getSource(labelSourceId)) map.current.removeSource(labelSourceId);
        if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
      }
    };
  }, [mapReady, registeredHouses]);

  // Apply filters when selection changes
  useEffect(() => {
    if (!mapReady || !map.current) return;

    const filter = createFilter();

    // Update all layers with new filter
    layers.forEach((layer) => {
      const layerId = `map-layer-${layer.id}`;
      const outlineLayerId = `map-layer-${layer.id}-outline`;

      if (map.current!.getLayer(layerId)) {
        map.current!.setFilter(layerId, filter);
      }
      if (map.current!.getLayer(outlineLayerId)) {
        map.current!.setFilter(outlineLayerId, filter);
      }

      // Note: Hover layers don't get the geo filter, they use feature ID filter
    });

    // Zoom to filtered area if filters are applied
    if (selectedKecamatan) {
      // Add a small delay to ensure map is fully loaded
      setTimeout(() => {
        zoomToFilteredArea();
      }, 100);
    }
  }, [selectedKecamatan, selectedDesa, mapReady, layers]);

  // Create filter expression based on selections
  const createFilter = (): any[] => {
    const conditions: any[] = ['all'];

    // Only apply filters if Kecamatan is selected
    if (selectedKecamatan) {
      conditions.push(['==', ['get', 'WADMKC'], selectedKecamatan]);

      // Only apply Desa filter if it's selected (requires Kecamatan to be selected first)
      if (selectedDesa) {
        conditions.push(['==', ['get', 'WADMKD'], selectedDesa]);
      }
    }

    return conditions.length > 1 ? conditions : ['all'];
  };

  // Zoom to filtered area
  const zoomToFilteredArea = () => {
    if (!map.current) {
      console.warn('Map not available for zoomToFilteredArea');
      return;
    }

    try {
      // Find administrative layer to zoom to
      const adminLayer = layers.find(l =>
        l.name.toLowerCase().includes('administrasi') ||
        l.name.toLowerCase().includes('administrative')
      );

      if (!adminLayer) {
        console.warn('Administrative layer not found for zooming');
        return;
      }

      if (!adminLayer.geojson || !adminLayer.geojson.features) {
        console.warn('Administrative layer has no GeoJSON features');
        return;
      }

      const features = adminLayer.geojson.features || [];
      if (debugMode) {
        console.log(`Found ${features.length} features in administrative layer`);
      }

      const filteredFeatures = features.filter((f: any) => {
        if (!f.properties) return false;

        // Try multiple property name variations for kecamatan
        const kecamatanValue = f.properties.nama_kec || f.properties.WADMKC || f.properties.kecamatan;
        const desaValue = f.properties.nama_desa || f.properties.WADMKD || f.properties.desa || f.properties.kelurahan;

        if (debugMode) {
          console.log(`Feature properties:`, {
            nama_kec: f.properties.nama_kec,
            WADMKC: f.properties.WADMKC,
            nama_desa: f.properties.nama_desa,
            WADMKD: f.properties.WADMKD,
            selectedKecamatan,
            selectedDesa
          });
        }

        if (selectedDesa) {
          return kecamatanValue === selectedKecamatan && desaValue === selectedDesa;
        } else if (selectedKecamatan) {
          return kecamatanValue === selectedKecamatan;
        }
        return true;
      });

      if (debugMode) {
        console.log(`Filtered to ${filteredFeatures.length} features`);
      }

      if (filteredFeatures.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        let validCoordsCount = 0;

        filteredFeatures.forEach((feature: any) => {
          if (feature.geometry) {
            const coords = getCoordinates(feature.geometry);
            coords.forEach((coord: [number, number]) => {
              if (coord && coord.length === 2 && 
                  typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                  !isNaN(coord[0]) && !isNaN(coord[1]) &&
                  isFinite(coord[0]) && isFinite(coord[1])) {
                bounds.extend(coord);
                validCoordsCount++;
              }
            });
          }
        });

        if (debugMode) {
          console.log(`Valid coordinates found: ${validCoordsCount}`);
        }

        if (!bounds.isEmpty()) {
          if (debugMode) {
            console.log('Fitting bounds to:', bounds.getNorth(), bounds.getSouth(), bounds.getEast(), bounds.getWest());
          }
          map.current!.fitBounds(bounds, {
            padding: 50,
            duration: 1000
          });
        } else {
          if (debugMode) {
            console.warn('No valid coordinates found for bounds calculation, using fallback zoom');
          }
          // Fallback: zoom to a reasonable level around Purwakarta center
          map.current!.flyTo({
            center: [107.4439, -6.5569],
            zoom: 12,
            duration: 1000
          });
        }
      } else {
        if (debugMode) {
          console.warn('No features found matching the selected filters');
        }
      }
    } catch (error) {
      console.error('Error zooming to filtered area:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        selectedKecamatan,
        selectedDesa,
        layersCount: layers.length
      });
    }
  };

  // Helper function to extract coordinates from geometry
  const getCoordinates = (geometry: any): [number, number][] => {
    const coords: [number, number][] = [];

    if (!geometry || !geometry.coordinates) {
      console.warn('Invalid geometry provided to getCoordinates');
      return coords;
    }

    const extractCoords = (coord: any, depth = 0) => {
      if (depth > 10) { // Prevent infinite recursion
        console.warn('Maximum recursion depth reached in coordinate extraction');
        return;
      }

      if (Array.isArray(coord)) {
        if (coord.length >= 2 && 
            typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
            !isNaN(coord[0]) && !isNaN(coord[1]) &&
            isFinite(coord[0]) && isFinite(coord[1])) {
          coords.push([coord[0], coord[1]]);
        } else {
          coord.forEach((c) => extractCoords(c, depth + 1));
        }
      }
    };

    try {
      extractCoords(geometry.coordinates);
    } catch (error) {
      console.error('Error extracting coordinates:', error);
    }

    return coords;
  };

  // Helper function to darken colors
  const darkenColor = (color: string, factor: number): string => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);

      const darkerR = Math.max(0, Math.floor(r * (1 - factor)));
      const darkerG = Math.max(0, Math.floor(g * (1 - factor)));
      const darkerB = Math.max(0, Math.floor(b * (1 - factor)));

      return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
    }
    return color;
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string, name: any, realID: number) => {
    setVisibleLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }

      // Update map layer visibility
      if (map.current) {
        const visible = newSet.has(layerId);
        const layerIds = [
          layerId,
          `${layerId}-outline`,
          `${layerId}-hover`,
          `${layerId}-hover-outline`
        ];

        console.log('name', name);

        // Add label layer for Peta Administrasi
        if (name.toLowerCase().includes('administrasi') || name.toLowerCase().includes('administrative')) {

          const labelLayerId = `map-layer-${realID}-labels`;
          layerIds.push(labelLayerId);
        }

        layerIds.forEach(id => {
          if (map.current!.getLayer(id)) {
            map.current!.setLayoutProperty(
              id,
              'visibility',
              visible ? 'visible' : 'none'
            );
          }
        });
      }

      return newSet;
    });
  };

  // Fetch recap data
  const fetchRecapData = async () => {
    setRecapLoading(true);
    try {
      const response = await fetch('/api/commercial-houses?limit=10000');
      const data = await response.json();

      // Process data: group by kecamatan and year
      const groupedData: { [key: string]: { [year: string]: number } } = {};

      data.data.forEach((house: any) => {
        const kecamatan = house.kecamatan || 'Unknown';
        const year = new Date(house.createdAt).getFullYear().toString();

        if (!groupedData[kecamatan]) {
          groupedData[kecamatan] = {};
        }

        if (!groupedData[kecamatan][year]) {
          groupedData[kecamatan][year] = 0;
        }

        groupedData[kecamatan][year]++;
      });

      // Convert to chart format
      const chartData: any[] = [];
      const allYears = new Set<string>();

      // Collect all years
      Object.values(groupedData).forEach(kecamatanData => {
        Object.keys(kecamatanData).forEach(year => allYears.add(year));
      });

      // Sort years
      const sortedYears = Array.from(allYears).sort();

      // Build chart data
      sortedYears.forEach(year => {
        const dataPoint: any = { year };
        Object.keys(groupedData).forEach(kecamatan => {
          dataPoint[kecamatan] = groupedData[kecamatan][year] || 0;
        });
        chartData.push(dataPoint);
      });

      setRecapData(chartData);
    } catch (error) {
      console.error('Error fetching recap data:', error);
    } finally {
      setRecapLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Commercial House Modal */}
      <CommercialHouseModal
        isOpen={commercialHouseModal.isOpen}
        onClose={() => setCommercialHouseModal({ isOpen: false, data: null, loading: false })}
        data={commercialHouseModal.data}
        loading={commercialHouseModal.loading}
      />

      {/* Filters - positioned at top left, above the map */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Kecamatan Filter */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kecamatan
          </label>
          <Combobox
            options={kecamatanOptions}
            value={selectedKecamatan}
            onValueChange={(value) => {
              setSelectedKecamatan(value);
              // Reset Desa when Kecamatan changes or is cleared
              if (value === '') {
                setSelectedDesa('');
              }
            }}
            placeholder="Select Kecamatan..."
            searchPlaceholder="Search Kecamatan..."
            emptyText="No Kecamatan found."
            width={250}
          />
        </div>

        {/* Desa Filter */}
        <div className={`bg-white rounded-lg shadow-lg p-3 transition-opacity ${!selectedKecamatan ? 'opacity-60' : 'opacity-100'}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desa/Kelurahan
            {!selectedKecamatan && (
              <span className="ml-1 text-xs text-gray-500 font-normal">
                (Select Kecamatan first)
              </span>
            )}
          </label>
          <Combobox
            options={desaOptions}
            value={selectedDesa}
            onValueChange={setSelectedDesa}
            placeholder={!selectedKecamatan ? "Select Kecamatan first..." : "Select Desa..."}
            searchPlaceholder="Search Desa..."
            emptyText={!selectedKecamatan ? "Please select a Kecamatan first" : "No Desa found."}
            width={250}
            disabled={!selectedKecamatan}
          />
        </div>

        {/* Debug Toggle Button */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <Button
            className="w-full"
            variant={debugMode ? "default" : "outline"}
            onClick={() => {
              const newDebugMode = !debugMode;
              setDebugMode(newDebugMode);
              localStorage.setItem('map-debug', newDebugMode.toString());
              console.log('Debug mode toggled:', newDebugMode);
            }}
          >
            🐛 Debug {debugMode ? 'ON' : 'OFF'}
          </Button>
        </div>

        {/* Recap Button */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <Dialog open={recapOpen} onOpenChange={setRecapOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                variant="default"
                onClick={() => {
                  setRecapOpen(true);
                  fetchRecapData();
                }}
              >
                📊 Recap
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Commercial Houses Recap by Kecamatan & Year</DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                {recapLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : recapData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={recapData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="year"
                            label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
                          />
                          <YAxis
                            label={{ value: 'Number of Houses', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip />
                          <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="rect"
                          />
                          {recapData.length > 0 && Object.keys(recapData[0])
                            .filter(key => key !== 'year')
                            .map((kecamatan, index) => {
                              const colors = [
                                '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                                '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                              ];
                              return (
                                <Bar
                                  key={kecamatan}
                                  dataKey={kecamatan}
                                  fill={colors[index % colors.length]}
                                  name={kecamatan}
                                />
                              );
                            })
                          }
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Total Houses</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {recapData.reduce((sum, item) => {
                            return sum + Object.keys(item)
                              .filter(key => key !== 'year')
                              .reduce((s, k) => s + (item[k] || 0), 0);
                          }, 0)}
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Kecamatan Count</div>
                        <div className="text-2xl font-bold text-green-700">
                          {recapData.length > 0 ? Object.keys(recapData[0]).filter(key => key !== 'year').length : 0}
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-medium">Year Range</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {recapData.length > 0 ? `${recapData[0].year} - ${recapData[recapData.length - 1].year}` : '-'}
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-600 font-medium">Data Points</div>
                        <div className="text-2xl font-bold text-orange-700">
                          {recapData.length}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium text-gray-700">Loading map layers...</span>
            </div>
          </div>
        </div>
      )}

      {/* Layer Control */}
      {!loading && layers.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <Card className="p-4 bg-white/90 backdrop-blur-sm max-w-xs">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700 mb-3">Map Layers</div>
              {layers.map((layer) => {
                const layerId = `map-layer-${layer.id}`;
                const isVisible = visibleLayers.has(layerId);

                return (
                  <div key={layer.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-4 h-4 rounded border flex-shrink-0"
                        style={{ backgroundColor: layer.color || '#3388ff' }}
                      />
                      <span className="text-xs truncate text-gray-600">
                        {layer.name}
                      </span>
                    </div>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={() => toggleLayerVisibility(layerId, layer.name, layer.id)}
                      className="flex-shrink-0"
                    />
                  </div>
                );
              })}

              {/* Show registered houses layer if available */}
              {registeredHouses && registeredHouses.features.length > 0 && (
                <div className="flex items-center gap-2 border-t pt-3 mt-2">
                  <div
                    className="w-4 h-4 rounded border-2 border-green-600 flex-shrink-0"
                    style={{ backgroundColor: '#2ecc71', opacity: 0.9 }}
                  />
                  <span className="text-xs font-medium text-green-700">
                    Registered Houses ({registeredHouses.features.length})
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

