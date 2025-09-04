'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import FeatureDrawer from './FeatureDrawer';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapboxMapProps {
  activeMenu: string | null;
  selectedLayers: string[];
  setSelectedLayers: (layers: string[]) => void;
  showBaseMap: boolean;
  setShowBaseMap: (show: boolean) => void;
  selectedKecamatan: string;
  selectedKelurahan: string;
  uploadedLayers?: Array<{ id: string; name: string; data: any }>;
  onFeatureUpdated?: () => void;
}

interface LayerConfig {
  id: string;
  name: string;
  url: string | string[];
  color: string;
  outlineColor: string;
}

const layerConfigs: { [key: string]: LayerConfig } = {
  'layer-administrasi': {
    id: 'layer-administrasi',
    name: 'Administrative Boundaries',
    url: '/new data/layer_administrasi.geojson',
    color: '#4a90e2',
    outlineColor: '#2c5aa0'
  },
  'layer-sebaran-rumah-komersil': {
    id: 'layer-sebaran-rumah-komersil',
    name: 'Sebaran Rumah Komersil',
    url: '/new data/rumah_komersil.geojson',
    color: '#e67e22',
    outlineColor: '#a95a17'
  },
  'layer-kawasan-lahan-terbangun': {
    id: 'layer-kawasan-lahan-terbangun',
    name: 'Kawasan Lahan Terbangun',
    url: '/new data/kawasan_terbangun.geojson',
    color: '#16a085',
    outlineColor: '#0e6f5c'
  },
  'layer-kawasan-rawan-bencana': {
    id: 'layer-kawasan-rawan-bencana',
    name: 'Kawasan Rawan Bencana',
    // Map to available datasets; missing ones will be skipped gracefully
    url: [
      '/new data/layer_kawasan_rawan_bencana_gempa_bumi.geojson',
      '/new data/layer_kawasan_rawan_bencana_gerakan_tanah.geojson',
      '/new data/layer_kawasan_rencana_bencana_banjir.geojson'
    ],
    color: '#c0392b',
    outlineColor: '#7e261d'
  },
  'layer-kawasan-rencana-pola-ruang': {
    id: 'layer-kawasan-rencana-pola-ruang',
    name: 'Kawasan Rencana Pola Ruang',
    url: '/new data/layer_rencana_pola_ruang.geojson',
    color: '#8e44ad',
    outlineColor: '#5e2e73'
  },
  'layer-kemiringan-lereng': {
    id: 'layer-kemiringan-lereng',
    name: 'Kemiringan Lereng',
    url: '/new data/layer_kemiringan_lereng.geojson',
    color: '#27ae60',
    outlineColor: '#1c7a43'
  }
};

export default function MapboxMap({
  activeMenu,
  selectedLayers,
  setSelectedLayers,
  showBaseMap,
  setShowBaseMap,
  selectedKecamatan,
  selectedKelurahan,
  uploadedLayers = [],
  onFeatureUpdated
}: MapboxMapProps) {
  
  // Debug state changes
  useEffect(() => {
    console.log('MapboxMap - selectedLayers changed:', selectedLayers);
  }, [selectedLayers]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hoveredRef = useRef<{ layerId: string; featureId: any } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapReadyRef = useRef(false);
  const [layers, setLayers] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [featureDrawer, setFeatureDrawer] = useState<{
    isOpen: boolean;
    featureData: any;
    layerName: string;
  }>({
    isOpen: false,
    featureData: null,
    layerName: ''
  });

  // Initialize map (only once)
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: showBaseMap 
          ? 'mapbox://styles/mapbox/streets-v12'
          : 'mapbox://styles/mapbox/light-v11',
        center: [107.4439, -6.5569], // Purwakarta center
        zoom: 10,
        attributionControl: false
      });

      map.current.on('load', () => {
        setMapReady(true);
        mapReadyRef.current = true;
        console.log('map loaded');
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showBaseMap]); // Remove selectedLayers dependency

  // Set up click event handlers (runs every time selectedLayers changes)
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Define handleFeatureClick with current selectedLayers value
    const handleFeatureClick = (e: any) => {
      if (!map.current || !map.current.isStyleLoaded() || selectedLayers.length === 0) {
        console.log('Map not ready or no layers selected');
        return;
      }

      try {
        // Set bbox as 5px rectangle area around clicked point
        const bbox: [[number, number], [number, number]] = [
          [e.point.x - 5, e.point.y - 5],
          [e.point.x + 5, e.point.y + 5]
        ];

        // Get available layers that actually exist in the map
        const availableLayers = selectedLayers
          .map(layerId => `${layerId}-fill`)
          .filter(layerName => map.current!.getLayer(layerName));

        // Debug: Log available layers
        console.log('Selected layers:', selectedLayers);
        console.log('Available fill layers:', availableLayers);
        console.log('All map layers:', map.current.getStyle().layers?.map(l => l.id) || []);

        // Enhanced debugging for commercial buildings layer
        if (selectedLayers.includes('layer-sebaran-rumah-komersil')) {
          console.log('Commercial buildings layer is selected, checking for features...');
          console.log('Query bbox:', bbox);
          console.log('Available layers for query:', availableLayers);
          
          // Check if the commercial buildings fill layer exists
          const commercialFillLayer = 'layer-sebaran-rumah-komersil-fill';
          const commercialOutlineLayer = 'layer-sebaran-rumah-komersil-outline';
          console.log('Commercial fill layer exists:', map.current.getLayer(commercialFillLayer));
          console.log('Commercial outline layer exists:', map.current.getLayer(commercialOutlineLayer));
          
          // If the layer exists but wasn't found in availableLayers, add it manually
          if (map.current.getLayer(commercialFillLayer) && !availableLayers.includes(commercialFillLayer)) {
            availableLayers.push(commercialFillLayer);
            console.log('Added commercial buildings layer to available layers');
          }
        }

        if (availableLayers.length === 0) {
          console.log('No fill layers available for querying');
          return;
        }

        // Find features intersecting the bounding box
        let selectedFeatures = map.current.queryRenderedFeatures(bbox, {
          layers: availableLayers
        });

        // Fallback: if no features found in specific layers, try querying all layers
        if (selectedFeatures.length === 0) {
          console.log('No features found in specific layers, trying all layers...');
          selectedFeatures = map.current.queryRenderedFeatures(bbox);
        }

        // Enhanced debugging for commercial buildings layer
        if (selectedLayers.includes('layer-sebaran-rumah-komersil')) {
          console.log('Commercial buildings layer is selected, checking for features...');
          console.log('Query bbox:', bbox);
          console.log('Available layers for query:', availableLayers);
          console.log('Features found:', selectedFeatures.length);
          if (selectedFeatures.length > 0) {
            console.log('First feature properties:', selectedFeatures[0].properties);
          }
        }

        if (selectedFeatures.length > 0) {
          const clickedFeature = selectedFeatures[0] as any;
          if (!clickedFeature || !clickedFeature.layer || !clickedFeature.properties) {
            return;
          }
          
          // Extract layer ID more robustly
          let layerId = clickedFeature.layer.id as string;
          if (layerId.includes('-fill')) {
            layerId = layerId.replace('-fill', '');
          } else if (layerId.includes('-outline')) {
            layerId = layerId.replace('-outline', '');
          } else if (layerId.includes('-highlighted')) {
            layerId = layerId.replace('-highlighted', '');
          }
          
          const config = layerConfigs[layerId];
        
          if (config) {
            // Clear previous highlighting
            if (selectedFeature && selectedFeature.layerId !== layerId) {
              const prevHighlightedLayer = `${selectedFeature.layerId}-highlighted`;
              const prevHighlightedOutlineLayer = `${selectedFeature.layerId}-highlighted-outline`;
              
              if (map.current.getLayer(prevHighlightedLayer)) {
                map.current.setFilter(prevHighlightedLayer, ['==', 'OBJECTID', '']);
              }
              if (map.current.getLayer(prevHighlightedOutlineLayer)) {
                map.current.setFilter(prevHighlightedOutlineLayer, ['==', 'OBJECTID', '']);
              }
            }

            // Get the unique identifier for the feature
            const props = clickedFeature.properties as Record<string, any>;
            
            // Enhanced feature ID handling for different layer types
            let featureId = null;
            if (layerId === 'layer-sebaran-rumah-komersil') {
              // For commercial buildings, use Id or create a unique identifier
              featureId = props.Id ?? props.id ?? clickedFeature.id ?? `commercial-${Date.now()}`;
              console.log('Commercial building clicked - Properties:', props);
              console.log('Feature ID:', featureId);
            } else {
              // For other layers, use existing logic
              const fallbackConcat = (props?.WADMKC || props?.WADMKD) ? `${props?.WADMKC || ''}-${props?.WADMKD || ''}` : null;
              featureId = props.OBJECTID ?? props.id ?? clickedFeature.id ?? fallbackConcat;
            }
            
            // Set filter to highlight only the selected feature
            const highlightedLayer = `${layerId}-highlighted`;
            const highlightedOutlineLayer = `${layerId}-highlighted-outline`;
            
            if (featureId != null) {
              if (map.current.getLayer(highlightedLayer)) {
                map.current.setFilter(highlightedLayer, ['==', 'OBJECTID', featureId]);
              }
              if (map.current.getLayer(highlightedOutlineLayer)) {
                map.current.setFilter(highlightedOutlineLayer, ['==', 'OBJECTID', featureId]);
              }
            }
            
            // Store the selected feature
            setSelectedFeature({
              ...clickedFeature,
              layerId: layerId,
              featureId: featureId
            });

            // Open the feature drawer with enhanced data
            setFeatureDrawer({
              isOpen: true,
              featureData: props,
              layerName: config.name
            });
          }
        }
      } catch (err) {
        console.error('Error in handleFeatureClick:', err);
      }
    };

    // Add click event for feature selection
    map.current.on('click', handleFeatureClick);

    // Cleanup function to remove event listener
    return () => {
      if (map.current) {
        map.current.off('click', handleFeatureClick);
      }
    };
  }, [selectedLayers, mapReady]); // This useEffect runs every time selectedLayers changes

  // Set up hover effects (runs every time selectedLayers changes)
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Define the mousemove handler
    const handleMouseMove = (e: any) => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      try {
        const availableLayers = selectedLayers
          .map(layerId => `${layerId}-fill`)
          .filter(layerName => map.current!.getLayer(layerName));

        if (availableLayers.length === 0) {
          // Clear previous hover highlight if any
          if (hoveredRef.current) {
            const prev = hoveredRef.current;
            if (map.current.getLayer(`${prev.layerId}-hovered`)) {
              map.current.setFilter(`${prev.layerId}-hovered`, ['==', 'OBJECTID', '']);
            }
            if (map.current.getLayer(`${prev.layerId}-hovered-outline`)) {
              map.current.setFilter(`${prev.layerId}-hovered-outline`, ['==', 'OBJECTID', '']);
            }
            hoveredRef.current = null;
          }
          map.current!.getCanvas().style.cursor = '';
          return;
        }

        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: availableLayers
        });

        if (features.length > 0) {
          const hovered = features[0] as any;
          if (!hovered || !hovered.layer || !hovered.properties) {
            return;
          }

          // Determine base layer id
          let layerId = hovered.layer.id as string;
          if (layerId.includes('-fill')) layerId = layerId.replace('-fill', '');
          else if (layerId.includes('-outline')) layerId = layerId.replace('-outline', '');
          else if (layerId.includes('-highlighted')) layerId = layerId.replace('-highlighted', '');
          else if (layerId.includes('-hovered')) layerId = layerId.replace('-hovered', '');

          const props = hovered.properties as Record<string, any>;
          const featureId = props.OBJECTID || `${props.WADMKC}-${props.WADMKD}`;

          // Skip if this feature is the same as currently hovered
          if (!hoveredRef.current || hoveredRef.current.layerId !== layerId || hoveredRef.current.featureId !== featureId) {
            // Clear previous hover if different
            if (hoveredRef.current) {
              const prev = hoveredRef.current;
              if (map.current.getLayer(`${prev.layerId}-hovered`)) {
                map.current.setFilter(`${prev.layerId}-hovered`, ['==', 'OBJECTID', '']);
              }
              if (map.current.getLayer(`${prev.layerId}-hovered-outline`)) {
                map.current.setFilter(`${prev.layerId}-hovered-outline`, ['==', 'OBJECTID', '']);
              }
            }

            // Apply hover filters on current layer if present
            if (map.current.getLayer(`${layerId}-hovered`)) {
              map.current.setFilter(`${layerId}-hovered`, ['==', 'OBJECTID', featureId]);
            }
            if (map.current.getLayer(`${layerId}-hovered-outline`)) {
              map.current.setFilter(`${layerId}-hovered-outline`, ['==', 'OBJECTID', featureId]);
            }

            hoveredRef.current = { layerId, featureId };
          }

          map.current!.getCanvas().style.cursor = 'pointer';
        } else {
          // Clear previous hover highlight when no feature under cursor
          if (hoveredRef.current) {
            const prev = hoveredRef.current;
            if (map.current.getLayer(`${prev.layerId}-hovered`)) {
              map.current.setFilter(`${prev.layerId}-hovered`, ['==', 'OBJECTID', '']);
            }
            if (map.current.getLayer(`${prev.layerId}-hovered-outline`)) {
              map.current.setFilter(`${prev.layerId}-hovered-outline`, ['==', 'OBJECTID', '']);
            }
            hoveredRef.current = null;
          }
          map.current!.getCanvas().style.cursor = '';
        }
      } catch (err) {
        // If querying fails for any reason, ensure cursor resets and don't throw
        map.current!.getCanvas().style.cursor = '';
      }
    };

    // Add mousemove event listener
    map.current.on('mousemove', handleMouseMove);

    // Cleanup function to remove event listener
    return () => {
      if (map.current) {
        map.current.off('mousemove', handleMouseMove);
      }
    };
  }, [selectedLayers, mapReady]);

  // Handle base map toggle
  useEffect(() => {
    if (map.current && mapReady) {
      const style = showBaseMap 
        ? 'mapbox://styles/mapbox/streets-v12'
        : 'mapbox://styles/mapbox/light-v11';
      map.current.setStyle(style);
    }
  }, [showBaseMap, mapReady]);

  // Reorder layers when selectedLayers change to maintain proper stacking
  useEffect(() => {
    if (!mapReady || !map.current || Object.keys(layers).length === 0) return;

    // Reorder layers after a short delay to ensure all layers are loaded
    const timer = setTimeout(() => {
      reorderAllLayers();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedLayers, mapReady, layers]);

  // Handle feature updates
  useEffect(() => {
    if (onFeatureUpdated) {
      // Refresh commercial buildings layer when feature is updated
      refreshCommercialBuildingsLayer();
    }
  }, [onFeatureUpdated]);



  // Helper function to make colors darker
  const makeColorDarker = (color: string, factor: number): string => {
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

  // Deterministic color from string (for WADMKD)
  const colorFromString = (value: string): string => {
    // Simple hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0; // Convert to 32bit int
    }
    // Map hash to HSL
    const hue = Math.abs(hash) % 360;
    const saturation = 60; // percent
    const lightness = 60; // percent
    return hslToHex(hue, saturation, lightness);
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    // Convert to [0,1]
    const s1 = s / 100;
    const l1 = l / 100;
    const c = (1 - Math.abs(2 * l1 - 1)) * s1;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l1 - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const r255 = Math.round((r + m) * 255);
    const g255 = Math.round((g + m) * 255);
    const b255 = Math.round((b + m) * 255);
    return `#${r255.toString(16).padStart(2, '0')}${g255.toString(16).padStart(2, '0')}${b255.toString(16).padStart(2, '0')}`;
  };

  // Load layers when map is ready
  useEffect(() => {
    if (!mapReady || !map.current) return;

    console.log('Layer loading effect triggered');
    console.log('Map ready:', mapReady);
    console.log('Selected layers:', selectedLayers);
    console.log('Current layers state:', layers);
    console.log('Loading state:', loading);

            // Sort layers by priority to ensure proper loading order
        const sortedLayers = [...selectedLayers].sort((a, b) => {
          const getPriority = (layerId: string) => {
            switch (layerId) {
              case 'layer-administrasi': return 1;
              case 'layer-kawasan-lahan-terbangun': return 2;
              case 'layer-sebaran-rumah-komersil': return 3;
              case 'layer-kawasan-rawan-bencana': return 4;
              case 'layer-kawasan-rencana-pola-ruang': return 5;
              case 'layer-kemiringan-lereng': return 6;
              default: return 10;
            }
          };
          return getPriority(a) - getPriority(b);
        });

    // Load selected layers in priority order
    sortedLayers.forEach(layerId => {
      console.log(`Processing layer: ${layerId}`);
      if (!layers[layerId] && !loading[layerId]) {
        console.log(`Loading layer: ${layerId}`);
        loadLayer(layerId);
      } else {
        console.log(`Layer ${layerId} already loaded or loading`);
      }
    });

    // Remove unselected layers
    Object.keys(layers).forEach(layerId => {
      if (!selectedLayers.includes(layerId)) {
        console.log(`Removing layer: ${layerId}`);
        removeLayer(layerId);
      }
    });

    // Reorder layers after loading to ensure proper stacking
    if (Object.keys(layers).length > 0) {
      // Use setTimeout to ensure all layers are fully loaded before reordering
      setTimeout(() => {
        reorderAllLayers();
      }, 100);
    }
  }, [mapReady, selectedLayers]);

  // Render uploaded GeoJSON layers dynamically
  useEffect(() => {
    if (!mapReady || !map.current) return;

    uploadedLayers.forEach((u) => {
      const layerId = u.id;
      if (map.current!.getSource(layerId)) return;

      try {
        map.current!.addSource(layerId, { type: 'geojson', data: u.data });

        // Simple styling: polygons filled, lines stroked, points circles
        const hasPolygons = (u.data.features || []).some((f: any) => f.geometry?.type?.includes('Polygon'));
        const hasLines = (u.data.features || []).some((f: any) => f.geometry?.type?.includes('Line'));
        const hasPoints = (u.data.features || []).some((f: any) => f.geometry?.type === 'Point' || f.geometry?.type === 'MultiPoint');

        if (hasPolygons) {
          map.current!.addLayer({
            id: `${layerId}-fill`,
            type: 'fill',
            source: layerId,
            paint: {
              'fill-color': '#ff6b6b',
              'fill-opacity': 0.4
            }
          });
          map.current!.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: layerId,
            paint: { 'line-color': '#c0392b', 'line-width': 2 }
          });
        }

        if (hasLines) {
          map.current!.addLayer({
            id: `${layerId}-line`,
            type: 'line',
            source: layerId,
            paint: { 'line-color': '#2980b9', 'line-width': 3 }
          });
        }

        if (hasPoints) {
          map.current!.addLayer({
            id: `${layerId}-circle`,
            type: 'circle',
            source: layerId,
            paint: { 'circle-radius': 5, 'circle-color': '#27ae60', 'circle-stroke-width': 1, 'circle-stroke-color': '#145a32' }
          });
        }
      } catch (e) {
        // ignore duplicate add errors
      }
    });
  }, [mapReady, uploadedLayers]);

  // Handle camera movement for selected administrative areas
  useEffect(() => {
    if (!map.current || !selectedKecamatan) return;

    // Find the feature that matches the selected kecamatan
    const source = map.current.getSource('layer-administrasi') as mapboxgl.GeoJSONSource;
    if (source && source._data && typeof source._data !== 'string') {
      const geoJsonData = source._data as GeoJSON.FeatureCollection;
      const feature = geoJsonData.features.find((f: any) => 
        f.properties.WADMKC === selectedKecamatan
      );

      if (feature && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        const center = getPolygonCenter((feature.geometry as any).coordinates);
        if (center) {
          map.current.flyTo({
            center: center as [number, number],
            zoom: 10,
            duration: 2000,
            essential: true
          });
        }
      }
    }
  }, [selectedKecamatan]);

  // Handle camera movement for selected kelurahan
  useEffect(() => {
    if (!map.current || !selectedKelurahan || !selectedKecamatan || selectedKelurahan === 'All Kelurahan/Desa') return;

    // Find the feature that matches both kecamatan and kelurahan
    const source = map.current.getSource('layer-administrasi') as mapboxgl.GeoJSONSource;
    if (source && source._data && typeof source._data !== 'string') {
      const geoJsonData = source._data as GeoJSON.FeatureCollection;
      const feature = geoJsonData.features.find((f: any) => 
        f.properties.WADMKC === selectedKecamatan && 
        f.properties.WADMKD === selectedKelurahan
      );

      if (feature && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        const center = getPolygonCenter((feature.geometry as any).coordinates);
        if (center) {
          // Calculate the bounding box of the feature for optimal zoom
          const bounds = getFeatureBounds(feature.geometry);
          if (bounds) {
            // Fit the map to the feature bounds with padding
            map.current.fitBounds(bounds, {
              padding: 50,
              duration: 2000,
              essential: true
            });
          } else {
            // Fallback to center with high zoom
            map.current.flyTo({
              center: center as [number, number],
              zoom: 16,
              duration: 2000,
              essential: true
            });
          }
        }
      }
    }
  }, [selectedKelurahan, selectedKecamatan]);

  // Load a single layer
  const loadLayer = async (layerId: string) => {
    console.log(`loadLayer called for: ${layerId}`);
    const config = layerConfigs[layerId];
    if (!config) {
      console.log(`No config found for layer: ${layerId}`);
      return;
    }

    console.log(`Loading layer config:`, config);
    setLoading(prev => ({ ...prev, [layerId]: true }));

    try {
      let data: any = null;
      if (Array.isArray(config.url)) {
        // Special handling for multi-source layers: build separate sublayers per source
        const results = await Promise.all(
          config.url.map(async (u) => {
            try {
              const res = await fetch(u);
              if (!res.ok) return { url: u, data: null };
              const json = await res.json();
              return { url: u, data: json };
            } catch {
              return { url: u, data: null };
            }
          })
        );

        // Color and label per known hazard type inferred from URL
        const styleForUrl = (u: string) => {
          const lower = u.toLowerCase();
          if (lower.includes('gempa')) {
            return { fill: '#2980b9', outline: '#1c5a80', label: 'Rawan bencana gempa bumi' };
          }
          if (lower.includes('gerakan_tanah') || lower.includes('gerakan-tanah')) {
            return { fill: '#8e6b3a', outline: '#6b4f2a', label: 'Rawan bencana gerakan tanah' };
          }
          if (lower.includes('banjir')) {
            return { fill: '#e74c3c', outline: '#a83226', label: 'Rawan bencana banjir' };
          }
          return { fill: config.color, outline: config.outlineColor, label: 'Kawasan rawan bencana' };
        };

        for (const item of results) {
          if (!item || !item.data) continue;
          const subId = `${layerId}-${item.url.split('/').pop()!.replace(/\.[^/.]+$/, '')}`;

          // Add sub source
          if (!map.current!.getSource(subId)) {
            map.current!.addSource(subId, { type: 'geojson', data: item.data });
          }

          const style = styleForUrl(item.url);

          // Add polygon fill if present
          const hasPolygons = (item.data.features || []).some((f: any) => f.geometry?.type?.includes('Polygon'));
          if (hasPolygons && !map.current!.getLayer(`${subId}-fill`)) {
            map.current!.addLayer({
              id: `${subId}-fill`,
              type: 'fill',
              source: subId,
              paint: { 'fill-color': style.fill, 'fill-opacity': 0.35 }
            });
          }
          if (hasPolygons && !map.current!.getLayer(`${subId}-outline`)) {
            map.current!.addLayer({
              id: `${subId}-outline`,
              type: 'line',
              source: subId,
              paint: { 'line-color': style.outline, 'line-width': 2 }
            });
          }

          // Add line styling if lines present
          const hasLines = (item.data.features || []).some((f: any) => f.geometry?.type?.includes('Line'));
          if (hasLines && !map.current!.getLayer(`${subId}-line`)) {
            map.current!.addLayer({
              id: `${subId}-line`,
              type: 'line',
              source: subId,
              paint: { 'line-color': style.outline, 'line-width': 3 }
            });
          }

          // Create centered label for the dataset with dynamic hazard class labels
          const labelFeatures: GeoJSON.Feature[] = (item.data.features || [])
            .map((feature: any) => {
              const geom = feature?.geometry;
              if (!geom) return null as any;
              // Only label polygonal features for center placement
              if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
                const center = getPolygonCenter(geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates);
                if (center && Array.isArray(center) && center.length === 2) {
                  // Create dynamic label based on hazard type and class
                  let dynamicLabel = '';
                  let hazardClass = '';
                  
                  if (item.url.toLowerCase().includes('gempa')) {
                    // Earthquake uses "UNSUR" property
                    hazardClass = feature.properties?.UNSUR || '';
                    dynamicLabel = `Gempa Bumi\nTingkat: ${hazardClass}`;
                  } else if (item.url.toLowerCase().includes('gerakan_tanah') || item.url.toLowerCase().includes('gerakan-tanah')) {
                    // Landslide uses "Unsur" property
                    hazardClass = feature.properties?.Unsur || '';
                    dynamicLabel = `Gerakan Tanah\nTingkat: ${hazardClass}`;
                  } else if (item.url.toLowerCase().includes('banjir')) {
                    // Flood uses "class" property
                    hazardClass = feature.properties?.class || '';
                    dynamicLabel = `Banjir\nTingkat: ${hazardClass}`;
                  } else {
                    hazardClass = feature.properties?.class || feature.properties?.CLASS || feature.properties?.Unsur || feature.properties?.UNSUR || '';
                    dynamicLabel = style.label;
                  }
                  
                  return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: center },
                    properties: { 
                      label: dynamicLabel,
                      hazardClass: hazardClass,
                      hazardType: item.url.toLowerCase().includes('gempa') ? 'gempa' : 
                                   item.url.toLowerCase().includes('gerakan_tanah') || item.url.toLowerCase().includes('gerakan-tanah') ? 'gerakan_tanah' :
                                   item.url.toLowerCase().includes('banjir') ? 'banjir' : 'unknown'
                    }
                  } as GeoJSON.Feature;
                }
              }
              return null as any;
            })
            .filter(Boolean);

          const labelSourceId = `${subId}-labels`;
          const labelData: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: labelFeatures };
          const existingLabelSource = map.current!.getSource(labelSourceId) as mapboxgl.GeoJSONSource | undefined;
          if (existingLabelSource && typeof existingLabelSource.setData === 'function') {
            existingLabelSource.setData(labelData as any);
          } else if (!existingLabelSource) {
            map.current!.addSource(labelSourceId, { type: 'geojson', data: labelData });
          }

          const subLabelLayer = `${subId}-labels-symbol`;
          if (!map.current!.getLayer(subLabelLayer)) {
            map.current!.addLayer({
              id: subLabelLayer,
              type: 'symbol',
              source: labelSourceId,
              layout: {
                'text-field': ['get', 'label'],
                'text-size': 12,
                'text-font': ['Open Sans Bold'],
                'text-anchor': 'center'
              },
              paint: {
                'text-color': '#111111',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
              }
            });
          }
        }

        // Store umbrella layer presence
        setLayers(prev => ({ ...prev, [layerId]: { source: layerId, config } }));
        return; // do not proceed with generic single-source flow
      } else {
        const response = await fetch(config.url);
        data = await response.json();
      }

      if (map.current) {
        // Ensure interactive identifier exists for hover/click filters
        if (data && Array.isArray(data.features)) {
          data.features = data.features.map((f: any, idx: number) => {
            if (!f.properties) f.properties = {};
            if (typeof f.properties.OBJECTID === 'undefined' || f.properties.OBJECTID === null) {
              f.properties.OBJECTID = idx + 1;
            }
            return f;
          });
        }

        // Add source
        map.current.addSource(layerId, {
          type: 'geojson',
          data: data
        });

        // If data has WADMKD, create a deterministic color map; else use uniform color
        let fillPaint: any = {
          'fill-color': config.color,
          'fill-opacity': 0.3
        };
        const hasWADMKD = (data.features || []).some((f: any) => typeof f?.properties?.WADMKD === 'string');
        if (hasWADMKD) {
          const uniqueKelurahan: string[] = Array.from(
            new Set(
              (data.features || [])
                .map((f: any) => f?.properties?.WADMKD)
                .filter((v: any) => typeof v === 'string' && v.length > 0)
            )
          );
          const matchExpr: any[] = ['match', ['get', 'WADMKD']];
          uniqueKelurahan.forEach((name) => {
            matchExpr.push(name, colorFromString(name));
          });
          matchExpr.push(config.color);
          fillPaint = { 'fill-color': matchExpr as any, 'fill-opacity': 0.3 };
        }

        // Define layer order based on priority
        const getLayerOrder = (layerId: string) => {
          switch (layerId) {
            case 'layer-administrasi':
              return 1; // Bottom layer
            case 'layer-sebaran-rumah-komersil':
              return 2; // Above administrative
            case 'layer-kawasan-lahan-terbangun':
              return 3;
            case 'layer-kawasan-rawan-bencana':
              return 4;
            case 'layer-kawasan-rencana-pola-ruang':
              return 5;
            case 'layer-kemiringan-lereng':
              return 6;
            default:
              return 10; // Default for other layers
          }
        };

        const layerOrder = getLayerOrder(layerId);

        // Add fill layer
        map.current.addLayer({
          id: `${layerId}-fill`,
          type: 'fill',
          source: layerId,
          paint: fillPaint
        });

        // Add outline layer
        map.current.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': config.outlineColor,
            'line-width': 1
          }
        });

        // Add highlighted layer (initially hidden)
        map.current.addLayer({
          id: `${layerId}-highlighted`,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': makeColorDarker(config.color, 0.3),
            'fill-opacity': 0.8
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });

        // Add highlighted outline layer
        map.current!.addLayer({
          id: `${layerId}-highlighted-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': makeColorDarker(config.outlineColor, 0.3),
            'line-width': 3
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });

        // Add hovered layer (initially hidden)
        map.current!.addLayer({
          id: `${layerId}-hovered`,
          type: 'fill',
          source: layerId,
          paint: {
            'fill-color': makeColorDarker(config.color, 0.15),
            'fill-opacity': 0.6
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });

        // Add hovered outline layer (initially hidden)
        map.current!.addLayer({
          id: `${layerId}-hovered-outline`,
          type: 'line',
          source: layerId,
          paint: {
            'line-color': makeColorDarker(config.outlineColor, 0.15),
            'line-width': 2
          },
          filter: ['==', 'OBJECTID', ''] // Initially no features shown
        });

        // Ensure proper layer stacking order
        ensureLayerOrder(layerId, layerOrder);

        // Add labels for administrative layer
        if (layerId === 'layer-administrasi') {
          addLabels(layerId, data);
        }
        
        // Add labels for commercial buildings layer
        if (layerId === 'layer-sebaran-rumah-komersil') {
          console.log('About to add commercial building labels...');
          addCommercialBuildingLabels(layerId, data);
          console.log('Finished adding commercial building labels');
        }

        // Note: Click events are handled globally in the map click handler

        // Add hover effects (cursor only)
        map.current.on('mouseenter', `${layerId}-fill`, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', `${layerId}-fill`, () => {
          map.current!.getCanvas().style.cursor = '';
        });

        // Enhanced debugging for commercial buildings layer events
        if (layerId === 'layer-sebaran-rumah-komersil') {
          console.log('Commercial buildings layer events bound');
          console.log('Fill layer ID:', `${layerId}-fill`);
          console.log('Layer exists:', map.current.getLayer(`${layerId}-fill`));
        }

        setLayers(prev => ({ ...prev, [layerId]: { source: layerId, config } }));
      }
    } catch (error) {
      console.error(`Error loading ${config.name}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [layerId]: false }));
    }
  };

  // Ensure proper layer stacking order
  const ensureLayerOrder = (layerId: string, targetOrder: number) => {
    if (!map.current) return;

    try {
      // Get all layers for this specific layer group
      const layerSuffixes = ['-fill', '-outline', '-highlighted', '-highlighted-outline', '-hovered', '-hovered-outline', '-labels', '-labels-commercial', '-labels-kecamatan', '-labels-kelurahan', '-labels-symbol'];
      const layersToOrder = layerSuffixes
        .map(suffix => `${layerId}${suffix}`)
        .filter(id => map.current!.getLayer(id));

      if (layersToOrder.length === 0) return;

      // Get the current map style layers
      const styleLayers = map.current.getStyle().layers || [];
      
      // Find the target position based on layer order
      let targetPosition = 0;
      
      if (targetOrder === 1) {
        // For administrative layer, place at the beginning (after base map layers)
        targetPosition = 0;
      } else {
        // For other layers, find the position after the previous layer group
        // Look for the last layer of the previous priority group
        for (let i = styleLayers.length - 1; i >= 0; i--) {
          const layer = styleLayers[i];
          if (layer.id.includes('-highlighted-outline') && !layer.id.includes(layerId)) {
            targetPosition = i + 1;
            break;
          }
        }
      }

      // Move all layers for this layer group to the correct position
      // Sort layers to ensure proper stacking: fill -> outline -> highlighted -> labels
      const sortedLayers = layersToOrder.sort((a, b) => {
        const getLayerPriority = (layerId: string) => {
          if (layerId.includes('-fill')) return 1;
          if (layerId.includes('-outline')) return 2;
          if (layerId.includes('-highlighted')) return 3;
          if (layerId.includes('-hovered')) return 4;
          if (layerId.includes('-labels')) return 5; // Labels should be on top
          return 6;
        };
        return getLayerPriority(a) - getLayerPriority(b);
      });

      sortedLayers.forEach((layerId, index) => {
        try {
          if (targetPosition === 0) {
            // For first position, move to the beginning
            map.current!.moveLayer(layerId);
          } else {
            // For other positions, find a reference layer and move relative to it
            const referenceLayer = styleLayers[targetPosition - 1];
            if (referenceLayer) {
              map.current!.moveLayer(layerId, referenceLayer.id);
            }
          }
        } catch (e) {
          // Layer might already be in the right position
          console.log(`Layer ${layerId} already in position or couldn't be moved`);
        }
      });

      console.log(`Layer ${layerId} positioned at order ${targetOrder}, position ${targetPosition}`);
      console.log(`Layers ordered:`, layersToOrder);
      
      // Debug: Log current layer order
      const currentLayers = map.current.getStyle().layers || [];
      console.log(`Current map layers order:`, currentLayers.map(l => l.id));
    } catch (error) {
      console.error(`Error ensuring layer order for ${layerId}:`, error);
    }
  };

  // Reorder all layers to maintain proper stacking
  const reorderAllLayers = () => {
    if (!map.current) return;

    try {
      // Get all loaded layers and sort them by priority
      const loadedLayers = Object.keys(layers).sort((a, b) => {
        const getPriority = (layerId: string) => {
          switch (layerId) {
            case 'layer-administrasi': return 1;
            case 'layer-kawasan-lahan-terbangun': return 2;
            case 'layer-sebaran-rumah-komersil': return 3;
            case 'layer-kawasan-rawan-bencana': return 4;
            case 'layer-kawasan-rencana-pola-ruang': return 5;
            case 'layer-kemiringan-lereng': return 6;
            default: return 10;
          }
        };
        return getPriority(a) - getPriority(b);
      });

      // Reorder each layer group
      loadedLayers.forEach((layerId, index) => {
        const priority = index + 1;
        ensureLayerOrder(layerId, priority);
      });

      console.log('All layers reordered successfully');
    } catch (error) {
      console.error('Error reordering all layers:', error);
    }
  };

  // Refresh commercial buildings layer data
  const refreshCommercialBuildingsLayer = async () => {
    if (!map.current || !layers['layer-sebaran-rumah-komersil']) return;

    try {
      console.log('Refreshing commercial buildings layer data...');
      
      // Fetch updated data from KV storage
      const response = await fetch('/api/data/get-rumah-komersil');
      if (!response.ok) {
        console.error('Failed to fetch updated data');
        return;
      }

      const updatedData = await response.json();
      
      // Update the source data
      const source = map.current.getSource('layer-sebaran-rumah-komersil') as mapboxgl.GeoJSONSource;
      if (source && typeof source.setData === 'function') {
        source.setData(updatedData);
        console.log('Commercial buildings layer data refreshed successfully');
      }
      
      // Also refresh the labels
      const labelSource = map.current.getSource('layer-sebaran-rumah-komersil-labels') as mapboxgl.GeoJSONSource;
      if (labelSource && typeof labelSource.setData === 'function') {
        // Recreate label data from updated source
        const labelData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: updatedData.features.map((feature: any) => {
            const center = getPolygonCenter(feature.geometry.coordinates);
            if (center) {
              // Calculate area in square meters
              const area = calculatePolygonArea(feature.geometry.coordinates);
              const areaText = area ? `${Math.round(area)} m²` : '';
              
              // Combine name and area with line break
              const labelText = feature.properties.namaKawasanPerumahan || feature.properties.nama_kawasan || 'Unnamed';
              const combinedLabel = areaText ? `${labelText}\n${areaText}` : labelText;
              
              return {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: center
                },
                properties: {
                  combinedLabel: combinedLabel,
                  featureId: feature.properties.feature_id || feature.properties.OBJECTID || feature.properties.Id
                }
              } as GeoJSON.Feature;
            }
            return null;
          }).filter(Boolean) as GeoJSON.Feature[]
        };
        
        labelSource.setData(labelData);
        console.log('Commercial buildings labels refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing commercial buildings layer:', error);
    }
  };

  // Remove a layer
  const removeLayer = (layerId: string) => {
    if (!map.current || !layers[layerId]) return;

    try {
      // Remove any layers whose id starts with `${layerId}-`
      const allLayers = map.current.getStyle().layers || [];
      for (const lyr of allLayers) {
        if (lyr.id === `${layerId}-fill` || lyr.id.startsWith(`${layerId}-`)) {
          if (map.current.getLayer(lyr.id)) {
            map.current.removeLayer(lyr.id);
          }
        }
      }

      // Remove sources starting with `${layerId}-` and the base source
      const style = map.current.getStyle() as any;
      const sources = style?.sources ? Object.keys(style.sources) : [];
      for (const srcId of sources) {
        if (srcId === layerId || srcId.startsWith(`${layerId}-`)) {
          if (map.current.getSource(srcId)) {
            try { map.current.removeSource(srcId); } catch {}
          }
        }
      }

      // Remove from layers state
      setLayers(prev => {
        const newLayers = { ...prev };
        delete newLayers[layerId];
        return newLayers;
      });
    } catch (error) {
      console.error(`Error removing layer ${layerId}:`, error);
    }
  };

  // Add labels for administrative features
  const addLabels = (layerId: string, data: any) => {
    if (!map.current) return;

    // Add label source
    const labelData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.features.map((feature: any) => {
        const center = getPolygonCenter(feature.geometry.coordinates);
        if (center) {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: center
            },
            properties: {
              kecamatan: feature.properties.WADMKC || '',
              kelurahan: feature.properties.WADMKD || '',
              featureId: feature.properties.OBJECTID
            }
          } as GeoJSON.Feature;
        }
        return null;
      }).filter(Boolean) as GeoJSON.Feature[]
    };

    const labelSourceId = `${layerId}-labels`;
    const existingLabelSource = map.current.getSource(labelSourceId) as mapboxgl.GeoJSONSource | undefined;
    if (existingLabelSource) {
      if (typeof existingLabelSource.setData === 'function') {
        existingLabelSource.setData(labelData as any);
      }
    } else {
      map.current.addSource(labelSourceId, {
        type: 'geojson',
        data: labelData
      });
    }

    // Add Kecamatan labels
    const kecLayerId = `${layerId}-labels-kecamatan`;
    if (!map.current.getLayer(kecLayerId)) {
      map.current.addLayer({
        id: kecLayerId,
        type: 'symbol',
        source: `${layerId}-labels`,
        filter: ['has', 'kecamatan'],
        layout: {
          'text-field': ['get', 'kecamatan'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-offset': [0, 0]
        },
        paint: {
          'text-color': '#1a1a1a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }

    // Add Kelurahan labels
    const kelLayerId = `${layerId}-labels-kelurahan`;
    if (!map.current.getLayer(kelLayerId)) {
      map.current.addLayer({
        id: kelLayerId,
        type: 'symbol',
        source: `${layerId}-labels`,
        filter: ['has', 'kelurahan'],
        layout: {
          'text-field': ['get', 'kelurahan'],
          'text-font': ['Open Sans Regular'],
          'text-size': 10,
          'text-anchor': 'center',
          'text-offset': [0, -0.002]
        },
        paint: {
          'text-color': '#666666',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });
    }
  };

  // Add labels for commercial building features
  const addCommercialBuildingLabels = (layerId: string, data: any) => {
    if (!map.current) return;

    console.log('Adding commercial building labels for layer:', layerId);
    console.log('Data features count:', data.features?.length || 0);

    // Add label source for commercial buildings
    const labelData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.features.map((feature: any, index: number) => {
        const center = getPolygonCenter(feature.geometry.coordinates);
        if (center) {
          const labelText = feature.properties.namaKawasanPerumahan || feature.properties.nama_kawasan || 'Unnamed';
          
          // Calculate area in square meters
          const area = calculatePolygonArea(feature.geometry.coordinates);
          const areaText = area ? `${Math.round(area)} m²` : '';
          
          // Combine name and area with line break
          const combinedLabel = areaText ? `${labelText}\n${areaText}` : labelText;
          
          console.log(`Feature ${index}: center=${center}, label="${labelText}", area=${areaText}`);
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: center
            },
            properties: {
              combinedLabel: combinedLabel,
              featureId: feature.properties.feature_id || feature.properties.OBJECTID || feature.properties.Id
            }
          } as GeoJSON.Feature;
        } else {
          console.log(`Feature ${index}: could not calculate center`);
        }
        return null;
      }).filter(Boolean) as GeoJSON.Feature[]
    };

    console.log('Label data created:', labelData.features.length, 'labels');

    const labelSourceId = `${layerId}-labels`;
    const existingLabelSource = map.current.getSource(labelSourceId) as mapboxgl.GeoJSONSource | undefined;
    if (existingLabelSource) {
      if (typeof existingLabelSource.setData === 'function') {
        existingLabelSource.setData(labelData as any);
        console.log('Updated existing label source');
      }
    } else {
      map.current.addSource(labelSourceId, {
        type: 'geojson',
        data: labelData
      });
      console.log('Created new label source:', labelSourceId);
    }

    // Add combined commercial building labels
    const labelLayerId = `${layerId}-labels-commercial`;
    if (!map.current.getLayer(labelLayerId)) {
      map.current.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: `${layerId}-labels`,
        filter: ['has', 'combinedLabel'],
        layout: {
          'text-field': ['get', 'combinedLabel'],
          'text-font': ['Open Sans Bold'],
          'text-size': 11,
          'text-anchor': 'center',
          'text-offset': [0, 0], // At center
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#8B4513', // Brown color for commercial buildings
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
      console.log('Created combined label layer:', labelLayerId);
      
      // Ensure the label layer is positioned above the fill layer
      try {
        const fillLayerId = `${layerId}-fill`;
        if (map.current.getLayer(fillLayerId)) {
          map.current.moveLayer(labelLayerId, fillLayerId);
          console.log('Moved label layer above fill layer');
        }
      } catch (e) {
        console.log('Could not move label layer:', e);
      }
    } else {
      console.log('Label layer already exists:', labelLayerId);
    }
  };

  // Helper to get the bounding box of a GeoJSON feature
  const getFeatureBounds = (geometry: any): mapboxgl.LngLatBoundsLike | null => {
    if (!geometry || !geometry.coordinates) return null;

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    let hasValidCoords = false;

    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0]; // First ring (exterior boundary)
      for (const coord of coords) {
        if (Array.isArray(coord) && coord.length >= 2) {
          const [lng, lat] = coord;
          if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            hasValidCoords = true;
          }
        }
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        const coords = polygon[0]; // First ring of each polygon
        for (const coord of coords) {
          if (Array.isArray(coord) && coord.length >= 2) {
            const [lng, lat] = coord;
            if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              hasValidCoords = true;
            }
          }
        }
      }
    }

    if (!hasValidCoords) return null;

    return [
      [minLng, minLat], // Southwest
      [maxLng, maxLat]  // Northeast
    ];
  };

  // Helper to get the center of a polygon
  const getPolygonCenter = (coordinates: any) => {
    if (!coordinates || coordinates.length === 0) {
      console.log('getPolygonCenter: No coordinates provided');
      return null;
    }

    console.log('getPolygonCenter input:', {
      coordinatesLength: coordinates.length,
      firstPolygon: coordinates[0],
      firstPolygonLength: coordinates[0]?.length,
      firstRing: coordinates[0]?.[0],
      firstRingLength: coordinates[0]?.[0]?.length
    });

    // Handle different coordinate structures:
    // 1. Polygon: [[[x,y], [x,y], ...]] -> coordinates[0] is the ring
    // 2. MultiPolygon: [[[[x,y], [x,y], ...]], [[[x,y], [x,y], ...]]] -> coordinates[0][0] is the first ring
    // 3. Some hazard layers might have: [[[[x,y,z], [x,y,z], ...]]] -> coordinates[0][0] is the ring
    
    let ring = null;
    
    // Try to find the ring array
    if (coordinates[0] && Array.isArray(coordinates[0])) {
      if (coordinates[0][0] && Array.isArray(coordinates[0][0]) && coordinates[0][0].length > 0) {
        // This looks like coordinates[0][0] contains coordinate pairs
        if (Array.isArray(coordinates[0][0][0]) && coordinates[0][0][0].length >= 2) {
          // coordinates[0][0] is the ring
          ring = coordinates[0][0];
        } else {
          // coordinates[0] is the ring
          ring = coordinates[0];
        }
      } else {
        // coordinates[0] is the ring
        ring = coordinates[0];
      }
    }
    
    if (!ring || ring.length < 3) {
      console.log('getPolygonCenter: Invalid ring:', { ring, length: ring?.length });
      return null;
    }

    console.log('getPolygonCenter: Processing ring with', ring.length, 'coordinates');

    // Calculate centroid using shoelace formula
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < ring.length - 1; i++) {
      const coord1 = ring[i];
      const coord2 = ring[i + 1];
      
      // Extract longitude and latitude (first two values)
      const x1 = coord1[0]; // longitude
      const y1 = coord1[1]; // latitude
      const x2 = coord2[0]; // longitude
      const y2 = coord2[1]; // latitude
      
      if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) || 
          !isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
        console.log('getPolygonCenter: Invalid coordinate values:', { coord1, coord2 });
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
      
      console.log('getPolygonCenter: Centroid calculated successfully:', [centroidX, centroidY]);
      return [centroidX, centroidY];
    } else {
      console.log('getPolygonCenter: Area too small for centroid, trying bounding box...');
    }

    // Fallback to bounding box center if centroid calculation fails
    console.log('getPolygonCenter: Trying bounding box fallback...');
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let validCoords = 0;

    for (const coord of ring) {
      if (Array.isArray(coord) && coord.length >= 2) {
        const x = coord[0]; // longitude
        const y = coord[1]; // latitude
        
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
        console.log('getPolygonCenter: Bounding box center calculated:', [centerX, centerY]);
        return [centerX, centerY];
      }
    }

    console.log('getPolygonCenter: All methods failed');
    return null;
  };

  // Helper to calculate polygon area in square meters
  const calculatePolygonArea = (coordinates: any): number | null => {
    if (!coordinates || coordinates.length === 0) {
      return null;
    }

    try {
      // For Polygon, coordinates[0] is the ring array
      const ring = coordinates[0];
      if (!ring || ring.length < 3) {
        return null;
      }

      // Calculate area using shoelace formula
      let area = 0;
      
      for (let i = 0; i < ring.length - 1; i++) {
        const coord1 = ring[i];
        const coord2 = ring[i + 1];
        
        if (Array.isArray(coord1) && Array.isArray(coord2) && 
            coord1.length >= 2 && coord2.length >= 2) {
          const x1 = coord1[0]; // longitude
          const y1 = coord1[1]; // latitude
          const x2 = coord2[0]; // longitude
          const y2 = coord2[1]; // latitude
          
          if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2) && 
              isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
            const cross = x1 * y2 - x2 * y1;
            area += cross;
          }
        }
      }

      // Close the polygon by connecting last point to first
      if (ring.length > 0) {
        const firstCoord = ring[0];
        const lastCoord = ring[ring.length - 1];
        
        if (Array.isArray(firstCoord) && Array.isArray(lastCoord) && 
            firstCoord.length >= 2 && lastCoord.length >= 2) {
          const x1 = lastCoord[0];
          const y1 = lastCoord[1];
          const x2 = firstCoord[0];
          const y2 = firstCoord[1];
          
          if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2) && 
              isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
            const cross = x1 * y2 - x2 * y1;
            area += cross;
          }
        }
      }

      // Convert to absolute area and approximate to square meters
      // This is a rough approximation - for more accurate results, 
      // you'd need proper geodesic calculations
      const areaInDegrees = Math.abs(area) / 2;
      
      // Rough conversion: 1 degree ≈ 111,000 meters at the equator
      // This is an approximation and will vary by latitude
      const metersPerDegree = 111000;
      const areaInSquareMeters = areaInDegrees * metersPerDegree * metersPerDegree;
      
      return areaInSquareMeters;
    } catch (error) {
      console.error('Error calculating polygon area:', error);
      return null;
    }
  };

  const closeFeatureDrawer = () => {
    // Clear highlighting when drawer is closed
    if (selectedFeature && map.current) {
      const layerId = selectedFeature.layerId;
      map.current.setFilter(`${layerId}-highlighted`, ['==', 'OBJECTID', '']);
      map.current.setFilter(`${layerId}-highlighted-outline`, ['==', 'OBJECTID', '']);
      // Also clear any hover highlight
      if (map.current.getLayer(`${layerId}-hovered`)) {
        map.current.setFilter(`${layerId}-hovered`, ['==', 'OBJECTID', '']);
      }
      if (map.current.getLayer(`${layerId}-hovered-outline`)) {
        map.current.setFilter(`${layerId}-hovered-outline`, ['==', 'OBJECTID', '']);
      }
      setSelectedFeature(null);
    }

    setFeatureDrawer({
      isOpen: false,
      featureData: null,
      layerName: ''
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading indicator */}
      {Object.values(loading).some(Boolean) && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">Loading layers...</span>
          </div>
        </div>
      )}

      {/* Map Interaction Indicator when drawer is open */}
      {featureDrawer.isOpen && (
        <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm border border-white/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Map remains interactive</span>
          </div>
        </div>
      )}

      {/* Feature Drawer */}
      <FeatureDrawer
        isOpen={featureDrawer.isOpen}
        onClose={closeFeatureDrawer}
        featureData={featureDrawer.featureData}
        layerName={featureDrawer.layerName}
        onFeatureUpdated={refreshCommercialBuildingsLayer}
      />
    </div>
  );
}
